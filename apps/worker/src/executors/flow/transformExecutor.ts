import { parseTemplateWithMetadata } from '@repo/shared/parser';
import type { TransformNodeData, NodeExecutionOutput } from '../../engine/types/index.js';
import type { ExecutionMode } from '../../engine/executor.js';
export async function executeTransformNode(data: TransformNodeData, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const template = typeof data.expression === 'string' ? data.expression : '';
    if (!template) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Transform expression is empty');
        }
        return {
            success: false,
            error: 'Transform expression is empty',
        };
    }
    const parsed = parseTemplateWithMetadata(template, runMetadata as Record<string, string>);
    const output = parsed.output;
    if (executionMode === 'strict_template_v1' && parsed.missingVars && parsed.missingVars.length > 0) {
        const missingVarList = parsed.missingVars.join(', ');
        throw new Error(`Transform expression uses undefined variables: ${missingVarList}`);
    }
    let result: NodeExecutionOutput;
    try {
        result = JSON.parse(output);
    }
    catch {
        result = output;
    }
    return {
        success: true,
        data: result,
        ...(parsed.missingVars ? { missingVars: parsed.missingVars } : {}),
    };
}
