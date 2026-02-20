import { Redis } from 'ioredis';
import type { RedisOptions } from 'ioredis';
import { isWebOnlyRuntimeMode } from './automationFlags';

type RedisFallbackFactory<T> = () => T | Promise<T>;

const REDIS_CONNECT_ERROR_CODES = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'NR_CLOSED',
]);

const commonRedisOptions: RedisOptions = {
    maxRetriesPerRequest: null,
    lazyConnect: true,
};

const fallbackLogTimestamps = new Map<string, number>();
const redisErrorLogTimestamps = new Map<string, number>();
const redisDisabledForRuntime = isWebOnlyRuntimeMode();

function parseRedisPort(value: string | undefined, fallback: number): number {
    if (!value) {
        return fallback;
    }
    const parsed = Number.parseInt(value, 10);
    if (!Number.isFinite(parsed) || parsed <= 0) {
        return fallback;
    }
    return parsed;
}

function parseRedisUrl(url: string): RedisOptions {
    const parsed = new URL(url);
    if (parsed.protocol !== 'redis:' && parsed.protocol !== 'rediss:') {
        throw new Error(`[redis] Unsupported URL protocol "${parsed.protocol}". Use redis:// or rediss://`);
    }
    const isTls = parsed.protocol === 'rediss:';

    const options: RedisOptions = {
        ...commonRedisOptions,
        host: parsed.hostname,
        port: parseRedisPort(parsed.port || undefined, isTls ? 443 : 6379),
    };

    if (parsed.username) {
        options.username = decodeURIComponent(parsed.username);
    }
    if (parsed.password) {
        options.password = decodeURIComponent(parsed.password);
    }
    if (parsed.pathname && parsed.pathname !== '/') {
        const dbValue = Number.parseInt(parsed.pathname.slice(1), 10);
        if (Number.isFinite(dbValue) && dbValue >= 0) {
            options.db = dbValue;
        }
    }
    if (isTls) {
        options.tls = {};
    }

    return options;
}

export function getRedisConnectionOptions(): RedisOptions {
    if (redisDisabledForRuntime) {
        throw new Error('[redis] Disabled in web-only runtime mode. Set FYNT_RUNTIME_MODE=full to enable Redis.');
    }

    const redisUrl = process.env.REDIS_URL?.trim() || process.env.UPSTASH_REDIS_URL?.trim();
    if (redisUrl) {
        const configuredFrom = process.env.REDIS_URL?.trim() ? 'REDIS_URL' : 'UPSTASH_REDIS_URL';
        try {
            return parseRedisUrl(redisUrl);
        }
        catch (error) {
            const details = error instanceof Error ? error.message : String(error);
            throw new Error(`[redis] Invalid ${configuredFrom}. Expected redis:// or rediss:// URL. ${details}`);
        }
    }

    return {
        ...commonRedisOptions,
        host: process.env.REDIS_HOST || 'localhost',
        port: parseRedisPort(process.env.REDIS_PORT, 6379),
    };
}

function getErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
        return null;
    }
    const maybeCode = (error as { code?: unknown }).code;
    if (typeof maybeCode !== 'string') {
        return null;
    }
    return maybeCode;
}

function isConnectionMessage(message: string): boolean {
    const lowered = message.toLowerCase();
    return lowered.includes('connection is closed') ||
        lowered.includes('connect econnrefused') ||
        lowered.includes('connect etimedout') ||
        lowered.includes('getaddrinfo enotfound') ||
        lowered.includes('socket closed');
}

function getNestedErrors(error: unknown): unknown[] {
    if (!error || typeof error !== 'object') {
        return [];
    }

    const maybeErrors = (error as { errors?: unknown }).errors;
    if (Array.isArray(maybeErrors)) {
        return maybeErrors;
    }

    return [];
}

export function isRedisConnectionError(error: unknown): boolean {
    const code = getErrorCode(error);
    if (code && REDIS_CONNECT_ERROR_CODES.has(code)) {
        return true;
    }

    const nestedErrors = getNestedErrors(error);
    if (nestedErrors.length > 0 && nestedErrors.some((nestedError) => isRedisConnectionError(nestedError))) {
        return true;
    }

    if (error && typeof error === 'object' && 'cause' in error) {
        const cause = (error as { cause?: unknown }).cause;
        if (cause && isRedisConnectionError(cause)) {
            return true;
        }
    }

    if (error instanceof Error) {
        return isConnectionMessage(error.message);
    }
    return false;
}

function logThrottledWarning(store: Map<string, number>, key: string, message: string): void {
    const now = Date.now();
    const last = store.get(key) ?? 0;
    if (now - last < 30_000) {
        return;
    }
    store.set(key, now);
    console.warn(message);
}

function attachRedisErrorLogging(client: Redis, label: string): void {
    client.on('error', (error) => {
        if (!isRedisConnectionError(error)) {
            console.error(`[redis:${label}] unexpected error`, error);
            return;
        }
        const reason = error instanceof Error ? error.message : String(error);
        logThrottledWarning(redisErrorLogTimestamps, `${label}:${reason}`, `[redis:${label}] unavailable: ${reason}`);
    });
}

function createRedisClient(label: string): Redis {
    const client = new Redis(getRedisConnectionOptions());
    attachRedisErrorLogging(client, label);
    return client;
}

export async function withRedisFallback<T>(context: string, operation: () => Promise<T>, fallback: RedisFallbackFactory<T>): Promise<T> {
    if (redisDisabledForRuntime) {
        logThrottledWarning(fallbackLogTimestamps, `${context}:runtime-disabled`, `[redis-fallback:${context}] disabled in web-only runtime mode`);
        return await fallback();
    }

    try {
        return await operation();
    }
    catch (error) {
        if (!isRedisConnectionError(error)) {
            throw error;
        }
        const reason = error instanceof Error ? error.message : String(error);
        logThrottledWarning(fallbackLogTimestamps, `${context}:${reason}`, `[redis-fallback:${context}] ${reason}`);
        return await fallback();
    }
}

let mainRedisClient: Redis | null = null;

function getMainRedisClient(): Redis {
    if (!mainRedisClient) {
        mainRedisClient = createRedisClient('main');
    }
    return mainRedisClient;
}

export const redis = new Proxy({} as Redis, {
    get(_target, property, receiver) {
        const client = getMainRedisClient();
        const value = Reflect.get(client as unknown as object, property, receiver);
        if (typeof value === 'function') {
            return value.bind(client);
        }
        return value;
    }
});

export function createRedisSubscriber(): Redis {
    return createRedisClient('subscriber');
}

export type { Redis };
