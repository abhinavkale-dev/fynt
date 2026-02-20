import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getWorkflowQueue } from "@repo/shared/queue";
import { isAutomationDisabledInProduction } from "@repo/shared/automation-flags";
import { RunReservationLockTimeoutError, withUserRunReservationLock, } from "@repo/shared/run-reservation-lock";
import { applyRateLimit, getClientIp, getWebhookRateLimitConfig, InvalidJsonPayloadError, PayloadTooLargeError, readJsonOrTextWithLimit, sanitizeQueryParams, sanitizeRequestHeaders, secretsMatch, } from "@/lib/security/webhook-security";
type LimitErrorCode = "MONTHLY_LIMIT" | "CONCURRENT_LIMIT";
class RunLimitError extends Error {
    constructor(public readonly code: LimitErrorCode, message: string) {
        super(message);
    }
}
function getEffectivePlan(plan: string | null | undefined, paidUntil: Date | null, now: Date): string {
    const normalizedPlan = plan ?? "free";
    if (normalizedPlan !== "free" && paidUntil && paidUntil < now) {
        return "free";
    }
    return normalizedPlan;
}
function getPlanLimits(plan: string | null | undefined): {
    monthlyRunLimit: number;
    maxConcurrent: number;
} {
    const normalizedPlan = plan ?? "free";
    if (normalizedPlan === "free") {
        return { monthlyRunLimit: 1000, maxConcurrent: 2 };
    }
    if (normalizedPlan === "pro") {
        return { monthlyRunLimit: 5000, maxConcurrent: 10 };
    }
    return { monthlyRunLimit: -1, maxConcurrent: 50 };
}
function getMonthKey(now: Date): string {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}
export async function POST(request: NextRequest, context: {
    params: Promise<{
        workflowId: string;
        nodeId: string;
    }>;
}) {
    const { workflowId, nodeId } = await context.params;
    if (isAutomationDisabledInProduction()) {
        return NextResponse.json({
            error: "Webhook executions are disabled in this web-only deployment.",
        }, { status: 503 });
    }
    const { ipPerMinute, endpointPerMinute, bodyMaxBytes } = getWebhookRateLimitConfig();
    const clientIp = getClientIp(request);
    try {
        const ipRate = await applyRateLimit({
            key: `fg:rl:webhook:ip:${clientIp}`,
            limit: ipPerMinute,
            windowSec: 60,
        });
        if (!ipRate.allowed) {
            return NextResponse.json({ error: "Webhook rate limit exceeded for this IP." }, {
                status: 429,
                headers: {
                    "Retry-After": String(ipRate.retryAfterSec),
                    "X-RateLimit-Limit": String(ipRate.limit),
                    "X-RateLimit-Remaining": String(ipRate.remaining),
                },
            });
        }
        const endpointRate = await applyRateLimit({
            key: `fg:rl:webhook:endpoint:${workflowId}:${nodeId}:${clientIp}`,
            limit: endpointPerMinute,
            windowSec: 60,
        });
        if (!endpointRate.allowed) {
            return NextResponse.json({ error: "Webhook endpoint rate limit exceeded." }, {
                status: 429,
                headers: {
                    "Retry-After": String(endpointRate.retryAfterSec),
                    "X-RateLimit-Limit": String(endpointRate.limit),
                    "X-RateLimit-Remaining": String(endpointRate.remaining),
                },
            });
        }
    }
    catch (error) {
        console.error("[webhook] Rate limiting unavailable:", error);
        return NextResponse.json({ error: "Webhook protection service unavailable." }, { status: 503 });
    }
    const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
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
    });
    if (!workflow) {
        return NextResponse.json({ error: "Workflow not found" }, { status: 404 });
    }
    if (!workflow.userId || !workflow.user) {
        return NextResponse.json({ error: "Workflow owner not found. Cannot execute webhook run." }, { status: 400 });
    }
    const nodes = Array.isArray(workflow.nodes) ? (workflow.nodes as Array<Record<string, unknown>>) : [];
    const triggerNode = nodes.find((node) => node?.id === nodeId && node?.type === "webhookTrigger");
    if (!triggerNode) {
        return NextResponse.json({ error: "Webhook trigger node not found" }, { status: 404 });
    }
    const nodeData = (triggerNode.data ?? {}) as Record<string, unknown>;
    if (nodeData.isActive === false) {
        return NextResponse.json({ error: "Webhook trigger node is deactivated" }, { status: 409 });
    }
    if (nodeData.isConfigured !== true) {
        return NextResponse.json({ error: "Webhook trigger node is not configured yet" }, { status: 400 });
    }
    const configuredSecret = typeof nodeData.secret === "string" ? nodeData.secret.trim() : "";
    const providedSecret = request.nextUrl.searchParams.get("secret") ??
        request.headers.get("x-fynt-secret") ??
        "";
    if (!configuredSecret) {
        return NextResponse.json({ error: "Webhook trigger secret is not configured for this node" }, { status: 400 });
    }
    if (!secretsMatch(configuredSecret, providedSecret)) {
        return NextResponse.json({ error: "Invalid webhook secret" }, { status: 401 });
    }
    let payload: unknown = null;
    try {
        const readResult = await readJsonOrTextWithLimit(request, bodyMaxBytes);
        payload = readResult.payload;
    }
    catch (error) {
        if (error instanceof PayloadTooLargeError) {
            return NextResponse.json({ error: error.message }, { status: 413 });
        }
        if (error instanceof InvalidJsonPayloadError) {
            return NextResponse.json({ error: error.message }, { status: 400 });
        }
        return NextResponse.json({ error: "Failed to process webhook payload" }, { status: 400 });
    }
    const query = sanitizeQueryParams(request, { excludeKeys: ["secret"] });
    const headers = sanitizeRequestHeaders(request);
    const now = new Date();
    const month = getMonthKey(now);
    const effectivePlan = getEffectivePlan(workflow.user.plan, workflow.user.paidUntil, now);
    const { monthlyRunLimit, maxConcurrent } = getPlanLimits(effectivePlan);
    let workflowRunId = "";
    try {
        const workflowRun = await withUserRunReservationLock(workflow.userId as string, () => prisma.$transaction(async (tx) => {
            await tx.usageRecord.upsert({
                where: { userId_month: { userId: workflow.userId as string, month } },
                create: { userId: workflow.userId as string, month, runCount: 0 },
                update: {},
            });
            const pendingRuns = await tx.workflowRun.count({
                where: {
                    status: "Pending",
                    workflow: { userId: workflow.userId },
                },
            });
            if (pendingRuns >= maxConcurrent) {
                throw new RunLimitError("CONCURRENT_LIMIT", `Concurrent workflow limit reached (${maxConcurrent}).`);
            }
            if (monthlyRunLimit !== -1) {
                const reserve = await tx.usageRecord.updateMany({
                    where: {
                        userId: workflow.userId as string,
                        month,
                        runCount: { lt: monthlyRunLimit },
                    },
                    data: {
                        runCount: { increment: 1 },
                    },
                });
                if (reserve.count === 0) {
                    throw new RunLimitError("MONTHLY_LIMIT", `Monthly execution limit reached (${monthlyRunLimit}).`);
                }
            }
            else {
                await tx.usageRecord.update({
                    where: { userId_month: { userId: workflow.userId as string, month } },
                    data: { runCount: { increment: 1 } },
                });
            }
            return tx.workflowRun.create({
                data: {
                    workflowId: workflow.id,
                    metadata: ({
                        source: "webhook",
                        nodeId,
                        payload: payload as any,
                        query,
                        headers: headers as any,
                        ip: clientIp,
                        receivedAt: new Date().toISOString(),
                    }) as any,
                },
            });
        }));
        workflowRunId = workflowRun.id;
    }
    catch (error) {
        if (error instanceof RunReservationLockTimeoutError) {
            return NextResponse.json({ error: "Another execution request is being processed. Please retry shortly." }, { status: 429 });
        }
        if (error instanceof RunLimitError) {
            const status = error.code === "MONTHLY_LIMIT" ? 403 : 429;
            return NextResponse.json({ error: error.message }, { status });
        }
        console.error("[webhook] Failed to reserve workflow run:", error);
        return NextResponse.json({ error: "Failed to reserve workflow run" }, { status: 500 });
    }
    try {
        await getWorkflowQueue().add("process-workflow", { workflowRunId }, { jobId: workflowRunId });
    }
    catch (error) {
        console.error("[webhook] Failed to enqueue workflow run:", error);
        await prisma.$transaction([
            prisma.workflowRun.update({
                where: { id: workflowRunId },
                data: {
                    status: "Failure",
                    finishedAt: new Date(),
                    errorMetadata: {
                        message: "Failed to enqueue workflow run",
                    } as any,
                },
            }),
            prisma.usageRecord.update({
                where: { userId_month: { userId: workflow.userId as string, month } },
                data: { runCount: { decrement: 1 } },
            }),
        ]).catch((rollbackError) => {
            console.error("[webhook] Failed to rollback usage after enqueue error:", rollbackError);
        });
        return NextResponse.json({ error: "Failed to enqueue workflow run" }, { status: 503 });
    }
    return NextResponse.json({
        success: true,
        runId: workflowRunId,
        workflowId: workflow.id,
    });
}
