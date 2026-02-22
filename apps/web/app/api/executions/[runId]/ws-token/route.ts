import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { getSessionWithRetry } from "@/lib/auth-session";
import prisma from "@/lib/prisma";
import { isExecutionDisabledForRuntime } from "@repo/shared/automation-flags";
import { signExecutionStreamToken } from "@repo/shared/execution-stream-token";
const TOKEN_TTL_SECONDS = 5 * 60;

function resolveSigningSecret(): string {
    const secret = process.env.BETTER_AUTH_SECRET?.trim() ||
        process.env.EXECUTION_STREAM_SIGNING_SECRET?.trim();
    if (!secret) {
        throw new Error("Execution stream signing secret is required. Set BETTER_AUTH_SECRET or EXECUTION_STREAM_SIGNING_SECRET.");
    }
    return secret;
}

function normalizeConfiguredWsBaseUrl(value: string): string {
    const trimmed = value.trim();
    if (!trimmed) {
        throw new Error("Execution websocket URL is empty.");
    }
    let parsed: URL;
    try {
        parsed = new URL(trimmed);
    }
    catch {
        const withProtocol = trimmed.startsWith("//")
            ? `ws:${trimmed}`
            : `ws://${trimmed.replace(/^\/+/, "")}`;
        parsed = new URL(withProtocol);
    }
    if (parsed.protocol === "http:") {
        parsed.protocol = "ws:";
    }
    else if (parsed.protocol === "https:") {
        parsed.protocol = "wss:";
    }
    else if (parsed.protocol !== "ws:" && parsed.protocol !== "wss:") {
        throw new Error(`Unsupported websocket protocol: ${parsed.protocol}`);
    }
    return parsed.toString().replace(/\/$/, "");
}

function resolveWebSocketBaseUrl(request: Request): string {
    const configured = process.env.NEXT_PUBLIC_EXECUTION_WS_URL?.trim() ||
        process.env.EXECUTION_WS_URL?.trim();
    if (configured) {
        try {
            return normalizeConfiguredWsBaseUrl(configured);
        }
        catch (error) {
            console.warn("[Execution WS Token] Invalid EXECUTION_WS_URL/NEXT_PUBLIC_EXECUTION_WS_URL. Falling back to runtime host.", error);
        }
    }
    const url = new URL(request.url);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const hostname = url.hostname === "localhost" ? "127.0.0.1" : url.hostname;
    const realtimePort = process.env.REALTIME_PORT?.trim() || "3101";
    return `${protocol}//${hostname}:${realtimePort}`;
}
export async function GET(request: Request, { params }: {
    params: Promise<{
        runId: string;
    }>;
}) {
    const { runId } = await params;
    if (isExecutionDisabledForRuntime()) {
        return NextResponse.json({
            error: "Execution streaming is disabled in this web-only deployment.",
        }, { status: 503 });
    }
    let session;
    try {
        session = await getSessionWithRetry(await headers(), {
            logPrefix: '[Execution WS Token]',
        });
    }
    catch {
        return new NextResponse("Authentication service unavailable", { status: 503 });
    }
    if (!session?.user?.id) {
        return new NextResponse("Unauthorized", { status: 401 });
    }
    const run = await prisma.workflowRun.findUnique({
        where: { id: runId },
        include: { workflow: { select: { userId: true } } },
    });
    if (!run || run.workflow.userId !== session.user.id) {
        return new NextResponse("Not found", { status: 404 });
    }
    const token = signExecutionStreamToken({
        runId,
        userId: session.user.id,
        ttlSeconds: TOKEN_TTL_SECONDS,
    }, resolveSigningSecret());
    return NextResponse.json({
        token,
        wsUrl: resolveWebSocketBaseUrl(request),
        expiresInSeconds: TOKEN_TTL_SECONDS,
    });
}
