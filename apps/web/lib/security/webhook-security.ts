import { redis, withRedisFallback } from "@repo/shared/redis";
import { timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
export interface RateLimitResult {
    allowed: boolean;
    limit: number;
    remaining: number;
    retryAfterSec: number;
}
export class PayloadTooLargeError extends Error {
    constructor(message: string) {
        super(message);
    }
}
export class InvalidJsonPayloadError extends Error {
    constructor(message: string) {
        super(message);
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
function truncateUtf8(value: string, maxBytes: number): string {
    const raw = Buffer.from(value, "utf8");
    if (raw.byteLength <= maxBytes) {
        return value;
    }
    return raw.subarray(0, maxBytes).toString("utf8");
}
function isJsonContentType(contentType: string): boolean {
    const normalized = contentType.toLowerCase();
    return normalized.includes("application/json") || normalized.includes("+json");
}
function parseFormEncodedPayload(rawBody: string): Record<string, string | string[]> | unknown {
    const params = new URLSearchParams(rawBody);
    const parsed: Record<string, string | string[]> = {};
    for (const [key, value] of params.entries()) {
        const existing = parsed[key];
        if (existing === undefined) {
            parsed[key] = value;
            continue;
        }
        if (Array.isArray(existing)) {
            existing.push(value);
            continue;
        }
        parsed[key] = [existing, value];
    }
    const payloadField = parsed.payload;
    if (typeof payloadField === "string") {
        try {
            return JSON.parse(payloadField);
        }
        catch {
            return parsed;
        }
    }
    return parsed;
}
export function getClientIp(request: NextRequest): string {
    const xForwardedFor = request.headers.get("x-forwarded-for");
    if (xForwardedFor) {
        const firstIp = xForwardedFor.split(",")[0]?.trim();
        if (firstIp)
            return firstIp;
    }
    const xRealIp = request.headers.get("x-real-ip")?.trim();
    if (xRealIp)
        return xRealIp;
    const cfIp = request.headers.get("cf-connecting-ip")?.trim();
    if (cfIp)
        return cfIp;
    return "unknown";
}
export function secretsMatch(expectedSecret: string, providedSecret: string): boolean {
    const expected = Buffer.from(expectedSecret, "utf8");
    const provided = Buffer.from(providedSecret, "utf8");
    if (expected.length !== provided.length) {
        const paddedProvided = Buffer.alloc(expected.length);
        provided.copy(paddedProvided, 0, 0, Math.min(provided.length, expected.length));
        timingSafeEqual(expected, paddedProvided);
        return false;
    }
    return timingSafeEqual(expected, provided);
}
export async function applyRateLimit(params: {
    key: string;
    windowSec: number;
    limit: number;
}): Promise<RateLimitResult> {
    const windowSec = parsePositiveInt(String(params.windowSec), 60);
    const limit = parsePositiveInt(String(params.limit), 60);
    return withRedisFallback(`webhook-rate-limit:${params.key}`, async () => {
        const currentCount = await redis.incr(params.key);
        if (currentCount === 1) {
            await redis.expire(params.key, windowSec);
        }
        const ttl = await redis.ttl(params.key);
        const retryAfterSec = ttl > 0 ? ttl : windowSec;
        const remaining = Math.max(0, limit - currentCount);
        return {
            allowed: currentCount <= limit,
            limit,
            remaining,
            retryAfterSec,
        };
    }, async () => ({
        allowed: true,
        limit,
        remaining: limit,
        retryAfterSec: windowSec,
    }));
}
export function getWebhookRateLimitConfig() {
    return {
        ipPerMinute: parsePositiveInt(process.env.WEBHOOK_IP_RATE_LIMIT_PER_MINUTE, 120),
        endpointPerMinute: parsePositiveInt(process.env.WEBHOOK_ENDPOINT_RATE_LIMIT_PER_MINUTE, 60),
        bodyMaxBytes: parsePositiveInt(process.env.WEBHOOK_MAX_BODY_BYTES, 256 * 1024),
    };
}
export async function readJsonOrTextWithLimit(request: NextRequest, maxBytes: number): Promise<{
    payload: unknown;
    rawBody: string;
}> {
    const contentLength = request.headers.get("content-length");
    if (contentLength) {
        const declared = Number.parseInt(contentLength, 10);
        if (Number.isFinite(declared) && declared > maxBytes) {
            throw new PayloadTooLargeError(`Payload too large. Limit is ${maxBytes} bytes.`);
        }
    }
    const rawBody = await request.text();
    if (Buffer.byteLength(rawBody, "utf8") > maxBytes) {
        throw new PayloadTooLargeError(`Payload too large. Limit is ${maxBytes} bytes.`);
    }
    const contentType = request.headers.get("content-type") ?? "";
    if (contentType.toLowerCase().includes("application/x-www-form-urlencoded")) {
        return { payload: parseFormEncodedPayload(rawBody), rawBody };
    }
    if (!isJsonContentType(contentType)) {
        return { payload: rawBody, rawBody };
    }
    if (!rawBody) {
        return { payload: null, rawBody };
    }
    try {
        const parsed = JSON.parse(rawBody) as unknown;
        return { payload: parsed, rawBody };
    }
    catch {
        throw new InvalidJsonPayloadError("Request body must be valid JSON.");
    }
}
export function sanitizeRequestHeaders(request: NextRequest, options?: {
    maxHeaderCount?: number;
    maxHeaderValueBytes?: number;
    maxTotalBytes?: number;
}): Record<string, string> {
    const maxHeaderCount = options?.maxHeaderCount ?? 40;
    const maxHeaderValueBytes = options?.maxHeaderValueBytes ?? 512;
    const maxTotalBytes = options?.maxTotalBytes ?? 8 * 1024;
    const blockedHeaders = new Set(["authorization", "cookie", "x-fynt-secret"]);
    const output: Record<string, string> = {};
    let count = 0;
    let totalBytes = 0;
    request.headers.forEach((value, key) => {
        const lowerKey = key.toLowerCase();
        if (blockedHeaders.has(lowerKey))
            return;
        if (count >= maxHeaderCount)
            return;
        const safeValue = truncateUtf8(value, maxHeaderValueBytes);
        const kvBytes = Buffer.byteLength(lowerKey, "utf8") + Buffer.byteLength(safeValue, "utf8");
        if (totalBytes + kvBytes > maxTotalBytes)
            return;
        output[lowerKey] = safeValue;
        count += 1;
        totalBytes += kvBytes;
    });
    return output;
}
export function sanitizeQueryParams(request: NextRequest, options?: {
    excludeKeys?: string[];
    maxParamCount?: number;
    maxValueBytes?: number;
    maxTotalBytes?: number;
}): Record<string, string> {
    const excludeKeys = new Set(options?.excludeKeys ?? []);
    const maxParamCount = options?.maxParamCount ?? 20;
    const maxValueBytes = options?.maxValueBytes ?? 512;
    const maxTotalBytes = options?.maxTotalBytes ?? 4 * 1024;
    const output: Record<string, string> = {};
    let count = 0;
    let totalBytes = 0;
    request.nextUrl.searchParams.forEach((value, key) => {
        if (excludeKeys.has(key))
            return;
        if (count >= maxParamCount)
            return;
        const safeValue = truncateUtf8(value, maxValueBytes);
        const kvBytes = Buffer.byteLength(key, "utf8") + Buffer.byteLength(safeValue, "utf8");
        if (totalBytes + kvBytes > maxTotalBytes)
            return;
        output[key] = safeValue;
        count += 1;
        totalBytes += kvBytes;
    });
    return output;
}
