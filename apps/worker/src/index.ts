import path from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { describeRedisConfiguration, logRedisTroubleshooting } from './redisDiagnostics.js';

function loadWorkerEnv(): void {
    dotenv.config({ quiet: true });
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);
    const repoRootEnv = path.resolve(__dirname, '../../../.env');
    if (existsSync(repoRootEnv)) {
        dotenv.config({ path: repoRootEnv, override: false, quiet: true });
    }
}
function validateRequiredEnv(): void {
    if (!process.env.ENCRYPTION_KEY) {
        throw new Error('ENCRYPTION_KEY is required for worker credential decryption. ' +
            'Set the same ENCRYPTION_KEY used by the web app.');
    }
}

const WORKER_ID = `worker-${process.pid}-${Date.now()}`;

function logRedisStartupDetails(): void {
    const summary = describeRedisConfiguration();
    console.log(`[${WORKER_ID}] Redis target: ${summary.displayTarget}`);
    for (const note of summary.notes) {
        console.warn(`[${WORKER_ID}] ${note}`);
    }

    if (summary.hasImplicitLocalFallback) {
        console.warn(
            `[${WORKER_ID}] For local development, start Redis on localhost:6379 or set REDIS_URL in .env.`,
        );
    }
}

async function bootstrap(): Promise<void> {
    loadWorkerEnv();
    validateRequiredEnv();

    console.log('Fynt Worker starting...');
    console.log(`[${WORKER_ID}] PID: ${process.pid}`);
    logRedisStartupDetails();

    const [{ worker }, { startCronScheduler }] = await Promise.all([
        import('./worker.js'),
        import('./scheduler.js'),
    ]);

    process.on('unhandledRejection', (reason) => {
        console.error(`[${WORKER_ID}] Unhandled promise rejection:`, reason);
        logRedisTroubleshooting(`[${WORKER_ID}]`, reason);
        process.exitCode = 1;
    });

    process.on('uncaughtException', (error) => {
        console.error(`[${WORKER_ID}] Uncaught exception:`, error);
        logRedisTroubleshooting(`[${WORKER_ID}]`, error);
        process.exit(1);
    });

    await worker.waitUntilReady();
    void worker.run().catch((error) => {
        console.error(`[${WORKER_ID}] Worker run loop stopped unexpectedly:`, error);
        logRedisTroubleshooting(`[${WORKER_ID}]`, error);
        process.exit(1);
    });

    startCronScheduler();
    console.log(`[${WORKER_ID}] Worker started and ready to process workflow runs`);

    const shutdown = async (signal: NodeJS.Signals) => {
        console.log(`[${WORKER_ID}] Received ${signal}, shutting down worker...`);
        try {
            await worker.close();
            console.log(`[${WORKER_ID}] Worker gracefully stopped`);
        }
        catch (error) {
            console.error(`[${WORKER_ID}] Error while closing worker:`, error);
        }
        finally {
            process.exit(0);
        }
    };

    process.on('SIGINT', () => {
        void shutdown('SIGINT');
    });
    process.on('SIGTERM', () => {
        void shutdown('SIGTERM');
    });
}

void bootstrap().catch((error) => {
    console.error(`[${WORKER_ID}] Worker failed to start:`, error);
    logRedisTroubleshooting(`[${WORKER_ID}]`, error);
    process.exit(1);
});
