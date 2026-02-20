import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { isExecutionDisabledForRuntime } from "@repo/shared/automation-flags";
import { signExecutionStreamToken } from "@repo/shared/execution-stream-token";
const TOKEN_TTL_SECONDS = 5 * 60;
function resolveSigningSecret(): string {
    const secret = process.env.EXECUTION_STREAM_SIGNING_SECRET?.trim() ||
        process.env.BETTER_AUTH_SECRET?.trim();
    if (!secret) {
        throw new Error("Execution stream signing secret is required. Set EXECUTION_STREAM_SIGNING_SECRET or BETTER_AUTH_SECRET.");
    }
    return secret;
}
function resolveWebSocketBaseUrl(request: Request): string {
    const configured = process.env.NEXT_PUBLIC_EXECUTION_WS_URL?.trim() ||
        process.env.EXECUTION_WS_URL?.trim();
    if (configured)
        return configured.replace(/\/$/, "");
    const url = new URL(request.url);
    const protocol = url.protocol === "https:" ? "wss:" : "ws:";
    const realtimePort = process.env.REALTIME_PORT?.trim() || "3101";
    return `${protocol}//${url.hostname}:${realtimePort}`;
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
    const session = await auth.api.getSession({
        headers: await headers(),
    });
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
