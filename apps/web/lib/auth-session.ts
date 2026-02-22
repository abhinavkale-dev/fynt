import { auth } from "@/lib/auth";

const DEFAULT_MAX_ATTEMPTS = 3;
const DEFAULT_RETRY_DELAY_MS = 120;
const TRANSIENT_SESSION_ERROR_PATTERN =
    /ETIMEDOUT|ECONNRESET|EAI_AGAIN|ENOTFOUND|P1001|P1002|P1008|P2024|timeout|timed out|pool|connection/i;

function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

function extractErrorText(error: unknown): string {
    if (error instanceof Error) {
        return `${error.name}: ${error.message}`;
    }
    if (typeof error === "string") {
        return error;
    }
    if (!error || typeof error !== "object") {
        return String(error);
    }

    const record = error as Record<string, unknown>;
    const parts: string[] = [];

    for (const key of ["message", "status", "statusCode", "code"] as const) {
        const value = record[key];
        if (typeof value === "string" || typeof value === "number") {
            parts.push(String(value));
        }
    }

    const body = record.body;
    if (body && typeof body === "object") {
        for (const key of ["message", "code"] as const) {
            const value = (body as Record<string, unknown>)[key];
            if (typeof value === "string" || typeof value === "number") {
                parts.push(String(value));
            }
        }
    }

    return parts.join(" ");
}

function isInternalAuthError(error: unknown): boolean {
    if (!error || typeof error !== "object") {
        return false;
    }
    const record = error as Record<string, unknown>;
    const statusCode = record.statusCode;
    if (typeof statusCode === "number") {
        return statusCode >= 500;
    }
    const status = record.status;
    return typeof status === "string" && status === "INTERNAL_SERVER_ERROR";
}

function isTransientSessionError(error: unknown): boolean {
    if (isInternalAuthError(error)) {
        return true;
    }
    return TRANSIENT_SESSION_ERROR_PATTERN.test(extractErrorText(error));
}

type Session = Awaited<ReturnType<typeof auth.api.getSession>>;

interface GetSessionWithRetryOptions {
    maxAttempts?: number;
    retryDelayMs?: number;
    logPrefix?: string;
}

export async function getSessionWithRetry(
    requestHeaders: Headers,
    options?: GetSessionWithRetryOptions
): Promise<Session> {
    const maxAttempts = Math.max(1, options?.maxAttempts ?? DEFAULT_MAX_ATTEMPTS);
    const retryDelayMs = Math.max(0, options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS);
    const logPrefix = options?.logPrefix ?? "[Auth Session]";

    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        try {
            return await auth.api.getSession({
                headers: requestHeaders,
            });
        }
        catch (error) {
            lastError = error;
            if (!isTransientSessionError(error) || attempt >= maxAttempts) {
                throw error;
            }

            const message = extractErrorText(error) || "Unknown getSession error";
            console.warn(`${logPrefix} getSession attempt ${attempt}/${maxAttempts} failed: ${message}. Retrying...`);
            if (retryDelayMs > 0) {
                await delay(retryDelayMs * attempt);
            }
        }
    }

    throw lastError instanceof Error
        ? lastError
        : new Error("Failed to get session");
}
