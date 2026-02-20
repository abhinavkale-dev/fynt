import { prisma } from '@repo/prisma';
import { isAutomationDisabledInProduction } from '@repo/shared/automation-flags';
import { getWorkflowQueue } from '@repo/shared/queue';
import { redis, withRedisFallback } from '@repo/shared/redis';
import { RunReservationLockTimeoutError, withUserRunReservationLock, } from '@repo/shared/run-reservation-lock';
import { parseWorkflowNodes, type WorkflowNode } from './engine/types/index.js';
const POLL_INTERVAL_MS = 60000;
const DB_HEALTHCHECK_TIMEOUT_MS = (() => {
    const parsed = Number.parseInt(process.env.CRON_DB_HEALTHCHECK_TIMEOUT_MS ?? '', 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return 5000;
})();
const DB_HEALTHCHECK_RETRIES = (() => {
    const parsed = Number.parseInt(process.env.CRON_DB_HEALTHCHECK_RETRIES ?? '', 10);
    if (Number.isFinite(parsed) && parsed >= 1) {
        return parsed;
    }
    return 2;
})();
const DB_HEALTHCHECK_RETRY_DELAY_MS = (() => {
    const parsed = Number.parseInt(process.env.CRON_DB_HEALTHCHECK_RETRY_DELAY_MS ?? '', 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return 500;
})();
const lastScheduledBucket = new Map<string, string>();
const CRON_DEDUPE_TTL_SECONDS = (() => {
    const parsed = Number.parseInt(process.env.CRON_DEDUPE_TTL_SECONDS ?? '', 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return 8 * 24 * 60 * 60;
})();
type LimitErrorCode = 'MONTHLY_LIMIT' | 'CONCURRENT_LIMIT';
class RunLimitError extends Error {
    constructor(public readonly code: LimitErrorCode, message: string) {
        super(message);
    }
}
function getEffectivePlan(plan: string | null | undefined, paidUntil: Date | null, now: Date): string {
    const normalizedPlan = plan ?? 'free';
    if (normalizedPlan !== 'free' && paidUntil && paidUntil < now) {
        return 'free';
    }
    return normalizedPlan;
}
function getPlanLimits(plan: string | null | undefined): {
    monthlyRunLimit: number;
    maxConcurrent: number;
} {
    const normalizedPlan = plan ?? 'free';
    if (normalizedPlan === 'free') {
        return { monthlyRunLimit: 1000, maxConcurrent: 2 };
    }
    if (normalizedPlan === 'pro') {
        return { monthlyRunLimit: 5000, maxConcurrent: 10 };
    }
    return { monthlyRunLimit: -1, maxConcurrent: 50 };
}
function getMonthKey(now: Date): string {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}
function getCronDedupeKey(workflowId: string, nodeId: string, bucket: string): string {
    return `fg:cron:bucket:${workflowId}:${nodeId}:${bucket}`;
}
async function withRetry<T>(fn: () => Promise<T>, retries = 3, delayMs = 2000): Promise<T> {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            return await fn();
        }
        catch (error) {
            if (attempt === retries)
                throw error;
            console.warn(`[cron-scheduler] Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
            await new Promise((r) => setTimeout(r, delayMs));
            delayMs *= 2;
        }
    }
    throw new Error('Unreachable');
}
function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
    return new Promise<T>((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error(label)), timeoutMs);
        promise
            .then((value) => {
            clearTimeout(timer);
            resolve(value);
        })
            .catch((error) => {
            clearTimeout(timer);
            reject(error);
        });
    });
}
function toCompactErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const maybeCode = typeof (error as {
            code?: unknown;
        }).code === 'string'
            ? (error as {
                code?: string;
            }).code
            : undefined;
        if (maybeCode) {
            return `${maybeCode}: ${error.message}`;
        }
        return error.message;
    }
    return String(error);
}
async function sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
}
async function isDatabaseHealthy(): Promise<boolean> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= DB_HEALTHCHECK_RETRIES; attempt += 1) {
        try {
            await withTimeout(prisma.$queryRaw `SELECT 1`, DB_HEALTHCHECK_TIMEOUT_MS, `Database health check timed out after ${DB_HEALTHCHECK_TIMEOUT_MS}ms`);
            return true;
        }
        catch (error) {
            lastError = error;
            if (attempt < DB_HEALTHCHECK_RETRIES) {
                await sleep(DB_HEALTHCHECK_RETRY_DELAY_MS * attempt);
            }
        }
    }
    if (process.env.NODE_ENV === 'development') {
        console.warn(`[cron-scheduler] DB health check failed after ${DB_HEALTHCHECK_RETRIES} attempt(s), skipping tick. ${toCompactErrorMessage(lastError)}`);
        return false;
    }
    console.warn(`[cron-scheduler] DB health check failed after ${DB_HEALTHCHECK_RETRIES} attempt(s), skipping tick. ${toCompactErrorMessage(lastError)}`);
    return false;
}
function nowUtc() {
    const now = new Date();
    return {
        now,
        minute: now.getUTCMinutes(),
        hour: now.getUTCHours(),
        dayOfWeek: now.getUTCDay(),
        year: now.getUTCFullYear(),
        month: now.getUTCMonth() + 1,
        day: now.getUTCDate(),
    };
}
function resolveSchedule(node: WorkflowNode): {
    schedule: 'every_5_minutes' | 'hourly' | 'daily' | 'weekly';
    hour: number;
    minute: number;
    dayOfWeek: number;
} {
    const data = node.data as Record<string, unknown>;
    const schedule = data.schedule === 'every_5_minutes' || data.schedule === 'hourly' || data.schedule === 'weekly'
        ? data.schedule
        : 'daily';
    const hour = typeof data.hour === 'number' ? Math.max(0, Math.min(23, Math.floor(data.hour))) : 9;
    const minute = typeof data.minute === 'number' ? Math.max(0, Math.min(59, Math.floor(data.minute))) : 0;
    const dayOfWeek = typeof data.dayOfWeek === 'number' ? Math.max(0, Math.min(6, Math.floor(data.dayOfWeek))) : 1;
    return { schedule, hour, minute, dayOfWeek };
}
function isDue(node: WorkflowNode): {
    due: boolean;
    bucket: string;
} {
    const { minute, hour, dayOfWeek, year, month, day } = nowUtc();
    const cfg = resolveSchedule(node);
    if (cfg.schedule === 'every_5_minutes') {
        const due = minute % 5 === 0;
        const bucket = `${year}-${month}-${day}-${hour}-${Math.floor(minute / 5)}`;
        return { due, bucket };
    }
    if (cfg.schedule === 'hourly') {
        const due = minute === cfg.minute;
        const bucket = `${year}-${month}-${day}-${hour}`;
        return { due, bucket };
    }
    if (cfg.schedule === 'weekly') {
        const due = dayOfWeek === cfg.dayOfWeek && hour === cfg.hour && minute === cfg.minute;
        const bucket = `${year}-${month}-${day}`;
        return { due, bucket };
    }
    const due = hour === cfg.hour && minute === cfg.minute;
    const bucket = `${year}-${month}-${day}`;
    return { due, bucket };
}
async function reserveCronRun(params: {
    workflowId: string;
    userId: string;
    nodeId: string;
    bucket: string;
    plan: string | null;
    paidUntil: Date | null;
}): Promise<{
    runId: string;
    month: string;
}> {
    const now = new Date();
    const month = getMonthKey(now);
    const effectivePlan = getEffectivePlan(params.plan, params.paidUntil, now);
    const { monthlyRunLimit, maxConcurrent } = getPlanLimits(effectivePlan);
    const run = await prisma.$transaction(async (tx) => {
        await tx.usageRecord.upsert({
            where: { userId_month: { userId: params.userId, month } },
            create: { userId: params.userId, month, runCount: 0 },
            update: {},
        });
        const pendingRuns = await tx.workflowRun.count({
            where: {
                status: 'Pending',
                workflow: { userId: params.userId },
            },
        });
        if (pendingRuns >= maxConcurrent) {
            throw new RunLimitError('CONCURRENT_LIMIT', `Concurrent workflow limit reached (${maxConcurrent}).`);
        }
        if (monthlyRunLimit !== -1) {
            const reserve = await tx.usageRecord.updateMany({
                where: {
                    userId: params.userId,
                    month,
                    runCount: { lt: monthlyRunLimit },
                },
                data: {
                    runCount: { increment: 1 },
                },
            });
            if (reserve.count === 0) {
                throw new RunLimitError('MONTHLY_LIMIT', `Monthly execution limit reached (${monthlyRunLimit}).`);
            }
        }
        else {
            await tx.usageRecord.update({
                where: { userId_month: { userId: params.userId, month } },
                data: { runCount: { increment: 1 } },
            });
        }
        return tx.workflowRun.create({
            data: {
                workflowId: params.workflowId,
                metadata: {
                    source: 'cron',
                    nodeId: params.nodeId,
                    bucket: params.bucket,
                    scheduledAt: new Date().toISOString(),
                },
            },
        });
    });
    return { runId: run.id, month };
}
async function rollbackRunReservation(runId: string, userId: string, month: string): Promise<void> {
    await prisma.$transaction([
        prisma.workflowRun.update({
            where: { id: runId },
            data: {
                status: 'Failure',
                finishedAt: new Date(),
                errorMetadata: {
                    message: 'Failed to enqueue workflow run from scheduler',
                } as any,
            },
        }),
        prisma.usageRecord.update({
            where: { userId_month: { userId, month } },
            data: {
                runCount: { decrement: 1 },
            },
        }),
    ]);
}
async function tick(): Promise<void> {
    const dbHealthy = await isDatabaseHealthy();
    if (!dbHealthy) {
        return;
    }
    const workflows = await withRetry(() => prisma.workflow.findMany({
        select: {
            id: true,
            userId: true,
            nodes: true,
            user: {
                select: {
                    plan: true,
                    paidUntil: true,
                },
            },
        },
    }));
    for (const workflow of workflows) {
        let nodes: WorkflowNode[] = [];
        try {
            nodes = parseWorkflowNodes(workflow.nodes);
        }
        catch {
            continue;
        }
        const cronNodes = nodes.filter((node) => {
            if (node.type !== 'cronTrigger') {
                return false;
            }
            const data = node.data as Record<string, unknown>;
            return data.isConfigured === true && data.isActive !== false;
        });
        if (cronNodes.length === 0) {
            continue;
        }
        for (const node of cronNodes) {
            if (!workflow.userId || !workflow.user) {
                continue;
            }
            const userId = workflow.userId;
            const user = workflow.user;
            const { due, bucket } = isDue(node);
            if (!due) {
                continue;
            }
            const dedupeKey = `${workflow.id}:${node.id}`;
            if (lastScheduledBucket.get(dedupeKey) === bucket) {
                continue;
            }
            const dedupeRedisKey = getCronDedupeKey(workflow.id, node.id, bucket);
            let dedupeAcquired = false;
            try {
                const setResult = await withRedisFallback(`cron-dedupe:${workflow.id}:${node.id}`, () => redis.set(dedupeRedisKey, '1', 'EX', CRON_DEDUPE_TTL_SECONDS, 'NX'), async () => 'BYPASS_DEDUPE');
                dedupeAcquired = setResult === 'BYPASS_DEDUPE' || setResult === 'OK';
            }
            catch (error) {
                console.error(`[cron-scheduler] Failed to acquire dedupe lock ${workflow.id}/${node.id}:`, error);
                continue;
            }
            if (!dedupeAcquired) {
                lastScheduledBucket.set(dedupeKey, bucket);
                continue;
            }
            lastScheduledBucket.set(dedupeKey, bucket);
            try {
                const reservation = await withUserRunReservationLock(userId, () => reserveCronRun({
                    workflowId: workflow.id,
                    userId,
                    nodeId: node.id,
                    bucket,
                    plan: user.plan,
                    paidUntil: user.paidUntil,
                }));
                try {
                    await getWorkflowQueue().add('process-workflow', { workflowRunId: reservation.runId }, { jobId: reservation.runId });
                }
                catch (error) {
                    await rollbackRunReservation(reservation.runId, userId, reservation.month);
                    throw error;
                }
            }
            catch (error) {
                if (error instanceof RunReservationLockTimeoutError) {
                    continue;
                }
                if (error instanceof RunLimitError) {
                    continue;
                }
                await redis.del(dedupeRedisKey).catch(() => { });
                console.error(`[cron-scheduler] Failed to enqueue ${workflow.id}/${node.id}:`, error);
            }
        }
    }
}
export function startCronScheduler(): void {
    if (isAutomationDisabledInProduction()) {
        console.warn('[cron-scheduler] Disabled in production. Set FYNT_ENABLE_AUTOMATION_IN_PRODUCTION=true to enable cron.');
        return;
    }
    tick().catch((error) => {
        console.error('[cron-scheduler] Initial tick failed:', error);
    });
    setInterval(() => {
        tick().catch((error) => {
            console.error('[cron-scheduler] Tick failed:', error);
        });
    }, POLL_INTERVAL_MS);
}
