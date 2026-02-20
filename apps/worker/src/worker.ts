import { Worker } from 'bullmq';
import { executeWorkflow } from './engine/executor.js';
import type { WorkflowJobData } from '@repo/shared/queue';
import { getRedisConnectionOptions } from '@repo/shared/redis';
import { logRedisTroubleshooting } from './redisDiagnostics.js';

const WORKER_ID = `worker-${process.pid}`;
export const worker = new Worker<WorkflowJobData>('workflow-runs', async (job) => {
    try {
        await executeWorkflow(job.data.workflowRunId);
    }
    catch (error) {
        console.error(`[${WORKER_ID}] Job ${job.id} failed:`, error);
        throw error;
    }
}, {
    connection: getRedisConnectionOptions(),
    concurrency: 5,
    autorun: false,
});
worker.on('failed', (job, err) => {
    console.error(`[${WORKER_ID}] Job ${job?.id} failed:`, err);
});
worker.on('error', (err) => {
    console.error(`[${WORKER_ID}] Worker error:`, err);
    logRedisTroubleshooting(`[${WORKER_ID}]`, err);
});
