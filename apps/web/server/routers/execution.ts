import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
function getRunSource(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object")
        return null;
    const source = (metadata as {
        source?: unknown;
    }).source;
    return typeof source === "string" ? source : null;
}
const getAll = protectedProcedure
    .input(z.object({
    workflowId: z.string().optional(),
    status: z.enum(['Pending', 'Success', 'Failure']).optional(),
    limit: z.number().min(1).max(50).default(20),
    cursor: z.string().optional(),
}))
    .query(async ({ ctx, input }) => {
    const userWorkflows = await ctx.prisma.workflow.findMany({
        where: { userId: ctx.userId },
        select: { id: true },
    });
    const workflowIds = userWorkflows.map(w => w.id);
    const filterWorkflowIds = input.workflowId
        ? (workflowIds.includes(input.workflowId) ? [input.workflowId] : [])
        : workflowIds;
    const runs = await ctx.prisma.workflowRun.findMany({
        where: {
            workflowId: { in: filterWorkflowIds },
            ...(input.status && { status: input.status }),
        },
        include: {
            workflow: { select: { id: true, title: true } },
            nodeRuns: { select: { id: true, status: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: input.limit + 1,
        ...(input.cursor && {
            cursor: { id: input.cursor },
            skip: 1,
        }),
    });
    let nextCursor: string | undefined;
    if (runs.length > input.limit) {
        const nextItem = runs.pop();
        nextCursor = nextItem?.id;
    }
    const hydratedRuns = runs.map((run) => ({
        ...run,
        source: getRunSource(run.metadata),
    }));
    return { runs: hydratedRuns, nextCursor };
});
const getById = protectedProcedure
    .input(z.object({ runId: z.string() }))
    .query(async ({ ctx, input }) => {
    const run = await ctx.prisma.workflowRun.findUnique({
        where: { id: input.runId },
        include: {
            workflow: {
                select: {
                    id: true,
                    title: true,
                    userId: true,
                    nodes: true,
                    edges: true,
                },
            },
            nodeRuns: {
                orderBy: { startedAt: 'asc' },
            },
        },
    });
    if (!run) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Execution not found',
        });
    }
    if (run.workflow.userId !== ctx.userId) {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'Not authorized to view this execution',
        });
    }
    return {
        ...run,
        source: getRunSource(run.metadata),
    };
});
const getUsage = protectedProcedure
    .query(async ({ ctx }) => {
    const user = await ctx.prisma.user.findUnique({
        where: { id: ctx.userId! },
        select: {
            plan: true,
            monthlyRunLimit: true,
            maxConcurrent: true,
            paidUntil: true,
        },
    });
    if (!user) {
        throw new TRPCError({ code: 'NOT_FOUND', message: 'User not found' });
    }
    const now = new Date();
    const month = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const usage = await ctx.prisma.usageRecord.findUnique({
        where: { userId_month: { userId: ctx.userId!, month } },
    });
    const effectivePlan = (user.plan !== 'free' && user.paidUntil && user.paidUntil < now)
        ? 'free'
        : user.plan;
    const effectiveLimit = effectivePlan === 'free' ? 1000
        : effectivePlan === 'pro' ? 5000
            : -1;
    return {
        plan: effectivePlan,
        runCount: usage?.runCount ?? 0,
        monthlyRunLimit: effectiveLimit,
        maxConcurrent: effectivePlan === 'free' ? 2 : effectivePlan === 'pro' ? 10 : 50,
        month,
    };
});
export const executionRouter = router({
    getAll,
    getById,
    getUsage,
});
