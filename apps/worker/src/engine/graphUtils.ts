import type { WorkflowNode, WorkflowEdge } from './types/index.js';
export function buildAdjacencyList(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, string[]> {
    const graph = new Map<string, string[]>();
    for (const node of nodes) {
        graph.set(node.id, []);
    }
    for (const edge of edges) {
        const dependents = graph.get(edge.source);
        if (dependents) {
            dependents.push(edge.target);
        }
    }
    return graph;
}
export function calculateInDegree(nodes: WorkflowNode[], edges: WorkflowEdge[]): Map<string, number> {
    const inDegree = new Map<string, number>();
    for (const node of nodes) {
        inDegree.set(node.id, 0);
    }
    for (const edge of edges) {
        const current = inDegree.get(edge.target) || 0;
        inDegree.set(edge.target, current + 1);
    }
    return inDegree;
}
export function detectCycles(nodes: WorkflowNode[], edges: WorkflowEdge[]): boolean {
    const graph = buildAdjacencyList(nodes, edges);
    const visited = new Set<string>();
    const recursionStack = new Set<string>();
    function dfs(nodeId: string): boolean {
        visited.add(nodeId);
        recursionStack.add(nodeId);
        for (const neighbor of graph.get(nodeId) || []) {
            if (!visited.has(neighbor)) {
                if (dfs(neighbor))
                    return true;
            }
            else if (recursionStack.has(neighbor)) {
                return true;
            }
        }
        recursionStack.delete(nodeId);
        return false;
    }
    for (const node of nodes) {
        if (!visited.has(node.id)) {
            if (dfs(node.id))
                return true;
        }
    }
    return false;
}
export function buildExecutionBatches(nodes: WorkflowNode[], edges: WorkflowEdge[]): WorkflowNode[][] {
    if (nodes.length === 0)
        return [];
    const graph = buildAdjacencyList(nodes, edges);
    const inDegree = calculateInDegree(nodes, edges);
    const nodeMap = new Map(nodes.map(n => [n.id, n]));
    const batches: WorkflowNode[][] = [];
    let currentBatch = nodes.filter(n => inDegree.get(n.id) === 0);
    while (currentBatch.length > 0) {
        batches.push(currentBatch);
        const nextBatch: WorkflowNode[] = [];
        for (const node of currentBatch) {
            for (const dependentId of graph.get(node.id) || []) {
                const newDegree = (inDegree.get(dependentId) || 0) - 1;
                inDegree.set(dependentId, newDegree);
                if (newDegree === 0) {
                    const dependentNode = nodeMap.get(dependentId);
                    if (dependentNode) {
                        nextBatch.push(dependentNode);
                    }
                }
            }
        }
        currentBatch = nextBatch;
    }
    const processedCount = batches.reduce((sum, batch) => sum + batch.length, 0);
    if (processedCount !== nodes.length) {
        throw new Error('Circular dependency detected in workflow');
    }
    return batches;
}
export function getReachableNodes(nodes: WorkflowNode[], edges: WorkflowEdge[], startNodeIds?: string[]): WorkflowNode[] {
    const graph = buildAdjacencyList(nodes, edges);
    const triggerTypes = ['triggerNode', 'manualTrigger', 'webhookTrigger', 'cronTrigger'];
    const triggerNodes = startNodeIds && startNodeIds.length > 0
        ? nodes.filter(n => startNodeIds.includes(n.id))
        : nodes.filter(n => triggerTypes.includes(n.type));
    if (triggerNodes.length === 0)
        return nodes;
    const visited = new Set<string>();
    const queue: string[] = [];
    for (const trigger of triggerNodes) {
        const hasOutgoing = edges.some(e => e.source === trigger.id);
        if (hasOutgoing) {
            visited.add(trigger.id);
            queue.push(trigger.id);
        }
    }
    if (queue.length === 0) {
        if (startNodeIds && startNodeIds.length > 0) {
            return triggerNodes;
        }
        return nodes;
    }
    while (queue.length > 0) {
        const current = queue.shift()!;
        for (const neighbor of graph.get(current) || []) {
            if (!visited.has(neighbor)) {
                visited.add(neighbor);
                queue.push(neighbor);
            }
        }
    }
    return nodes.filter(n => visited.has(n.id));
}
export function getReadyNodes(nodes: WorkflowNode[], edges: WorkflowEdge[], completedNodeIds: Set<string>, runningNodeIds: Set<string>, failedNodeIds: Set<string>): WorkflowNode[] {
    const readyNodes: WorkflowNode[] = [];
    for (const node of nodes) {
        if (completedNodeIds.has(node.id) || runningNodeIds.has(node.id) || failedNodeIds.has(node.id)) {
            continue;
        }
        const incomingEdges = edges.filter(e => e.target === node.id);
        const allDependenciesMet = incomingEdges.every(edge => completedNodeIds.has(edge.source));
        if (allDependenciesMet) {
            readyNodes.push(node);
        }
    }
    return readyNodes;
}
