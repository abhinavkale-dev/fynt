import { NodeStatus, prisma, WorkflowStatus } from "@repo/prisma";
import { isWorkflowSourceDisabledInProduction } from "@repo/shared/automation-flags";
import { redis } from "@repo/shared/redis";
import { executeNode } from "./nodeExecutor.js";
import { acquireLock, LOCK_TTL_SECONDS, releaseLock, renewLock } from "./lockManager.js";
import { parseWorkflowNodes, parseWorkflowEdges, type NodeRun, type WorkflowNode, type WorkflowEdge } from "./types/index.js";
import { detectCycles, getReachableNodes } from "./graphUtils.js";
const WORKER_ID = `worker-${process.pid}-${Date.now()}`;
export type ExecutionMode = 'legacy' | 'strict_template_v1';
export function getExecutionMode(workflowMetadata: unknown): ExecutionMode {
    if (!workflowMetadata || typeof workflowMetadata !== 'object') {
        return 'legacy';
    }
    const mode = (workflowMetadata as {
        executionMode?: unknown;
    }).executionMode;
    return mode === 'strict_template_v1' ? 'strict_template_v1' : 'legacy';
}
type EdgeActivation = 'active' | 'inactive';
interface BatchResult {
    nodeId: string;
    success: boolean;
    error?: Error;
}
interface TriggerSelectionResult {
    startNodeIds: string[];
    error: string | null;
}
interface NodeRunOutputRow {
    nodeId: string;
    status: NodeStatus;
    output: unknown;
}
const TRIGGER_TYPES = new Set(['triggerNode', 'manualTrigger', 'webhookTrigger', 'cronTrigger']);
function isTriggerNode(node: WorkflowNode): boolean {
    return TRIGGER_TYPES.has(node.type);
}
function isManualTriggerNode(node: WorkflowNode): boolean {
    return node.type === 'manualTrigger' || node.type === 'triggerNode';
}
function isNodeActive(node: WorkflowNode): boolean {
    const nodeData = node.data as Record<string, unknown>;
    return nodeData.isActive !== false;
}
function getWorkflowRunSource(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== 'object') {
        return null;
    }
    const source = (metadata as {
        source?: unknown;
    }).source;
    return typeof source === 'string' ? source : null;
}
function isBypassedSkipOutput(output: unknown): output is {
    bypassed: true;
    passthrough?: unknown;
} {
    return Boolean(output &&
        typeof output === 'object' &&
        (output as {
            bypassed?: unknown;
        }).bypassed === true);
}
function getConditionDefaultRoute(node: WorkflowNode): string {
    if (node.type !== 'conditionNode') {
        return 'default';
    }
    return typeof node.data.defaultRoute === 'string' && node.data.defaultRoute.trim().length > 0
        ? node.data.defaultRoute.trim()
        : 'default';
}
function buildBypassedNodeOutput(node: WorkflowNode, incomingByTarget: Map<string, WorkflowEdge[]>, edgeActivation: Map<string, EdgeActivation>, nodeById: Map<string, WorkflowNode>, outputByNodeId: Map<string, unknown>): {
    skipped: true;
    bypassed: true;
    reason: string;
    passthrough: unknown;
} {
    const incomingEdges = incomingByTarget.get(node.id) ?? [];
    const upstreamOutputs: Array<[
        string,
        unknown
    ]> = [];
    for (const edge of incomingEdges) {
        const activation = edgeActivation.get(edge.id) ?? 'active';
        if (activation !== 'active') {
            continue;
        }
        const sourceNode = nodeById.get(edge.source);
        if (!sourceNode || !isNodeActive(sourceNode)) {
            continue;
        }
        if (!outputByNodeId.has(edge.source)) {
            continue;
        }
        upstreamOutputs.push([edge.source, outputByNodeId.get(edge.source)]);
    }
    let passthrough: unknown = {};
    if (upstreamOutputs.length === 1) {
        passthrough = upstreamOutputs[0]?.[1] ?? {};
    }
    else if (upstreamOutputs.length > 1) {
        passthrough = Object.fromEntries(upstreamOutputs);
    }
    return {
        skipped: true,
        bypassed: true,
        reason: 'Node is deactivated',
        passthrough,
    };
}
export async function executeWorkflow(workflowRunId: string): Promise<void> {
    const lockAcquired = await acquireLock(workflowRunId, WORKER_ID);
    if (!lockAcquired) {
        console.log(`[${WORKER_ID}] Could not acquire lock for ${workflowRunId}, skipping`);
        return;
    }
    const lockHeartbeatIntervalMs = Math.max(1000, Math.floor((LOCK_TTL_SECONDS * 1000) / 2));
    const lockHeartbeat = setInterval(() => {
        renewLock(workflowRunId, WORKER_ID).catch((error) => {
            console.error(`[${WORKER_ID}] Failed to renew lock for ${workflowRunId}:`, error);
        });
    }, lockHeartbeatIntervalMs);
    try {
        const workflowRun = await prisma.workflowRun.findUnique({
            where: { id: workflowRunId },
            include: {
                workflow: true,
                nodeRuns: true,
            },
        });
        if (!workflowRun) {
            throw new Error(`Workflow run ${workflowRunId} not found`);
        }
        const executionMode = getExecutionMode(workflowRun.metadata);
        console.log(`[${WORKER_ID}] Execution mode: ${executionMode}`);
        const ownerUserId = workflowRun.workflow.userId;
        if (!ownerUserId) {
            throw new Error(`Workflow ${workflowRun.workflow.id} has no owner user id`);
        }
        const nodes = parseWorkflowNodes(workflowRun.workflow.nodes);
        const edges = parseWorkflowEdges(workflowRun.workflow.edges);
        const targetNodeId = getTargetNodeId(workflowRun.metadata);
        const workflowRunSource = getWorkflowRunSource(workflowRun.metadata);
        if (isWorkflowSourceDisabledInProduction(workflowRunSource)) {
            const sourceLabel = workflowRunSource === 'webhook' ? 'Webhook' : 'Cron';
            throw new Error(`${sourceLabel} executions are disabled in production for this deployment.`);
        }
        const allNodeById = new Map(nodes.map((node) => [node.id, node]));
        if (targetNodeId) {
            const targetNode = nodes.find((node) => node.id === targetNodeId);
            if (!targetNode) {
                throw new Error(`Target node ${targetNodeId} not found in workflow`);
            }
            if (!isNodeActive(targetNode)) {
                throw new Error(`Target node ${targetNodeId} is deactivated`);
            }
            console.log(`[${WORKER_ID}] Executing single node ${targetNodeId}`);
            const currentNodeRuns = await getNodeRunsMinimal(workflowRunId);
            const result = await executeSingleNode(workflowRunId, targetNode, currentNodeRuns, executionMode, allNodeById, ownerUserId);
            await updateWorkflowStatus(workflowRunId, result.success ? WorkflowStatus.Success : WorkflowStatus.Failure);
            return;
        }
        if (nodes.length === 0) {
            await updateWorkflowStatus(workflowRunId, WorkflowStatus.Success);
            console.log(`Workflow ${workflowRunId} has no nodes, marking complete`);
            return;
        }
        if (detectCycles(nodes, edges)) {
            throw new Error("Circular dependency detected in workflow. Cannot execute.");
        }
        const triggerNodes = nodes.filter(isTriggerNode);
        const triggerSelection = selectTriggerEntryNodes(workflowRun.metadata, nodes);
        if (triggerSelection.error) {
            throw new Error(triggerSelection.error);
        }
        const startNodeIds = triggerSelection.startNodeIds;
        if (triggerNodes.length > 0 && startNodeIds.length === 0) {
            if (workflowRunSource === 'manual') {
                throw new Error('No active manual trigger nodes found. Use webhook URL or cron schedule for this workflow, or add a manual trigger.');
            }
            throw new Error('All trigger nodes are deactivated. Activate at least one trigger node.');
        }
        const reachableNodes = getReachableNodes(nodes, edges, startNodeIds);
        const reachableNodeIdSet = new Set(reachableNodes.map((node) => node.id));
        const reachableEdges = edges.filter((edge) => reachableNodeIdSet.has(edge.source) && reachableNodeIdSet.has(edge.target));
        console.log(`[${WORKER_ID}] Starting conditional-aware execution: ` +
            `${reachableNodes.length}/${nodes.length} reachable nodes, ${reachableEdges.length} edges`);
        const nodeById = new Map(reachableNodes.map((node) => [node.id, node]));
        const incomingByTarget = new Map<string, WorkflowEdge[]>();
        const outgoingBySource = new Map<string, WorkflowEdge[]>();
        for (const edge of reachableEdges) {
            const incoming = incomingByTarget.get(edge.target) ?? [];
            incoming.push(edge);
            incomingByTarget.set(edge.target, incoming);
            const outgoing = outgoingBySource.get(edge.source) ?? [];
            outgoing.push(edge);
            outgoingBySource.set(edge.source, outgoing);
        }
        const completedNodeIds = new Set<string>();
        const failedNodeIds = new Set<string>();
        const skippedNodeIds = new Set<string>();
        const outputByNodeId = new Map<string, unknown>();
        const edgeActivation = new Map<string, EdgeActivation>();
        for (const edge of reachableEdges) {
            const sourceNode = nodeById.get(edge.source);
            if (sourceNode?.type !== 'conditionNode') {
                edgeActivation.set(edge.id, 'active');
            }
        }
        for (const nodeRun of workflowRun.nodeRuns) {
            if (!reachableNodeIdSet.has(nodeRun.nodeId)) {
                continue;
            }
            if (nodeRun.status === NodeStatus.Success) {
                completedNodeIds.add(nodeRun.nodeId);
                if (nodeRun.output !== null && nodeRun.output !== undefined) {
                    outputByNodeId.set(nodeRun.nodeId, nodeRun.output);
                }
            }
            else if (nodeRun.status === NodeStatus.Skipped) {
                if (isBypassedSkipOutput(nodeRun.output)) {
                    completedNodeIds.add(nodeRun.nodeId);
                    outputByNodeId.set(nodeRun.nodeId, nodeRun.output.passthrough ?? {});
                }
                else {
                    skippedNodeIds.add(nodeRun.nodeId);
                }
            }
            else if (nodeRun.status === NodeStatus.Failed && nodeRun.retryCount >= 3) {
                failedNodeIds.add(nodeRun.nodeId);
            }
        }
        for (const node of reachableNodes) {
            if (node.type !== 'conditionNode' || !completedNodeIds.has(node.id)) {
                continue;
            }
            applyConditionEdgeActivation(node, outputByNodeId.get(node.id), outgoingBySource.get(node.id) ?? [], edgeActivation);
        }
        let batchNumber = 0;
        while (true) {
            const pendingNodes = reachableNodes.filter((node) => !completedNodeIds.has(node.id) &&
                !failedNodeIds.has(node.id) &&
                !skippedNodeIds.has(node.id));
            if (pendingNodes.length === 0) {
                break;
            }
            const nodesToSkip = pendingNodes.filter((node) => shouldSkipNode(node, incomingByTarget, edgeActivation, completedNodeIds, failedNodeIds, skippedNodeIds, nodeById));
            if (nodesToSkip.length > 0) {
                for (const node of nodesToSkip) {
                    await markNodeSkipped(workflowRunId, node);
                    skippedNodeIds.add(node.id);
                }
            }
            const nodesToBypass = pendingNodes.filter((node) => !skippedNodeIds.has(node.id) &&
                !isNodeActive(node) &&
                canExecuteNode(node, incomingByTarget, edgeActivation, completedNodeIds, failedNodeIds, nodeById));
            if (nodesToBypass.length > 0) {
                for (const node of nodesToBypass) {
                    const bypassOutput = buildBypassedNodeOutput(node, incomingByTarget, edgeActivation, nodeById, outputByNodeId);
                    await markNodeSkipped(workflowRunId, node, bypassOutput);
                    completedNodeIds.add(node.id);
                    outputByNodeId.set(node.id, bypassOutput.passthrough);
                    if (node.type === 'conditionNode') {
                        applyConditionEdgeActivation(node, { route: getConditionDefaultRoute(node) }, outgoingBySource.get(node.id) ?? [], edgeActivation);
                    }
                }
            }
            const nodesToExecute = pendingNodes.filter((node) => !skippedNodeIds.has(node.id) &&
                isNodeActive(node) &&
                canExecuteNode(node, incomingByTarget, edgeActivation, completedNodeIds, failedNodeIds, nodeById));
            if (nodesToExecute.length === 0) {
                const unresolved = reachableNodes.filter((node) => !completedNodeIds.has(node.id) && !failedNodeIds.has(node.id) && !skippedNodeIds.has(node.id));
                if (unresolved.length > 0) {
                    console.error(`[${WORKER_ID}] Unresolved nodes remain with no executable/skippable path: ${unresolved
                        .map((node) => `${node.id}:${node.type}`)
                        .join(', ')}`);
                }
                break;
            }
            batchNumber += 1;
            console.log(`[${WORKER_ID}] Batch ${batchNumber}: Executing ${nodesToExecute.length} node(s)`);
            const currentNodeRuns = await getNodeRunsMinimal(workflowRunId);
            const results = await Promise.all(nodesToExecute.map((node) => executeSingleNode(workflowRunId, node, currentNodeRuns, executionMode, nodeById, ownerUserId)));
            const succeededIds: string[] = [];
            for (const result of results) {
                if (result.success) {
                    completedNodeIds.add(result.nodeId);
                    succeededIds.push(result.nodeId);
                }
                else {
                    failedNodeIds.add(result.nodeId);
                }
            }
            if (succeededIds.length > 0) {
                const successRows = await getNodeRunOutputs(workflowRunId, succeededIds);
                for (const row of successRows) {
                    if (row.status === NodeStatus.Success) {
                        outputByNodeId.set(row.nodeId, row.output);
                    }
                }
                for (const nodeId of succeededIds) {
                    const node = nodeById.get(nodeId);
                    if (!node || node.type !== 'conditionNode') {
                        continue;
                    }
                    applyConditionEdgeActivation(node, outputByNodeId.get(node.id), outgoingBySource.get(node.id) ?? [], edgeActivation);
                }
            }
            const successCount = results.filter((result) => result.success).length;
            const failCount = results.length - successCount;
            console.log(`[${WORKER_ID}] Batch ${batchNumber} complete: ${successCount} success, ${failCount} failed`);
        }
        const finalStatus = determineFinalStatus(reachableNodes.length, completedNodeIds.size, failedNodeIds.size, skippedNodeIds.size);
        await updateWorkflowStatus(workflowRunId, finalStatus);
        console.log(`[${WORKER_ID}] Workflow ${workflowRunId} finished: ${finalStatus} ` +
            `(success=${completedNodeIds.size}, skipped=${skippedNodeIds.size}, failed=${failedNodeIds.size})`);
    }
    catch (error) {
        console.error(`[${WORKER_ID}] Workflow ${workflowRunId} failed:`, error);
        await prisma.workflowRun.update({
            where: { id: workflowRunId },
            data: {
                status: WorkflowStatus.Failure,
                finishedAt: new Date(),
                errorMetadata: {
                    message: error instanceof Error ? error.message : "Unknown error",
                    workerId: WORKER_ID,
                },
            },
        });
        redis.publish(`workflow-run:${workflowRunId}`, JSON.stringify({
            type: 'workflow',
            status: 'Failure',
            error: error instanceof Error ? error.message : "Unknown error",
            timestamp: Date.now(),
        })).catch(() => { });
        throw error;
    }
    finally {
        clearInterval(lockHeartbeat);
        const released = await releaseLock(workflowRunId, WORKER_ID);
        if (!released) {
            console.warn(`[${WORKER_ID}] Lock for ${workflowRunId} was not owned at release time`);
        }
    }
}
async function executeSingleNode(workflowRunId: string, node: WorkflowNode, nodeRuns: NodeRun[], executionMode: ExecutionMode, nodeById: Map<string, WorkflowNode>, ownerUserId: string): Promise<BatchResult> {
    try {
        await executeNode(workflowRunId, node, nodeRuns, executionMode, ownerUserId, nodeById);
        return { nodeId: node.id, success: true };
    }
    catch (error) {
        console.error(`[${WORKER_ID}] Node ${node.id} (${node.type}) failed:`, error);
        return {
            nodeId: node.id,
            success: false,
            error: error instanceof Error ? error : new Error(String(error)),
        };
    }
}
function canExecuteNode(node: WorkflowNode, incomingByTarget: Map<string, WorkflowEdge[]>, edgeActivation: Map<string, EdgeActivation>, completedNodeIds: Set<string>, failedNodeIds: Set<string>, nodeById: Map<string, WorkflowNode>): boolean {
    const incomingEdges = incomingByTarget.get(node.id) ?? [];
    if (incomingEdges.length === 0) {
        return true;
    }
    let hasActiveDependency = false;
    for (const edge of incomingEdges) {
        const sourceNode = nodeById.get(edge.source);
        if (!sourceNode) {
            continue;
        }
        if (sourceNode.type === 'conditionNode' && !edgeActivation.has(edge.id) && !completedNodeIds.has(edge.source)) {
            return false;
        }
        const activation = edgeActivation.get(edge.id) ?? 'active';
        if (activation === 'inactive') {
            continue;
        }
        hasActiveDependency = true;
        if (failedNodeIds.has(edge.source)) {
            return false;
        }
        if (!completedNodeIds.has(edge.source)) {
            return false;
        }
    }
    return hasActiveDependency;
}
function shouldSkipNode(node: WorkflowNode, incomingByTarget: Map<string, WorkflowEdge[]>, edgeActivation: Map<string, EdgeActivation>, completedNodeIds: Set<string>, failedNodeIds: Set<string>, skippedNodeIds: Set<string>, nodeById: Map<string, WorkflowNode>): boolean {
    const incomingEdges = incomingByTarget.get(node.id) ?? [];
    if (incomingEdges.length === 0) {
        return false;
    }
    const activeSources: string[] = [];
    for (const edge of incomingEdges) {
        const sourceNode = nodeById.get(edge.source);
        if (!sourceNode) {
            continue;
        }
        const sourceResolved = completedNodeIds.has(edge.source) ||
            failedNodeIds.has(edge.source) ||
            skippedNodeIds.has(edge.source);
        if (!sourceResolved) {
            const conditionEdgePending = sourceNode.type === 'conditionNode' && edgeActivation.has(edge.id);
            if (!conditionEdgePending) {
                return false;
            }
        }
        const activation = edgeActivation.get(edge.id) ?? 'active';
        if (activation === 'active') {
            activeSources.push(edge.source);
        }
    }
    if (activeSources.length === 0) {
        return true;
    }
    return activeSources.every((sourceId) => skippedNodeIds.has(sourceId));
}
async function markNodeSkipped(workflowRunId: string, node: WorkflowNode, output?: unknown): Promise<void> {
    const skipOutput = output ?? {
        skipped: true,
        reason: 'Path not selected by routing logic',
    };
    const existing = await prisma.nodeRun.findFirst({
        where: {
            workflowRunId,
            nodeId: node.id,
        },
    });
    if (existing) {
        await prisma.nodeRun.update({
            where: { id: existing.id },
            data: {
                status: NodeStatus.Skipped,
                completedAt: new Date(),
                output: skipOutput,
            },
        });
    }
    else {
        await prisma.nodeRun.create({
            data: {
                workflowRunId,
                nodeId: node.id,
                nodeType: node.type,
                status: NodeStatus.Skipped,
                retryCount: 0,
                startedAt: new Date(),
                completedAt: new Date(),
                output: skipOutput,
            },
        });
    }
    redis.publish(`workflow-run:${workflowRunId}`, JSON.stringify({
        type: 'node',
        nodeId: node.id,
        status: 'Skipped',
        nodeType: node.type,
        timestamp: Date.now(),
    })).catch(() => { });
}
function applyConditionEdgeActivation(node: WorkflowNode, output: unknown, outgoingEdges: WorkflowEdge[], edgeActivation: Map<string, EdgeActivation>): void {
    if (node.type !== 'conditionNode') {
        return;
    }
    const selectedRoute = extractSelectedRoute(output);
    const nodeDefaultRoute = typeof node.data.defaultRoute === 'string' && node.data.defaultRoute.trim().length > 0
        ? node.data.defaultRoute.trim()
        : 'default';
    for (const edge of outgoingEdges) {
        const dataRoute = typeof edge.data?.route === 'string' ? edge.data.route : undefined;
        const edgeRoute = edge.sourceHandle ?? dataRoute ?? nodeDefaultRoute;
        edgeActivation.set(edge.id, edgeRoute === selectedRoute ? 'active' : 'inactive');
    }
}
function extractSelectedRoute(output: unknown): string {
    if (!output || typeof output !== 'object') {
        return 'default';
    }
    const routeValue = (output as {
        route?: unknown;
    }).route;
    if (typeof routeValue === 'string' && routeValue.trim().length > 0) {
        return routeValue;
    }
    const routesValue = (output as {
        routes?: unknown;
    }).routes;
    if (Array.isArray(routesValue) && typeof routesValue[0] === 'string') {
        return routesValue[0];
    }
    return 'default';
}
async function getNodeRunsMinimal(workflowRunId: string): Promise<NodeRun[]> {
    const runs = await prisma.nodeRun.findMany({
        where: { workflowRunId },
        select: {
            id: true,
            nodeId: true,
            status: true,
            retryCount: true,
            output: true,
        },
    });
    return runs.map((run: typeof runs[number]): NodeRun => ({
        id: run.id,
        nodeId: run.nodeId,
        status: run.status,
        retryCount: run.retryCount,
        output: run.output as NodeRun['output'],
    } as NodeRun));
}
async function getNodeRunOutputs(workflowRunId: string, nodeIds: string[]): Promise<NodeRunOutputRow[]> {
    if (nodeIds.length === 0) {
        return [];
    }
    const rows = await prisma.nodeRun.findMany({
        where: {
            workflowRunId,
            nodeId: { in: nodeIds },
        },
        select: {
            nodeId: true,
            status: true,
            output: true,
        },
    });
    return rows.map((row) => ({
        nodeId: row.nodeId,
        status: row.status,
        output: row.output,
    }));
}
function determineFinalStatus(totalNodes: number, completedCount: number, failedCount: number, skippedCount: number): WorkflowStatus {
    if (failedCount > 0) {
        return WorkflowStatus.Failure;
    }
    if (completedCount + skippedCount === totalNodes) {
        return WorkflowStatus.Success;
    }
    return WorkflowStatus.Failure;
}
async function updateWorkflowStatus(workflowRunId: string, status: WorkflowStatus): Promise<void> {
    await prisma.workflowRun.update({
        where: { id: workflowRunId },
        data: {
            status,
            finishedAt: new Date(),
        },
    });
    redis.publish(`workflow-run:${workflowRunId}`, JSON.stringify({
        type: 'workflow',
        status: status.toString(),
        timestamp: Date.now(),
    })).catch(() => { });
}
function getTargetNodeId(metadata: unknown): string | null {
    if (!metadata || typeof metadata !== "object") {
        return null;
    }
    const source = (metadata as {
        source?: unknown;
    }).source;
    if (source !== 'manual-node') {
        return null;
    }
    const nodeId = (metadata as {
        nodeId?: unknown;
    }).nodeId;
    return typeof nodeId === "string" && nodeId.length > 0 ? nodeId : null;
}
function selectTriggerEntryNodes(metadata: unknown, nodes: WorkflowNode[]): TriggerSelectionResult {
    const activeTriggerNodeIds = nodes
        .filter((node) => isTriggerNode(node) && isNodeActive(node))
        .map((node) => node.id);
    if (!metadata || typeof metadata !== 'object') {
        return {
            startNodeIds: activeTriggerNodeIds,
            error: null,
        };
    }
    const source = (metadata as {
        source?: unknown;
    }).source;
    const nodeId = (metadata as {
        nodeId?: unknown;
    }).nodeId;
    if (source === 'manual') {
        const manualTriggerNodeIds = nodes
            .filter((node) => isManualTriggerNode(node) && isNodeActive(node))
            .map((node) => node.id);
        if (manualTriggerNodeIds.length === 0) {
            return {
                startNodeIds: [],
                error: 'Manual execution requires an active manual trigger node. Use webhook URL or cron schedule for non-manual workflows.',
            };
        }
        return {
            startNodeIds: manualTriggerNodeIds,
            error: null,
        };
    }
    if (source === 'webhook' || source === 'cron') {
        if (typeof nodeId !== 'string' || nodeId.length === 0) {
            return {
                startNodeIds: [],
                error: `${source} execution is missing trigger node context.`,
            };
        }
        const matching = nodes.find((node) => node.id === nodeId);
        const expectedType = source === 'webhook' ? 'webhookTrigger' : 'cronTrigger';
        if (!matching) {
            return {
                startNodeIds: [],
                error: `${source} trigger node ${nodeId} was not found.`,
            };
        }
        if (matching.type !== expectedType) {
            return {
                startNodeIds: [],
                error: `${source} run expected ${expectedType} but received ${matching.type} for node ${nodeId}.`,
            };
        }
        if (!isNodeActive(matching)) {
            return {
                startNodeIds: [],
                error: `${source} trigger node ${nodeId} is deactivated.`,
            };
        }
        return {
            startNodeIds: [nodeId],
            error: null,
        };
    }
    if (source === 'manual-node') {
        return {
            startNodeIds: [],
            error: 'Manual-node execution requires a target node context.',
        };
    }
    return {
        startNodeIds: activeTriggerNodeIds,
        error: null,
    };
}
