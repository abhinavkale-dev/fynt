import { Queue } from 'bullmq';
import type { QueueOptions } from 'bullmq';
import { isExecutionDisabledForRuntime } from './automationFlags';
import { getRedisConnectionOptions } from './redis';

const defaultJobOptions: NonNullable<QueueOptions['defaultJobOptions']> = {
    attempts: 3,
    backoff: {
        type: 'exponential',
        delay: 2000,
    },
    removeOnComplete: { count: 100, age: 24 * 3600 },
    removeOnFail: { count: 100, age: 24 * 3600 },
};

function createQueueOptions(): QueueOptions {
    return {
        connection: getRedisConnectionOptions(),
        defaultJobOptions,
    };
}

const queueName = 'workflow-runs';

let workflowQueueInstance: Queue | null = null;

export function getWorkflowQueue(): Queue {
    if (isExecutionDisabledForRuntime()) {
        throw new Error('[queue] Workflow queue is disabled in web-only runtime mode.');
    }

    if (!workflowQueueInstance) {
        workflowQueueInstance = new Queue(queueName, createQueueOptions());
    }
    return workflowQueueInstance;
}

export interface WorkflowJobData {
    workflowRunId: string;
}
