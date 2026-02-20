export type ValidationIssue = {
    type: 'error' | 'warning';
    category: 'structure' | 'config' | 'connection';
    message: string;
    nodeIds?: string[];
    suggestion?: string;
};
export type ValidationResult = {
    isValid: boolean;
    canExecute: boolean;
    issues: ValidationIssue[];
};
const TRIGGER_TYPES = ['triggerNode', 'manualTrigger', 'webhookTrigger', 'cronTrigger'];
type AIInputMode = 'prompt' | 'json';
function isNodeActive(node: WorkflowNode): boolean {
    return node.data?.isActive !== false;
}
function isClearlyInvalidNotionId(value: string | undefined): boolean {
    if (!value)
        return true;
    const trimmed = value.trim();
    if (!trimmed)
        return true;
    if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(trimmed))
        return true;
    if (/^x{16,}$/i.test(trimmed))
        return true;
    if (/^0{16,}$/i.test(trimmed))
        return true;
    if (trimmed === 'change-this-secret')
        return true;
    return false;
}
function hyphenateNotionId(compactId: string): string {
    return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20, 32)}`;
}
function normalizeNotionIdentifier(value: string | undefined): string | undefined {
    if (!value)
        return undefined;
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch?.[0])
        return uuidMatch[0].toLowerCase();
    const compactMatches = trimmed.match(/[0-9a-f]{32}/ig);
    if (compactMatches && compactMatches.length > 0) {
        const last = compactMatches[compactMatches.length - 1]!;
        return hyphenateNotionId(last.toLowerCase());
    }
    return undefined;
}
function looksLikeTemplateExpression(value: string | undefined): boolean {
    if (!value)
        return false;
    return /\{[^{}]+\}/.test(value);
}
function hasTemplateVariableSyntax(value: string | undefined): boolean {
    if (!value)
        return false;
    return /\{(?:json\s+)?[a-zA-Z_][a-zA-Z0-9_.\s-]*\}/.test(value);
}
function resolveAIInputMode(data: Record<string, any>): AIInputMode {
    return data.inputMode === 'json' ? 'json' : 'prompt';
}
function getAIProviderLabel(nodeType: string): 'OpenAI' | 'Anthropic' | 'Gemini' {
    switch (nodeType) {
        case 'anthropicNode':
            return 'Anthropic';
        case 'geminiNode':
            return 'Gemini';
        case 'openaiNode':
        case 'aiNode':
        default:
            return 'OpenAI';
    }
}
function getAIJsonShapeHint(nodeType: string): string {
    switch (nodeType) {
        case 'anthropicNode':
            return 'Expected shape: {"messages":[{"role":"user","content":"..."}]}';
        case 'geminiNode':
            return 'Expected shape: {"contents":[{"role":"user","parts":[{"text":"..."}]}]}';
        case 'openaiNode':
        case 'aiNode':
        default:
            return 'Expected shape: {"messages":[{"role":"user","content":"..."}]}';
    }
}
function validateProviderJsonInput(nodeType: string, requestJson: string): string | null {
    const trimmed = requestJson.trim();
    if (!trimmed)
        return null;
    if (hasTemplateVariableSyntax(trimmed))
        return null;
    let parsed: unknown;
    try {
        parsed = JSON.parse(trimmed);
    }
    catch {
        return 'JSON input is not valid JSON. Ensure rendered JSON is valid.';
    }
    if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
        return 'JSON input must be an object.';
    }
    const payload = parsed as Record<string, unknown>;
    if (nodeType === 'geminiNode') {
        const contents = payload.contents;
        if (!Array.isArray(contents) || contents.length === 0) {
            return 'Gemini JSON input requires a non-empty "contents" array.';
        }
        const invalidContent = contents.find((content) => {
            if (!content || typeof content !== 'object' || Array.isArray(content))
                return true;
            const parts = (content as Record<string, unknown>).parts;
            if (!Array.isArray(parts) || parts.length === 0)
                return true;
            return !parts.some((part) => {
                if (!part || typeof part !== 'object' || Array.isArray(part))
                    return false;
                const text = (part as Record<string, unknown>).text;
                return typeof text === 'string' && text.trim().length > 0;
            });
        });
        if (invalidContent) {
            return 'Gemini JSON input contents[] must include parts[] with at least one non-empty text part.';
        }
        return null;
    }
    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        return `${getAIProviderLabel(nodeType)} JSON input requires a non-empty "messages" array.`;
    }
    const allowedRoles = nodeType === 'anthropicNode'
        ? new Set(['user', 'assistant'])
        : new Set(['system', 'user', 'assistant', 'developer']);
    const invalidMessage = messages.find((message) => {
        if (!message || typeof message !== 'object' || Array.isArray(message))
            return true;
        const msg = message as Record<string, unknown>;
        const role = typeof msg.role === 'string' ? msg.role : '';
        if (!allowedRoles.has(role))
            return true;
        const content = msg.content;
        if (typeof content === 'string')
            return content.trim().length === 0;
        if (Array.isArray(content))
            return content.length === 0;
        return true;
    });
    if (invalidMessage) {
        if (nodeType === 'anthropicNode') {
            return 'Anthropic JSON messages[] must use role "user" or "assistant" with non-empty content.';
        }
        return 'OpenAI JSON messages[] must include valid role and non-empty content.';
    }
    return null;
}
export interface WorkflowNode {
    id: string;
    type: string;
    data: Record<string, any>;
}
export interface WorkflowEdge {
    source: string;
    target: string;
    sourceHandle?: string | null;
}
function getReachableNodeIds(nodes: WorkflowNode[], edges: WorkflowEdge[]): Set<string> {
    const triggers = nodes.filter((node) => TRIGGER_TYPES.includes(node.type) && isNodeActive(node));
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
        const neighbors = graph.get(edge.source) ?? [];
        neighbors.push(edge.target);
        graph.set(edge.source, neighbors);
    }
    const reachable = new Set<string>();
    const stack = triggers.map((trigger) => trigger.id);
    while (stack.length > 0) {
        const nodeId = stack.pop();
        if (!nodeId || reachable.has(nodeId))
            continue;
        reachable.add(nodeId);
        const neighbors = graph.get(nodeId) ?? [];
        for (const neighbor of neighbors) {
            if (!reachable.has(neighbor)) {
                stack.push(neighbor);
            }
        }
    }
    return reachable;
}
export function detectCircularDependencies(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationIssue | null {
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
        if (!graph.has(edge.source))
            graph.set(edge.source, []);
        graph.get(edge.source)!.push(edge.target);
    }
    const visited = new Set<string>();
    const recStack = new Set<string>();
    function hasCycle(nodeId: string): boolean {
        if (recStack.has(nodeId))
            return true;
        if (visited.has(nodeId))
            return false;
        visited.add(nodeId);
        recStack.add(nodeId);
        for (const neighbor of graph.get(nodeId) || []) {
            if (hasCycle(neighbor))
                return true;
        }
        recStack.delete(nodeId);
        return false;
    }
    for (const node of nodes) {
        if (hasCycle(node.id)) {
            return {
                type: 'error',
                category: 'structure',
                message: 'Circular dependency detected in workflow',
                suggestion: 'Remove connections that create a loop',
            };
        }
    }
    return null;
}
export function findOrphanedNodes(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationIssue | null {
    const allTriggers = nodes.filter((node) => TRIGGER_TYPES.includes(node.type));
    const triggers = allTriggers.filter(isNodeActive);
    if (allTriggers.length === 0) {
        return {
            type: 'warning',
            category: 'structure',
            message: 'No trigger node found',
            suggestion: 'Add a trigger to start your workflow',
        };
    }
    if (triggers.length === 0) {
        return null;
    }
    const graph = new Map<string, string[]>();
    for (const edge of edges) {
        if (!graph.has(edge.source))
            graph.set(edge.source, []);
        graph.get(edge.source)!.push(edge.target);
    }
    const reachable = new Set<string>();
    function dfs(nodeId: string) {
        if (reachable.has(nodeId))
            return;
        reachable.add(nodeId);
        for (const neighbor of graph.get(nodeId) || []) {
            dfs(neighbor);
        }
    }
    triggers.forEach(t => dfs(t.id));
    const hasIncomingEdges = new Set<string>();
    for (const edge of edges) {
        hasIncomingEdges.add(edge.target);
    }
    const orphaned = nodes.filter(n => isNodeActive(n) &&
        !reachable.has(n.id) &&
        !TRIGGER_TYPES.includes(n.type) &&
        !hasIncomingEdges.has(n.id));
    if (orphaned.length > 0) {
        return {
            type: 'warning',
            category: 'connection',
            message: `${orphaned.length} node(s) not connected to workflow`,
            nodeIds: orphaned.map(n => n.id),
            suggestion: 'Connect these nodes or remove them',
        };
    }
    return null;
}
export function checkMissingConfigurations(nodes: WorkflowNode[], options?: {
    reachableNodeIds?: Set<string>;
}): ValidationIssue[] {
    const issues: ValidationIssue[] = [];
    const reachableNodeIds = options?.reachableNodeIds;
    for (const node of nodes) {
        if (!isNodeActive(node)) {
            continue;
        }
        const { type, data } = node;
        const label = data.label || type;
        const isReachable = !reachableNodeIds || reachableNodeIds.has(node.id);
        const issueType: ValidationIssue['type'] = isReachable ? 'error' : 'warning';
        const reachabilitySuffix = isReachable ? '' : ' (unreachable node)';
        const reachabilitySuggestion = isReachable
            ? undefined
            : 'Connect this node to an active trigger path to require full configuration.';
        const pushIssue = (message: string, suggestion?: string) => {
            issues.push({
                type: issueType,
                category: 'config',
                message: `${message}${reachabilitySuffix}`,
                nodeIds: [node.id],
                suggestion: suggestion ?? reachabilitySuggestion,
            });
        };
        switch (type) {
            case 'openaiNode':
            case 'aiNode':
            case 'anthropicNode':
            case 'geminiNode': {
                const missingFields: string[] = [];
                const providerLabel = getAIProviderLabel(type);
                const inputMode = resolveAIInputMode(data);
                if (!data.credentialId?.trim())
                    missingFields.push('credential');
                if (!data.model?.trim())
                    missingFields.push('model');
                if (inputMode === 'json') {
                    if (!data.requestJson?.trim())
                        missingFields.push('JSON input');
                }
                else if (!data.prompt?.trim()) {
                    missingFields.push('prompt');
                }
                if (missingFields.length > 0) {
                    pushIssue(`${label}: Missing ${missingFields.join(', ')}`, inputMode === 'json'
                        ? `Configure ${providerLabel} credential, model, and provider-specific JSON input. ${getAIJsonShapeHint(type)}`
                        : `Configure ${providerLabel} credential, model, and prompt before execution.`);
                }
                if (inputMode === 'json' && data.requestJson?.trim()) {
                    const jsonError = validateProviderJsonInput(type, data.requestJson);
                    if (jsonError) {
                        pushIssue(`${label}: ${jsonError}`, getAIJsonShapeHint(type));
                    }
                }
                break;
            }
            case 'httpTrigger':
                if (!data.url?.trim()) {
                    pushIssue(`${label}: Missing URL`, 'Configure the HTTP URL');
                }
                break;
            case 'githubNode': {
                const missingFields: string[] = [];
                const operation = typeof data.operation === 'string' ? data.operation : 'create_issue';
                if (!data.credentialId?.trim())
                    missingFields.push('credential');
                if (!data.owner?.trim())
                    missingFields.push('owner');
                if (!data.repo?.trim())
                    missingFields.push('repo');
                if (operation === 'create_issue') {
                    if (!data.title?.trim())
                        missingFields.push('title');
                }
                else if (operation === 'create_comment') {
                    if (!data.issueNumber?.trim())
                        missingFields.push('issueNumber');
                    if (!data.body?.trim())
                        missingFields.push('body');
                }
                else if (operation === 'get_issue') {
                    if (!data.issueNumber?.trim())
                        missingFields.push('issueNumber');
                }
                else {
                    missingFields.push('operation');
                }
                if (missingFields.length > 0) {
                    pushIssue(`${label}: Missing ${missingFields.join(', ')}`, 'Configure GitHub credential, operation, and required fields.');
                }
                break;
            }
            case 'notionNode': {
                const missingFields: string[] = [];
                const operation = typeof data.operation === 'string' ? data.operation : 'create';
                const dataSourceRaw = typeof data.dataSourceId === 'string' ? data.dataSourceId.trim() : '';
                const databaseRaw = typeof data.databaseId === 'string' ? data.databaseId.trim() : '';
                const pageRaw = typeof data.pageId === 'string' ? data.pageId.trim() : '';
                const dataSourceId = normalizeNotionIdentifier(dataSourceRaw);
                const databaseId = normalizeNotionIdentifier(databaseRaw);
                const pageId = normalizeNotionIdentifier(pageRaw);
                const dataSourceIsTemplate = looksLikeTemplateExpression(dataSourceRaw);
                const databaseIsTemplate = looksLikeTemplateExpression(databaseRaw);
                const pageIsTemplate = looksLikeTemplateExpression(pageRaw);
                const hasTargetId = Boolean(dataSourceIsTemplate ||
                    databaseIsTemplate ||
                    (dataSourceId && !isClearlyInvalidNotionId(dataSourceId)) ||
                    (databaseId && !isClearlyInvalidNotionId(databaseId)));
                if (!data.credentialId?.trim())
                    missingFields.push('credential');
                if (operation === 'create') {
                    if (!hasTargetId)
                        missingFields.push('dataSourceId or databaseId');
                    if (!data.propertiesTemplate?.trim())
                        missingFields.push('propertiesTemplate');
                }
                else if (operation === 'get') {
                    if (!pageIsTemplate && (!pageId || isClearlyInvalidNotionId(pageId)))
                        missingFields.push('pageId');
                }
                else if (operation === 'get_many') {
                    if (!hasTargetId)
                        missingFields.push('dataSourceId or databaseId');
                }
                else if (operation === 'update') {
                    if (!pageIsTemplate && (!pageId || isClearlyInvalidNotionId(pageId)))
                        missingFields.push('pageId');
                    if (!data.propertiesTemplate?.trim() && typeof data.archived !== 'boolean') {
                        missingFields.push('propertiesTemplate or archived');
                    }
                }
                else {
                    missingFields.push('operation');
                }
                if (missingFields.length > 0) {
                    pushIssue(`${label}: Missing ${missingFields.join(', ')}`, 'Configure Notion credential, operation, and required fields.');
                }
                break;
            }
            case 'webhookTrigger':
            case 'cronTrigger':
                break;
            case 'conditionNode':
                if (!data.expression?.trim() || !data.routes || data.routes.length === 0) {
                    pushIssue(`${label}: Missing expression or routes`, 'Configure the expression and at least one route');
                }
                break;
            case 'filterNode':
                if (!data.expression?.trim()) {
                    pushIssue(`${label}: Missing filter expression`, 'Configure the filter expression');
                }
                break;
            case 'transformNode':
                if (!data.expression?.trim()) {
                    pushIssue(`${label}: Missing transform expression`, 'Configure the transform expression');
                }
                break;
            case 'delayNode':
                if (!data.durationMs || data.durationMs <= 0) {
                    pushIssue(`${label}: Invalid delay duration`, 'Set a positive delay duration (in milliseconds)');
                }
                break;
            case 'slackNode':
                if (!data.message?.trim()) {
                    pushIssue(`${label}: Missing message`, 'Configure the message content');
                }
                break;
            case 'discordNode':
                if (!(data.content?.trim() || data.message?.trim())) {
                    pushIssue(`${label}: Missing message content`, 'Configure the message content');
                }
                break;
        }
    }
    return issues;
}
export function validateWorkflow(nodes: WorkflowNode[], edges: WorkflowEdge[]): ValidationResult {
    const issues: ValidationIssue[] = [];
    const triggerNodes = nodes.filter((node) => TRIGGER_TYPES.includes(node.type));
    const activeTriggerNodes = triggerNodes.filter(isNodeActive);
    if (triggerNodes.length > 0 && activeTriggerNodes.length === 0) {
        issues.push({
            type: 'error',
            category: 'structure',
            message: 'All trigger nodes are deactivated',
            nodeIds: triggerNodes.map((node) => node.id),
            suggestion: 'Activate at least one trigger node before running the workflow.',
        });
    }
    const circularIssue = detectCircularDependencies(nodes, edges);
    if (circularIssue)
        issues.push(circularIssue);
    const orphanedIssue = findOrphanedNodes(nodes, edges);
    if (orphanedIssue)
        issues.push(orphanedIssue);
    const reachableNodeIds = getReachableNodeIds(nodes, edges);
    issues.push(...checkMissingConfigurations(nodes, { reachableNodeIds }));
    const hasErrors = issues.some(i => i.type === 'error');
    return {
        isValid: !hasErrors,
        canExecute: !hasErrors,
        issues,
    };
}
