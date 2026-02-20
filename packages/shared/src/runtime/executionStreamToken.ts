import { createHmac, timingSafeEqual } from "node:crypto";
export interface ExecutionStreamTokenPayload {
    v: 1;
    runId: string;
    userId: string;
    iat: number;
    exp: number;
}
interface SignExecutionStreamTokenInput {
    runId: string;
    userId: string;
    ttlSeconds?: number;
    now?: Date;
}
const DEFAULT_TTL_SECONDS = 5 * 60;
function toBase64Url(input: string): string {
    return Buffer.from(input, "utf8").toString("base64url");
}
function fromBase64Url(input: string): string {
    return Buffer.from(input, "base64url").toString("utf8");
}
function signSegment(payloadSegment: string, secret: string): string {
    return createHmac("sha256", secret).update(payloadSegment).digest("base64url");
}
function assertValidPayload(payload: unknown): asserts payload is ExecutionStreamTokenPayload {
    if (!payload || typeof payload !== "object") {
        throw new Error("Execution stream token payload is not an object.");
    }
    const obj = payload as Record<string, unknown>;
    if (obj.v !== 1)
        throw new Error("Execution stream token version is invalid.");
    if (typeof obj.runId !== "string" || obj.runId.trim().length === 0) {
        throw new Error("Execution stream token runId is invalid.");
    }
    if (typeof obj.userId !== "string" || obj.userId.trim().length === 0) {
        throw new Error("Execution stream token userId is invalid.");
    }
    if (!Number.isInteger(obj.iat) || !Number.isInteger(obj.exp)) {
        throw new Error("Execution stream token iat/exp is invalid.");
    }
}
export function signExecutionStreamToken(input: SignExecutionStreamTokenInput, secret: string): string {
    if (!secret || secret.trim().length === 0) {
        throw new Error("Execution stream signing secret is required.");
    }
    if (!input.runId?.trim()) {
        throw new Error("Execution stream token requires runId.");
    }
    if (!input.userId?.trim()) {
        throw new Error("Execution stream token requires userId.");
    }
    const nowMs = (input.now ?? new Date()).getTime();
    const iat = Math.floor(nowMs / 1000);
    const ttlSeconds = Number.isFinite(input.ttlSeconds) && (input.ttlSeconds ?? 0) > 0
        ? Math.floor(input.ttlSeconds as number)
        : DEFAULT_TTL_SECONDS;
    const exp = iat + ttlSeconds;
    const payload: ExecutionStreamTokenPayload = {
        v: 1,
        runId: input.runId.trim(),
        userId: input.userId.trim(),
        iat,
        exp,
    };
    const payloadSegment = toBase64Url(JSON.stringify(payload));
    const signatureSegment = signSegment(payloadSegment, secret);
    return `${payloadSegment}.${signatureSegment}`;
}
export function verifyExecutionStreamToken(token: string, secret: string, now: Date = new Date()): ExecutionStreamTokenPayload {
    if (!secret || secret.trim().length === 0) {
        throw new Error("Execution stream signing secret is required.");
    }
    const [payloadSegment, signatureSegment, extra] = token.split(".");
    if (!payloadSegment || !signatureSegment || extra) {
        throw new Error("Execution stream token format is invalid.");
    }
    const expectedSignature = signSegment(payloadSegment, secret);
    const providedBuffer = Buffer.from(signatureSegment, "utf8");
    const expectedBuffer = Buffer.from(expectedSignature, "utf8");
    if (providedBuffer.length !== expectedBuffer.length ||
        !timingSafeEqual(providedBuffer, expectedBuffer)) {
        throw new Error("Execution stream token signature is invalid.");
    }
    let parsedPayload: unknown;
    try {
        parsedPayload = JSON.parse(fromBase64Url(payloadSegment)) as unknown;
    }
    catch {
        throw new Error("Execution stream token payload cannot be parsed.");
    }
    assertValidPayload(parsedPayload);
    const nowSeconds = Math.floor(now.getTime() / 1000);
    if (parsedPayload.exp <= nowSeconds) {
        throw new Error("Execution stream token has expired.");
    }
    return parsedPayload;
}
