import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { getWorkflowQueue } from "@repo/shared/queue";
import { isExecutionDisabledForRuntime } from "@repo/shared/automation-flags";
import { signExecutionStreamToken } from "@repo/shared/execution-stream-token";
import { validateGraphShape } from "@/lib/workflow/graphValidation";
import { RunReservationLockTimeoutError, withUserRunReservationLock, } from "@repo/shared/run-reservation-lock";
const MAX_WORKFLOW_TITLE_LENGTH = 200;
const MAX_WORKFLOW_NODES = 200;
const MAX_WORKFLOW_EDGES = 500;
const MAX_WORKFLOW_ACTIONS = 200;
const EXECUTION_STREAM_TOKEN_TTL_SECONDS = 5 * 60;
const jsonValueSchema = z.unknown();
const workflowActionInputSchema = z.object({
    id: z.string().min(1).max(100),
    availableActionId: z.string().min(1).max(100),
    metadata: jsonValueSchema,
});
const createWorkflowInputSchema = z.object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(MAX_WORKFLOW_TITLE_LENGTH),
    availableTriggerId: z.string().min(1).max(100),
    triggerMetadata: jsonValueSchema,
    actions: z.array(workflowActionInputSchema).max(MAX_WORKFLOW_ACTIONS),
    nodes: z.array(jsonValueSchema).max(MAX_WORKFLOW_NODES),
    edges: z.array(jsonValueSchema).max(MAX_WORKFLOW_EDGES),
});
const updateWorkflowInputSchema = z.object({
    id: z.string().min(1).max(100),
    title: z.string().min(1).max(MAX_WORKFLOW_TITLE_LENGTH).optional(),
    nodes: z.array(jsonValueSchema).max(MAX_WORKFLOW_NODES).optional(),
    edges: z.array(jsonValueSchema).max(MAX_WORKFLOW_EDGES).optional(),
    triggerMetadata: jsonValueSchema.optional(),
    actions: z.array(workflowActionInputSchema).max(MAX_WORKFLOW_ACTIONS).optional(),
});
function parseJsonArray(value: unknown): unknown[] {
    if (Array.isArray(value)) {
        return value;
    }
    if (value &&
        typeof value === "object" &&
        Symbol.iterator in value &&
        typeof (value as {
            [Symbol.iterator]?: unknown;
        })[Symbol.iterator] === "function") {
        try {
            return Array.from(value as Iterable<unknown>);
        }
        catch {
            void 0;
        }
    }
    if (value && typeof value === "object") {
        const entries = Object.entries(value as Record<string, unknown>);
        const numericEntries = entries.filter(([key]) => /^\d+$/.test(key));
        if (numericEntries.length > 0) {
            return numericEntries
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([, item]) => item);
        }
        const keyedArray = (value as Record<string, unknown>).items ??
            (value as Record<string, unknown>).values ??
            (value as Record<string, unknown>).data ??
            (value as Record<string, unknown>).nodes ??
            (value as Record<string, unknown>).edges;
        if (Array.isArray(keyedArray)) {
            return keyedArray;
        }
    }
    if (typeof value === "string") {
        try {
            const parsed = JSON.parse(value);
            return parseJsonArray(parsed);
        }
        catch {
            void 0;
        }
    }
    return [];
}
function normalizeWorkflowGraph<T extends {
    nodes: unknown;
    edges: unknown;
}>(workflow: T): Omit<T, "nodes" | "edges"> & {
    nodes: unknown[];
    edges: unknown[];
} {
    return {
        ...workflow,
        nodes: parseJsonArray(workflow.nodes),
        edges: parseJsonArray(workflow.edges),
    };
}
function assertGraphShapeOrThrow(nodes: unknown[], edges: unknown[], context: "create" | "update"): void {
    const validation = validateGraphShape(nodes as Array<{
        id?: unknown;
    }>, edges as Array<{
        source?: unknown;
        target?: unknown;
    }>);
    if (!validation.isValid) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid workflow graph for ${context}: ${validation.errors.join(" ")}`,
        });
    }
}
function extractTemplateIdFromMetadata(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) {
        return null;
    }
    const value = (metadata as Record<string, unknown>).templateId;
    if (typeof value !== "string") {
        return null;
    }
    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
}
function assertTemplateGraphNotEmptyOrThrow(nodes: unknown[], templateId: string | null, context: "create" | "update"): void {
    if (!templateId) {
        return;
    }
    if (nodes.length === 0) {
        throw new TRPCError({
            code: "BAD_REQUEST",
            message: `Invalid workflow graph for ${context}: template workflow "${templateId}" ` +
                `cannot be saved with an empty node graph.`,
        });
    }
}
function resolveExecutionStreamSigningSecret(): string {
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
function resolveExecutionStreamWsBaseUrlFromEnv(): string | undefined {
    const configured = process.env.NEXT_PUBLIC_EXECUTION_WS_URL?.trim() ||
        process.env.EXECUTION_WS_URL?.trim();
    if (!configured) {
        return undefined;
    }
    try {
        return normalizeConfiguredWsBaseUrl(configured);
    }
    catch (error) {
        console.warn("[workflow.execute] Invalid EXECUTION_WS_URL/NEXT_PUBLIC_EXECUTION_WS_URL. Falling back to client defaults.", error);
        return undefined;
    }
}
const getAll = protectedProcedure.query(async ({ ctx }) => {
    const workflows = await ctx.prisma.workflow.findMany({
        where: {
            userId: ctx.userId,
        },
        include: {
            trigger: {
                include: { type: true }
            },
            actions: {
                include: { type: true },
                orderBy: { sortingOrder: 'asc' }
            }
        }
    });
    return workflows.map((workflow) => normalizeWorkflowGraph(workflow));
});
const getAllSummaries = protectedProcedure.query(async ({ ctx }) => {
    const workflows = await ctx.prisma.$queryRaw<Array<{
        id: string;
        title: string;
        createdAt: Date;
        updatedAt: Date;
        nodeCount: number | null;
        edgeCount: number | null;
        templateId: string | null;
        triggerTypes: string[] | null;
        lastRunStatus: string | null;
        lastRunAt: Date | null;
    }>> `
        SELECT
            w."id",
            w."title",
            w."createdAt",
            w."updatedAt",
            CASE
                WHEN jsonb_typeof(w."nodes"::jsonb) = 'array' THEN jsonb_array_length(w."nodes"::jsonb)
                ELSE 0
            END::int AS "nodeCount",
            CASE
                WHEN jsonb_typeof(w."edges"::jsonb) = 'array' THEN jsonb_array_length(w."edges"::jsonb)
                ELSE 0
            END::int AS "edgeCount",
            CASE
                WHEN jsonb_typeof(t."metadata"::jsonb) = 'object'
                     AND jsonb_typeof(t."metadata"::jsonb -> 'templateId') = 'string'
                THEN t."metadata"::jsonb ->> 'templateId'
                ELSE NULL
            END AS "templateId",
            COALESCE(
                (SELECT array_agg(DISTINCT n->>'type')
                 FROM jsonb_array_elements(
                     CASE WHEN jsonb_typeof(w."nodes"::jsonb) = 'array' THEN w."nodes"::jsonb ELSE '[]'::jsonb END
                 ) AS n
                 WHERE n->>'type' IN ('cronTrigger', 'webhookTrigger', 'trigger')),
                '{}'::text[]
            ) AS "triggerTypes",
            (SELECT wr."status"::text FROM "WorkflowRun" wr
             WHERE wr."workflowId" = w."id"
             ORDER BY wr."createdAt" DESC LIMIT 1) AS "lastRunStatus",
            (SELECT wr."createdAt" FROM "WorkflowRun" wr
             WHERE wr."workflowId" = w."id"
             ORDER BY wr."createdAt" DESC LIMIT 1) AS "lastRunAt"
        FROM "Workflow" w
        LEFT JOIN "Trigger" t ON t."workflowId" = w."id"
        WHERE w."userId" = ${ctx.userId}
        ORDER BY w."updatedAt" DESC
    `;
    return workflows.map((workflow) => ({
        id: workflow.id,
        title: workflow.title,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        nodeCount: workflow.nodeCount ?? 0,
        edgeCount: workflow.edgeCount ?? 0,
        templateId: workflow.templateId,
        triggerTypes: workflow.triggerTypes ?? [],
        lastRunStatus: workflow.lastRunStatus as 'Pending' | 'Success' | 'Failure' | null,
        lastRunAt: workflow.lastRunAt,
    }));
});
const getById = protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
    const workflow = await ctx.prisma.workflow.findFirst({
        where: {
            id: input.id,
            userId: ctx.userId,
        },
        include: {
            trigger: {
                include: { type: true }
            },
            actions: {
                include: { type: true },
                orderBy: { sortingOrder: 'asc' }
            }
        }
    });
    if (!workflow) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workflow not found'
        });
    }
    return normalizeWorkflowGraph(workflow);
});
const create = protectedProcedure
    .input(createWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
    assertGraphShapeOrThrow(input.nodes, input.edges, "create");
    assertTemplateGraphNotEmptyOrThrow(input.nodes, extractTemplateIdFromMetadata(input.triggerMetadata), "create");
    const [user, workflowCount] = await Promise.all([
        ctx.prisma.user.findUnique({
            where: { id: ctx.userId! },
            select: { plan: true, paidUntil: true },
        }),
        ctx.prisma.workflow.count({
            where: { userId: ctx.userId },
        }),
    ]);
    if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    const now = new Date();
    const effectivePlan = (user.plan !== 'free' && user.paidUntil && user.paidUntil < now)
        ? 'free'
        : user.plan;
    if (effectivePlan === 'free' && workflowCount >= 30) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Free plan allows up to 30 workflows. Upgrade your plan for unlimited workflows.',
        });
    }
    const workflow = await ctx.prisma.workflow.create({
        data: {
            id: input.id,
            title: input.title,
            userId: ctx.userId,
            nodes: input.nodes as any,
            edges: input.edges as any,
            trigger: {
                create: {
                    availableTriggerId: input.availableTriggerId,
                    metadata: input.triggerMetadata as any,
                }
            },
            actions: {
                create: input.actions.map((action, index) => ({
                    id: action.id,
                    availableActionId: action.availableActionId,
                    sortingOrder: index,
                    metadata: action.metadata as any,
                }))
            }
        },
        include: {
            trigger: {
                include: { type: true }
            },
            actions: {
                include: { type: true },
                orderBy: { sortingOrder: 'asc' }
            }
        }
    });
    return normalizeWorkflowGraph(workflow);
});
const update = protectedProcedure
    .input(updateWorkflowInputSchema)
    .mutation(async ({ ctx, input }) => {
    const isPositionOnlySave = !input.triggerMetadata && !input.actions;
    if (isPositionOnlySave) {
        if (input.nodes !== undefined || input.edges !== undefined) {
            assertGraphShapeOrThrow(
                input.nodes ?? [],
                input.edges ?? [],
                "update"
            );
        }
        const result = await ctx.prisma.workflow.updateMany({
            where: { id: input.id, userId: ctx.userId },
            data: {
                ...(input.title && { title: input.title }),
                ...(input.nodes !== undefined && { nodes: input.nodes as any }),
                ...(input.edges !== undefined && { edges: input.edges as any }),
            },
        });
        if (result.count === 0) {
            throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
        }
        return { id: input.id, updatedAt: new Date() };
    }
    const existing = await ctx.prisma.workflow.findFirst({
        where: { id: input.id, userId: ctx.userId },
        include: { trigger: { select: { metadata: true } } },
    });
    if (!existing) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'Workflow not found' });
    }
    if (input.nodes !== undefined || input.edges !== undefined) {
        const nextNodes = input.nodes ?? parseJsonArray(existing.nodes);
        const nextEdges = input.edges ?? parseJsonArray(existing.edges);
        assertGraphShapeOrThrow(nextNodes, nextEdges, "update");
        const templateId = extractTemplateIdFromMetadata(input.triggerMetadata) ??
            extractTemplateIdFromMetadata(existing.trigger?.metadata);
        assertTemplateGraphNotEmptyOrThrow(nextNodes, templateId, "update");
    }
    const workflow = await ctx.prisma.workflow.update({
        where: { id: input.id },
        data: {
            ...(input.title && { title: input.title }),
            ...(input.nodes !== undefined && { nodes: input.nodes as any }),
            ...(input.edges !== undefined && { edges: input.edges as any }),
        },
        include: {
            trigger: { include: { type: true } },
            actions: { include: { type: true }, orderBy: { sortingOrder: 'asc' } },
        },
    });
    if (input.triggerMetadata) {
        await ctx.prisma.trigger.updateMany({
            where: { workflowId: input.id },
            data: { metadata: input.triggerMetadata as any },
        });
    }
    if (input.actions) {
        await ctx.prisma.$transaction([
            ctx.prisma.action.deleteMany({ where: { workflowId: input.id } }),
            ctx.prisma.action.createMany({
                data: input.actions.map((action, index) => ({
                    id: action.id,
                    workflowId: input.id,
                    availableActionId: action.availableActionId,
                    sortingOrder: index,
                    metadata: action.metadata as any,
                })),
            }),
        ]);
    }
    return normalizeWorkflowGraph(workflow);
});
const deleteWorkflow = protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
    const deleted = await ctx.prisma.workflow.deleteMany({
        where: { id: input.id, userId: ctx.userId }
    });
    if (deleted.count === 0) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workflow not found'
        });
    }
    return { success: true, id: input.id };
});
const execute = protectedProcedure
    .input(z.object({
    workflowId: z.string(),
    nodeId: z.string().optional(),
    triggerSource: z.enum(['cron', 'webhook']).optional(),
    triggerNodeId: z.string().optional(),
}))
    .mutation(async ({ ctx, input }) => {
    if (isExecutionDisabledForRuntime()) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Workflow execution is disabled in this web-only deployment.',
        });
    }
    const workflow = await ctx.prisma.workflow.findFirst({
        where: { id: input.workflowId, userId: ctx.userId },
    });
    if (!workflow) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Workflow not found',
        });
    }
    const workflowNodes = Array.isArray(workflow.nodes)
        ? workflow.nodes as Array<{
            id?: unknown;
            type?: unknown;
            data?: {
                isActive?: unknown;
                isConfigured?: unknown;
            } | null;
        }>
        : [];
    if (input.nodeId && (input.triggerSource || input.triggerNodeId)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'Provide either nodeId (single-node run) or triggerSource/triggerNodeId (trigger run), not both.',
        });
    }
    if ((input.triggerSource && !input.triggerNodeId) || (!input.triggerSource && input.triggerNodeId)) {
        throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'triggerSource and triggerNodeId must be provided together.',
        });
    }
    if (input.nodeId) {
        const nodeExists = workflowNodes.some((node) => node?.id === input.nodeId);
        if (!nodeExists) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Node does not belong to this workflow',
            });
        }
    }
    else if (input.triggerSource && input.triggerNodeId) {
        const triggerNode = workflowNodes.find((node) => node?.id === input.triggerNodeId);
        if (!triggerNode) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Trigger node does not belong to this workflow',
            });
        }
        const expectedType = input.triggerSource === 'cron' ? 'cronTrigger' : 'webhookTrigger';
        const actualType = typeof triggerNode.type === 'string' ? triggerNode.type : '';
        if (actualType !== expectedType) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: `Selected node is not a ${expectedType} node.`,
            });
        }
        const nodeData = triggerNode.data && typeof triggerNode.data === 'object'
            ? (triggerNode.data as {
                isActive?: unknown;
                isConfigured?: unknown;
            })
            : null;
        if (nodeData?.isActive === false) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Selected trigger node is deactivated.',
            });
        }
        if (nodeData?.isConfigured !== true) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Selected trigger node is not configured yet.',
            });
        }
    }
    else {
        const hasActiveManualTrigger = workflowNodes.some((node) => {
            const nodeType = typeof node?.type === 'string' ? node.type : null;
            if (nodeType !== 'manualTrigger' && nodeType !== 'triggerNode') {
                return false;
            }
            const nodeData = node?.data && typeof node.data === 'object'
                ? (node.data as {
                    isActive?: unknown;
                })
                : null;
            return nodeData?.isActive !== false;
        });
        if (!hasActiveManualTrigger) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Manual execution requires at least one active manual trigger node. Use webhook URL or cron schedule for this workflow.',
            });
        }
    }
    const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        select: { plan: true, paidUntil: true },
    });
    if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const effectivePlan = (user.plan !== 'free' && user.paidUntil && user.paidUntil < now)
        ? 'free'
        : user.plan;
    const effectiveLimit = effectivePlan === 'free' ? 1000
        : effectivePlan === 'pro' ? 5000
            : -1;
    const effectiveConcurrent = effectivePlan === 'free' ? 2
        : effectivePlan === 'pro' ? 10
            : 50;
    let workflowRun;
    try {
        workflowRun = await withUserRunReservationLock(ctx.userId!, () => ctx.prisma.$transaction(async (tx) => {
            await tx.usageRecord.upsert({
                where: { userId_month: { userId: ctx.userId!, month } },
                create: { userId: ctx.userId!, month, runCount: 0 },
                update: {},
            });
            const pendingRuns = await tx.workflowRun.count({
                where: {
                    status: 'Pending',
                    workflow: { userId: ctx.userId },
                },
            });
            if (pendingRuns >= effectiveConcurrent) {
                throw new TRPCError({
                    code: 'FORBIDDEN',
                    message: `Concurrent workflow limit reached (${effectiveConcurrent}). Wait for current executions to finish or upgrade your plan.`,
                });
            }
            if (effectiveLimit !== -1) {
                const reserve = await tx.usageRecord.updateMany({
                    where: {
                        userId: ctx.userId!,
                        month,
                        runCount: { lt: effectiveLimit },
                    },
                    data: {
                        runCount: { increment: 1 },
                    },
                });
                if (reserve.count === 0) {
                    throw new TRPCError({
                        code: 'FORBIDDEN',
                        message: `Monthly execution limit reached (${effectiveLimit}). Upgrade your plan for more executions.`,
                    });
                }
            }
            else {
                await tx.usageRecord.update({
                    where: { userId_month: { userId: ctx.userId!, month } },
                    data: { runCount: { increment: 1 } },
                });
            }
            return tx.workflowRun.create({
                data: {
                    workflowId: input.workflowId,
                    metadata: (() => {
                        const nowIso = new Date().toISOString();
                        if (input.nodeId) {
                            return {
                                source: 'manual-node',
                                nodeId: input.nodeId,
                            };
                        }
                        if (input.triggerSource && input.triggerNodeId) {
                            if (input.triggerSource === 'cron') {
                                return {
                                    source: 'cron',
                                    nodeId: input.triggerNodeId,
                                    scheduledAt: nowIso,
                                };
                            }
                            return {
                                source: 'webhook',
                                nodeId: input.triggerNodeId,
                                payload: {},
                                query: {},
                                headers: {},
                                receivedAt: nowIso,
                                ip: 'manual-run-now',
                            };
                        }
                        return {
                            source: 'manual',
                        };
                    })(),
                },
            });
        }));
    }
    catch (error) {
        if (error instanceof RunReservationLockTimeoutError) {
            throw new TRPCError({
                code: 'FORBIDDEN',
                message: 'Another execution request is being processed. Please retry in a moment.',
            });
        }
        throw error;
    }
    try {
        await getWorkflowQueue().add('process-workflow', { workflowRunId: workflowRun.id }, { jobId: workflowRun.id });
    }
    catch {
        await ctx.prisma.$transaction([
            ctx.prisma.workflowRun.update({
                where: { id: workflowRun.id },
                data: {
                    status: 'Failure',
                    finishedAt: new Date(),
                    errorMetadata: {
                        message: 'Failed to enqueue workflow run',
                    } as any,
                },
            }),
            ctx.prisma.usageRecord.update({
                where: { userId_month: { userId: ctx.userId!, month } },
                data: { runCount: { decrement: 1 } },
            }),
        ]);
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to enqueue workflow run',
        });
    }
    let stream: {
        token: string;
        wsUrl?: string;
        expiresInSeconds: number;
    } | undefined;
    try {
        const token = signExecutionStreamToken({
            runId: workflowRun.id,
            userId: ctx.userId!,
            ttlSeconds: EXECUTION_STREAM_TOKEN_TTL_SECONDS,
        }, resolveExecutionStreamSigningSecret());
        const wsUrl = resolveExecutionStreamWsBaseUrlFromEnv();
        stream = {
            token,
            expiresInSeconds: EXECUTION_STREAM_TOKEN_TTL_SECONDS,
            ...(wsUrl ? { wsUrl } : {}),
        };
    }
    catch (error) {
        console.warn("[workflow.execute] Failed to prepare execution stream bootstrap token.", error);
    }
    return {
        runId: workflowRun.id,
        workflowId: input.workflowId,
        ...(stream ? { stream } : {}),
    };
});
export const workflowRouter = router({
    getAll,
    getAllSummaries,
    getById,
    create,
    update,
    delete: deleteWorkflow,
    execute,
});
