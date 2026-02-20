import { prisma } from '@repo/prisma';
import type { NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
export async function executeWebhookTriggerNode(nodeRunId: string, executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
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
    if (!nodeRun) {
        throw new Error(`Node run ${nodeRunId} not found`);
    }
    const metadata = (nodeRun.workflowRun.metadata ?? {}) as Record<string, unknown>;
    const source = typeof metadata.source === 'string' ? metadata.source : 'webhook';
    const payload = (metadata.payload ?? {}) as NodeExecutionOutput;
    const headers = (metadata.headers ?? {}) as NodeExecutionOutput;
    const query = (metadata.query ?? {}) as NodeExecutionOutput;
    const receivedAt = typeof metadata.receivedAt === 'string' ? metadata.receivedAt : new Date().toISOString();
    if (executionMode === 'strict_template_v1' && source !== 'webhook') {
        throw new Error('Webhook trigger requires an inbound webhook request. Use the configured webhook URL instead of manual execution.');
    }
    return {
        source,
        payload,
        headers,
        query,
        receivedAt,
    };
}
