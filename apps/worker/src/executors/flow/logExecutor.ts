import { parseTemplateWithMetadata } from '@repo/shared/parser';
import type { LogNodeData, NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
export async function executeLogNode(data: LogNodeData, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const template = typeof data.message === 'string' ? data.message : '';
    const level = data.level ?? 'info';
    const parsed = parseTemplateWithMetadata(template, runMetadata as Record<string, string>);
    const message = parsed.output;
    if (executionMode === 'strict_template_v1' && parsed.missingVars?.length) {
        const missingVarList = parsed.missingVars.join(', ');
        throw new Error(`Log template uses undefined variables: ${missingVarList}. ` +
            `Original template: "${template.slice(0, 100)}${template.length > 100 ? '...' : ''}"`);
    }
    if (!message) {
        return {
            success: true,
            skipped: true,
            reason: 'Log message is empty',
        };
    }
    if (level === 'error') {
        console.error(`[Log Node] ${message}`);
    }
    else if (level === 'warn') {
        console.warn(`[Log Node] ${message}`);
    }
    else if (level === 'debug') {
        console.debug(`[Log Node] ${message}`);
    }
    else {
        console.log(`[Log Node] ${message}`);
    }
    return {
        success: true,
        level,
        message,
    };
}
