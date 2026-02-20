import { prisma } from "@repo/prisma";
import { redis, withRedisFallback } from "@repo/shared/redis";

export const LOCK_TTL_SECONDS = 5 * 60;
const LOCK_COMPARE_ATTEMPTS = 3;

function lockKey(workflowRunId: string): string {
    return `lock:workflow-run:${workflowRunId}`;
}

function getLockStaleBeforeDate(ttlSeconds: number = LOCK_TTL_SECONDS): Date {
    return new Date(Date.now() - Math.max(1, Math.floor(ttlSeconds)) * 1000);
}

async function acquireDbLock(workflowRunId: string, workerId: string, ttlSeconds: number = LOCK_TTL_SECONDS): Promise<boolean> {
    const now = new Date();
    const staleBefore = getLockStaleBeforeDate(ttlSeconds);
    const result = await prisma.workflowRun.updateMany({
        where: {
            id: workflowRunId,
            OR: [
                { lockedAt: null },
                { lockedAt: { lt: staleBefore } },
                { lockedBy: workerId },
            ],
        },
        data: {
            lockedAt: now,
            lockedBy: workerId,
        },
    });
    return result.count > 0;
}

async function releaseDbLock(workflowRunId: string, workerId: string): Promise<boolean> {
    const result = await prisma.workflowRun.updateMany({
        where: {
            id: workflowRunId,
            lockedBy: workerId,
        },
        data: {
            lockedAt: null,
            lockedBy: null,
        },
    });
    return result.count > 0;
}

async function renewDbLock(workflowRunId: string, workerId: string): Promise<boolean> {
    const result = await prisma.workflowRun.updateMany({
        where: {
            id: workflowRunId,
            lockedBy: workerId,
        },
        data: {
            lockedAt: new Date(),
        },
    });
    return result.count > 0;
}

async function isDbLocked(workflowRunId: string, ttlSeconds: number = LOCK_TTL_SECONDS): Promise<boolean> {
    const run = await prisma.workflowRun.findUnique({
        where: { id: workflowRunId },
        select: { lockedAt: true },
    });
    if (!run?.lockedAt) {
        return false;
    }
    return run.lockedAt >= getLockStaleBeforeDate(ttlSeconds);
}

async function mutateLockIfOwned(workflowRunId: string, workerId: string, mutate: (transaction: ReturnType<typeof redis.multi>) => void): Promise<boolean> {
    const key = lockKey(workflowRunId);
    for (let attempt = 0; attempt < LOCK_COMPARE_ATTEMPTS; attempt += 1) {
        await redis.watch(key);
        try {
            const currentOwner = await redis.get(key);
            if (currentOwner !== workerId) {
                return false;
            }
            const transaction = redis.multi();
            mutate(transaction);
            const result = await transaction.exec();
            if (result === null) {
                continue;
            }
            const [, affectedRows] = result[0] ?? [null, 0];
            return Number(affectedRows) > 0;
        }
        finally {
            await redis.unwatch().catch(() => { });
        }
    }
    return false;
}

export async function acquireLock(workflowRunId: string, workerId: string): Promise<boolean> {
    return withRedisFallback('worker-lock:acquire', async () => {
        const result = await redis.set(lockKey(workflowRunId), workerId, 'EX', LOCK_TTL_SECONDS, 'NX');
        return result === 'OK';
    }, async () => acquireDbLock(workflowRunId, workerId, LOCK_TTL_SECONDS));
}

export async function releaseLock(workflowRunId: string, workerId: string): Promise<boolean> {
    return withRedisFallback('worker-lock:release', async () => mutateLockIfOwned(workflowRunId, workerId, (transaction) => {
        transaction.del(lockKey(workflowRunId));
    }), async () => releaseDbLock(workflowRunId, workerId));
}

export async function renewLock(workflowRunId: string, workerId: string, ttlSeconds: number = LOCK_TTL_SECONDS): Promise<boolean> {
    const clampedTtl = Math.max(1, Math.floor(ttlSeconds));
    return withRedisFallback('worker-lock:renew', async () => mutateLockIfOwned(workflowRunId, workerId, (transaction) => {
        transaction.expire(lockKey(workflowRunId), clampedTtl);
    }), async () => renewDbLock(workflowRunId, workerId));
}

export async function isLocked(workflowRunId: string): Promise<boolean> {
    return withRedisFallback('worker-lock:is-locked', async () => {
        const result = await redis.exists(lockKey(workflowRunId));
        return result === 1;
    }, async () => isDbLocked(workflowRunId, LOCK_TTL_SECONDS));
}
