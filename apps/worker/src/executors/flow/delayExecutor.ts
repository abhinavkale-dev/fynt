import type { DelayNodeData, NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
const DEFAULT_DELAY_MAX_MS = 5 * 60 * 1000;
function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}
function getDelayMaxMs(): number {
    const parsed = Number.parseInt(process.env.DELAY_NODE_MAX_MS ?? '', 10);
    if (Number.isFinite(parsed) && parsed > 0) {
        return parsed;
    }
    return DEFAULT_DELAY_MAX_MS;
}
export async function executeDelayNode(data: DelayNodeData, _executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const requested = typeof data.durationMs === 'number' && Number.isFinite(data.durationMs)
        ? Math.max(0, Math.floor(data.durationMs))
        : 0;
    const maxAllowed = getDelayMaxMs();
    const effectiveDelay = Math.min(requested, maxAllowed);
    if (effectiveDelay !== requested) {
        console.warn(`[delayNode] Delay capped from ${requested}ms to ${effectiveDelay}ms (DELAY_NODE_MAX_MS=${maxAllowed})`);
    }
    await sleep(effectiveDelay);
    return {
        delayed: true,
        durationMs: effectiveDelay,
        resumedAt: new Date().toISOString(),
    };
}
