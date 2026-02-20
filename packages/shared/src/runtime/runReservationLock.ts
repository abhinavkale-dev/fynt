import { randomUUID } from 'node:crypto';
import { redis, withRedisFallback } from './redis';
export class RunReservationLockTimeoutError extends Error {
    constructor(userId: string) {
        super(`Timed out while reserving execution slot for user ${userId}`);
    }
}
function parsePositiveInt(value: string | undefined, fallback: number): number {
    if (!value)
        return fallback;
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0)
        return fallback;
    return parsed;
}
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getConfig() {
    return {
        ttlSec: parsePositiveInt(process.env.RUN_RESERVATION_LOCK_TTL_SECONDS, 10),
        waitMs: parsePositiveInt(process.env.RUN_RESERVATION_LOCK_WAIT_MS, 1500),
        retryMs: parsePositiveInt(process.env.RUN_RESERVATION_LOCK_RETRY_MS, 40),
    };
}
function getUserRunReservationLockKey(userId: string): string {
    return `fg:run-reservation:user:${userId}`;
}
async function releaseLock(key: string, token: string): Promise<void> {
    await withRedisFallback('run-reservation-lock:release', () => redis.eval(`
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `, 1, key, token), async () => 0);
}
export async function withUserRunReservationLock<T>(userId: string, fn: () => Promise<T>): Promise<T> {
    const { ttlSec, waitMs, retryMs } = getConfig();
    const key = getUserRunReservationLockKey(userId);
    const token = randomUUID();
    const deadline = Date.now() + waitMs;
    let lockAcquired = false;
    while (true) {
        const acquired = await withRedisFallback('run-reservation-lock:acquire', () => redis.set(key, token, 'EX', ttlSec, 'NX'), async () => 'BYPASS_LOCK');
        if (acquired === 'BYPASS_LOCK') {
            return fn();
        }
        if (acquired === 'OK') {
            lockAcquired = true;
            break;
        }
        if (Date.now() >= deadline) {
            throw new RunReservationLockTimeoutError(userId);
        }
        await sleep(retryMs);
    }
    try {
        return await fn();
    }
    finally {
        if (lockAcquired) {
            await releaseLock(key, token).catch(() => { });
        }
    }
}
