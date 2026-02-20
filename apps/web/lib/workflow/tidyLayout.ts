import type { Node, Edge } from "@xyflow/react";
const H_GAP = 280;
const V_GAP = 150;
const NODE_HEIGHT = 80;
export function computeTidyLayout(nodes: Node[], edges: Edge[]): Node[] {
    if (nodes.length === 0)
        return nodes;
    const inDegree = new Map<string, number>();
    const children = new Map<string, string[]>();
    for (const node of nodes) {
        inDegree.set(node.id, 0);
        children.set(node.id, []);
    }
    for (const edge of edges) {
        inDegree.set(edge.target, (inDegree.get(edge.target) ?? 0) + 1);
        children.get(edge.source)?.push(edge.target);
    }
    const colMap = new Map<string, number>();
    const queue: string[] = [];
    for (const [id, deg] of inDegree) {
        if (deg === 0) {
            queue.push(id);
            colMap.set(id, 0);
        }
    }
    while (queue.length > 0) {
        const id = queue.shift()!;
        const col = colMap.get(id) ?? 0;
        for (const child of children.get(id) ?? []) {
            if ((colMap.get(child) ?? -1) < col + 1) {
                colMap.set(child, col + 1);
                queue.push(child);
            }
        }
    }
    let maxCol = colMap.size > 0 ? Math.max(...colMap.values()) : 0;
    for (const node of nodes) {
        if (!colMap.has(node.id))
            colMap.set(node.id, ++maxCol);
    }
    const colGroups = new Map<number, Node[]>();
    for (const node of nodes) {
        const col = colMap.get(node.id)!;
        if (!colGroups.has(col))
            colGroups.set(col, []);
        colGroups.get(col)!.push(node);
    }
    for (const group of colGroups.values()) {
        group.sort((a, b) => a.position.y - b.position.y);
    }
    return nodes.map(node => {
        const col = colMap.get(node.id)!;
        const group = colGroups.get(col)!;
        const row = group.findIndex(n => n.id === node.id);
        return {
            ...node,
            position: {
                x: col * H_GAP,
                y: row * (NODE_HEIGHT + V_GAP),
            },
        };
    });
}
