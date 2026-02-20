'use client';
import { useCallback, type Dispatch, type SetStateAction } from 'react';
import { addEdge, type Connection, type Edge, type Node } from '@xyflow/react';
interface SaveOverrides {
    nodes?: Node[];
    edges?: Edge[];
    title?: string;
}
type AutoCredentialByProvider = Partial<Record<'openai' | 'anthropic' | 'gemini', string>>;
interface UseWorkflowCanvasActionsParams {
    nodes: Node[];
    edges: Edge[];
    setNodes: Dispatch<SetStateAction<Node[]>>;
    setEdges: Dispatch<SetStateAction<Edge[]>>;
    markWorkflowChanged: () => void;
    currentWorkflowId: string;
    isTemplateWorkflow?: boolean;
    handleImmediateSave: (overrides?: SaveOverrides) => Promise<void>;
    onBeforeGraphMutation?: () => void;
    autoCredentialByProvider?: AutoCredentialByProvider;
}
function isManualTriggerNodeType(nodeType: string): boolean {
    return nodeType === 'manualTrigger' || nodeType === 'triggerNode';
}
function hasManualTriggerNode(nodes: Node[]): boolean {
    return nodes.some((node) => isManualTriggerNodeType(node.type ?? ''));
}
function getAIProviderForNodeType(nodeType: string): keyof AutoCredentialByProvider | null {
    if (nodeType === 'openaiNode' || nodeType === 'aiNode')
        return 'openai';
    if (nodeType === 'anthropicNode')
        return 'anthropic';
    if (nodeType === 'geminiNode')
        return 'gemini';
    return null;
}
export function useWorkflowCanvasActions({ nodes, edges, setNodes, setEdges, markWorkflowChanged, currentWorkflowId, isTemplateWorkflow, handleImmediateSave, onBeforeGraphMutation, autoCredentialByProvider, }: UseWorkflowCanvasActionsParams) {
    const onConnect = useCallback((params: Connection | Edge) => {
        onBeforeGraphMutation?.();
        const routeLabel = 'sourceHandle' in params && typeof params.sourceHandle === 'string'
            ? params.sourceHandle
            : undefined;
        const nextEdges = addEdge(routeLabel
            ? {
                ...params,
                data: {
                    ...((params as Edge).data ?? {}),
                    route: routeLabel,
                },
            }
            : params, edges);
        setEdges(nextEdges);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ edges: nextEdges });
        }
    }, [setEdges, markWorkflowChanged, onBeforeGraphMutation, edges, currentWorkflowId, handleImmediateSave]);
    const addNode = useCallback((nodeType: string, label: string) => {
        if (isManualTriggerNodeType(nodeType) && hasManualTriggerNode(nodes)) {
            return false;
        }
        const aiProvider = getAIProviderForNodeType(nodeType);
        const prefilledCredentialId = aiProvider
            ? autoCredentialByProvider?.[aiProvider]
            : undefined;
        const newNode: Node = {
            id: crypto.randomUUID(),
            type: nodeType,
            position: { x: 250, y: nodes.length * 100 + 50 },
            data: {
                label,
                nodeType,
                isConfigured: false,
                ...(prefilledCredentialId ? { credentialId: prefilledCredentialId } : {}),
            },
        };
        onBeforeGraphMutation?.();
        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ nodes: updatedNodes });
        }
        return true;
    }, [nodes, setNodes, markWorkflowChanged, autoCredentialByProvider, onBeforeGraphMutation, currentWorkflowId, handleImmediateSave]);
    const updateNodeData = useCallback(async (nodeId: string, data: unknown) => {
        const incomingData = data && typeof data === 'object'
            ? (data as Record<string, unknown>)
            : {};
        const updatedNodes = nodes.map((node: Node) => {
            if (node.id !== nodeId)
                return node;
            const existingData = node.data && typeof node.data === 'object'
                ? (node.data as Record<string, unknown>)
                : {};
            const mergedData: Record<string, unknown> = { ...existingData, ...incomingData };
            const hasCredential = typeof mergedData.credentialId === 'string' &&
                mergedData.credentialId.trim().length > 0;
            if (hasCredential && (node.type === 'discordNode' || node.type === 'slackNode')) {
                delete mergedData.webhookUrl;
            }
            return { ...node, data: mergedData };
        });
        setNodes(updatedNodes);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            await handleImmediateSave({ nodes: updatedNodes });
        }
    }, [
        nodes,
        setNodes,
        markWorkflowChanged,
        currentWorkflowId,
        handleImmediateSave,
    ]);
    const deleteNode = useCallback((nodeId: string) => {
        const updatedNodes = nodes.filter((node: Node) => node.id !== nodeId);
        const updatedEdges = edges.filter((edge: Edge) => edge.source !== nodeId && edge.target !== nodeId);
        if (isTemplateWorkflow && updatedNodes.length === 0) {
            return;
        }
        onBeforeGraphMutation?.();
        setNodes(updatedNodes);
        setEdges(updatedEdges);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ nodes: updatedNodes, edges: updatedEdges });
        }
    }, [
        nodes,
        edges,
        setNodes,
        setEdges,
        markWorkflowChanged,
        currentWorkflowId,
        isTemplateWorkflow,
        handleImmediateSave,
        onBeforeGraphMutation,
    ]);
    const addNodeAtPosition = useCallback((type: string, position = { x: 250, y: 50 }) => {
        if (isManualTriggerNodeType(type) && hasManualTriggerNode(nodes)) {
            return;
        }
        const aiProvider = getAIProviderForNodeType(type);
        const prefilledCredentialId = aiProvider
            ? autoCredentialByProvider?.[aiProvider]
            : undefined;
        const newNode: Node = {
            id: crypto.randomUUID(),
            type,
            position,
            data: {
                label: `${type} Node`,
                nodeType: type,
                isConfigured: false,
                ...(prefilledCredentialId ? { credentialId: prefilledCredentialId } : {}),
            },
        };
        onBeforeGraphMutation?.();
        const updatedNodes = [...nodes, newNode];
        setNodes(updatedNodes);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ nodes: updatedNodes });
        }
    }, [nodes, setNodes, markWorkflowChanged, autoCredentialByProvider, onBeforeGraphMutation, currentWorkflowId, handleImmediateSave]);
    const duplicateNode = useCallback((nodeId: string) => {
        onBeforeGraphMutation?.();
        const nodeToDuplicate = nodes.find((node: Node) => node.id === nodeId);
        if (!nodeToDuplicate) {
            return;
        }
        const duplicatedNode: Node = {
            ...nodeToDuplicate,
            id: crypto.randomUUID(),
            position: {
                x: nodeToDuplicate.position.x + 50,
                y: nodeToDuplicate.position.y + 50,
            },
        };
        const updatedNodes = [...nodes, duplicatedNode];
        setNodes(updatedNodes);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ nodes: updatedNodes });
        }
    }, [nodes, setNodes, markWorkflowChanged, onBeforeGraphMutation, currentWorkflowId, handleImmediateSave]);
    const getNodeData = useCallback((nodeId: string) => {
        return nodes.find((node: Node) => node.id === nodeId)?.data;
    }, [nodes]);
    return {
        onConnect,
        addNode,
        updateNodeData,
        deleteNode,
        addNodeAtPosition,
        duplicateNode,
        getNodeData,
    };
}
