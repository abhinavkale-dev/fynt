import { prisma } from '@repo/prisma';
import type { CronTriggerNodeData, NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
export async function executeCronTriggerNode(data: CronTriggerNodeData, nodeRunId: string, executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const nodeRun = await prisma.nodeRun.findUnique({
        where: { id: nodeRunId },
        include: {
            workflowRun: {
                select: {
                    metadata: true,
                },
            },
        },
    });
    const metadata = (nodeRun?.workflowRun.metadata ?? {}) as Record<string, unknown>;
    const source = typeof metadata.source === 'string' ? metadata.source : 'cron';
    const triggeredAt = typeof metadata.scheduledAt === 'string' ? metadata.scheduledAt : new Date().toISOString();
    if (executionMode === 'strict_template_v1' && source !== 'cron') {
        throw new Error('Cron trigger requires scheduler execution. Configure this workflow as cron or use a manual trigger for manual runs.');
    }
    return {
        source,
        schedule: data.schedule ?? 'daily',
        hour: data.hour ?? 9,
        minute: data.minute ?? 0,
        ...(typeof data.dayOfWeek === 'number' ? { dayOfWeek: data.dayOfWeek } : {}),
        timezone: data.timezone ?? 'UTC',
        triggeredAt,
    };
}
