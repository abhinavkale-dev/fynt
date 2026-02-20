type RedisConfigSource = 'REDIS_URL' | 'UPSTASH_REDIS_URL' | 'REDIS_HOST_PORT';

const REDIS_CONNECTION_ERROR_CODES = new Set([
    'ECONNREFUSED',
    'ENOTFOUND',
    'EAI_AGAIN',
    'ETIMEDOUT',
    'ECONNRESET',
    'EHOSTUNREACH',
    'NR_CLOSED',
]);

const TROUBLESHOOT_LOG_TTL_MS = 30_000;
const troubleshootLogTimestamps = new Map<string, number>();

export interface RedisConfigurationSummary {
    source: RedisConfigSource;
    displayTarget: string;
    hasImplicitLocalFallback: boolean;
    isUrlInvalid: boolean;
    notes: string[];
}

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

function sanitizeRedisUrl(url: string): string {
    const parsed = new URL(url);
    const protocol = parsed.protocol || 'redis:';
    const host = parsed.hostname || '<missing-host>';
    const defaultPort = protocol === 'rediss:' ? 443 : 6379;
    const port = parseRedisPort(parsed.port || undefined, defaultPort);
    const dbPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname : '';
    return `${protocol}//${host}:${port}${dbPath}`;
}

function extractConfiguredUrl(): {
    source: 'REDIS_URL' | 'UPSTASH_REDIS_URL';
    url: string;
    hasBothConfigured: boolean;
} | null {
    const redisUrl = process.env.REDIS_URL?.trim();
    const upstashRedisUrl = process.env.UPSTASH_REDIS_URL?.trim();

    if (redisUrl) {
        return {
            source: 'REDIS_URL',
            url: redisUrl,
            hasBothConfigured: Boolean(upstashRedisUrl),
        };
    }

    if (upstashRedisUrl) {
        return {
            source: 'UPSTASH_REDIS_URL',
            url: upstashRedisUrl,
            hasBothConfigured: false,
        };
    }

    return null;
}

function appendCommonNotes(summary: RedisConfigurationSummary, hasBothConfiguredUrls: boolean): RedisConfigurationSummary {
    if (hasBothConfiguredUrls) {
        summary.notes.push('Both REDIS_URL and UPSTASH_REDIS_URL are set. REDIS_URL takes precedence.');
    }
    return summary;
}

export function describeRedisConfiguration(): RedisConfigurationSummary {
    const configuredUrl = extractConfiguredUrl();
    if (configuredUrl) {
        try {
            const displayTarget = sanitizeRedisUrl(configuredUrl.url);
            return appendCommonNotes({
                source: configuredUrl.source,
                displayTarget,
                hasImplicitLocalFallback: false,
                isUrlInvalid: false,
                notes: [],
            }, configuredUrl.hasBothConfigured);
        }
        catch {
            return appendCommonNotes({
                source: configuredUrl.source,
                displayTarget: `${configuredUrl.source}=<invalid-url>`,
                hasImplicitLocalFallback: false,
                isUrlInvalid: true,
                notes: [
                    `${configuredUrl.source} is not a valid URL. Use redis:// or rediss:// format.`,
                ],
            }, configuredUrl.hasBothConfigured);
        }
    }

    const configuredHost = process.env.REDIS_HOST?.trim();
    const configuredPort = process.env.REDIS_PORT?.trim();
    const host = configuredHost || 'localhost';
    const port = parseRedisPort(configuredPort, 6379);

    return {
        source: 'REDIS_HOST_PORT',
        displayTarget: `${host}:${port}`,
        hasImplicitLocalFallback: !configuredHost && !configuredPort,
        isUrlInvalid: false,
        notes: !configuredHost && !configuredPort
            ? ['No Redis environment variables found. Falling back to localhost:6379.']
            : [],
    };
}

function getErrorCode(error: unknown): string | null {
    if (!error || typeof error !== 'object') {
        return null;
    }
    const maybeCode = (error as { code?: unknown }).code;
    return typeof maybeCode === 'string' ? maybeCode : null;
}

function getNestedErrors(error: unknown): unknown[] {
    if (!error || typeof error !== 'object') {
        return [];
    }
    const maybeErrors = (error as { errors?: unknown }).errors;
    return Array.isArray(maybeErrors) ? maybeErrors : [];
}

function isConnectionMessage(message: string): boolean {
    const lowered = message.toLowerCase();
    return lowered.includes('connection is closed') ||
        lowered.includes('connect econnrefused') ||
        lowered.includes('connect etimedout') ||
        lowered.includes('getaddrinfo enotfound') ||
        lowered.includes('socket closed');
}

export function isLikelyRedisConnectionError(error: unknown): boolean {
    const code = getErrorCode(error);
    if (code && REDIS_CONNECTION_ERROR_CODES.has(code)) {
        return true;
    }

    const nestedErrors = getNestedErrors(error);
    if (nestedErrors.some((nestedError) => isLikelyRedisConnectionError(nestedError))) {
        return true;
    }

    if (error && typeof error === 'object' && 'cause' in error) {
        const cause = (error as { cause?: unknown }).cause;
        if (cause && isLikelyRedisConnectionError(cause)) {
            return true;
        }
    }

    if (error instanceof Error) {
        return isConnectionMessage(error.message);
    }

    return false;
}

function shouldLogTroubleshooting(context: string): boolean {
    const now = Date.now();
    const lastLoggedAt = troubleshootLogTimestamps.get(context) ?? 0;
    if (now - lastLoggedAt < TROUBLESHOOT_LOG_TTL_MS) {
        return false;
    }
    troubleshootLogTimestamps.set(context, now);
    return true;
}

function isRuntimeModeDisabledError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }
    return error.message.includes('Disabled in web-only runtime mode');
}

function printTroubleshootingStep(prefix: string, step: string): void {
    console.error(`${prefix} ${step}`);
}

export function logRedisTroubleshooting(prefix: string, error: unknown): void {
    if (!shouldLogTroubleshooting(prefix)) {
        return;
    }

    if (isRuntimeModeDisabledError(error)) {
        printTroubleshootingStep(prefix, 'FYNT_RUNTIME_MODE is web-only. Set FYNT_RUNTIME_MODE=full before starting the worker.');
        return;
    }

    const summary = describeRedisConfiguration();
    if (summary.isUrlInvalid) {
        printTroubleshootingStep(prefix, `Invalid Redis URL configuration detected (${summary.displayTarget}).`);
        printTroubleshootingStep(prefix, 'Use REDIS_URL=redis://host:port or REDIS_URL=rediss://host:port for managed Redis/Upstash.');
        return;
    }

    if (!isLikelyRedisConnectionError(error)) {
        return;
    }

    printTroubleshootingStep(prefix, `Redis connection failed for ${summary.displayTarget}.`);

    if (summary.hasImplicitLocalFallback) {
        printTroubleshootingStep(prefix, 'No Redis env vars were set, so worker defaulted to localhost:6379.');
        printTroubleshootingStep(prefix, 'Start Redis locally or set REDIS_URL / UPSTASH_REDIS_URL in the repo root .env.');
        return;
    }

    if (summary.source === 'REDIS_HOST_PORT') {
        printTroubleshootingStep(prefix, 'Check REDIS_HOST/REDIS_PORT values and confirm Redis is reachable from this machine.');
        return;
    }

    printTroubleshootingStep(prefix, `Check ${summary.source} and confirm the URL is reachable.`);
    printTroubleshootingStep(prefix, 'If using Upstash, prefer rediss:// URL and verify the token and hostname are complete.');
}
