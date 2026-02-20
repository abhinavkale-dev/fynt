interface GraphNodeLike {
    id?: unknown;
}
interface GraphEdgeLike {
    source?: unknown;
    target?: unknown;
}
export interface GraphShapeValidationResult {
    isValid: boolean;
    errors: string[];
}
export function validateGraphShape(nodes: ReadonlyArray<GraphNodeLike>, edges: ReadonlyArray<GraphEdgeLike>): GraphShapeValidationResult {
    const errors: string[] = [];
    if (edges.length > 0 && nodes.length === 0) {
        errors.push("Graph cannot have edges when nodes are empty.");
    }
    const nodeIds = new Set<string>();
    for (const node of nodes) {
        if (typeof node.id !== "string" || node.id.trim().length === 0) {
            errors.push("Each node must have a non-empty string id.");
            continue;
        }
        nodeIds.add(node.id);
    }
    for (const edge of edges) {
        const source = typeof edge.source === "string" ? edge.source.trim() : "";
        const target = typeof edge.target === "string" ? edge.target.trim() : "";
        if (!source || !target) {
            errors.push("Each edge must include non-empty source and target ids.");
            continue;
        }
        if (!nodeIds.has(source)) {
            errors.push(`Edge source "${source}" does not exist in nodes.`);
        }
        if (!nodeIds.has(target)) {
            errors.push(`Edge target "${target}" does not exist in nodes.`);
        }
    }
    return {
        isValid: errors.length === 0,
        errors,
    };
}
