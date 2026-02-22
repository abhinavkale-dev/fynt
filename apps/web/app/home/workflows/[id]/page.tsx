'use client';
import React, { use, useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import { ReactFlowProvider, applyEdgeChanges, applyNodeChanges, type EdgeChange, useEdgesState, useNodesState, type NodeChange, type Edge, type Node, } from '@xyflow/react';
import { WorkflowCanvas, AddNodeButton, EmptyCanvasPrompt } from '@/components/workflows/canvas';
import { NodeDrawer } from '@/components/workflows/drawer';
import { Drawer } from '@/components/ui/drawer';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { TooltipProvider } from '@/components/ui/tooltip';
import { TemplatePreflightModal } from '@/components/templates/TemplatePreflightModal';
import { EditorProvider } from '@/contexts/EditorContext';
import { trpc } from '@/lib/trpc/client';
import { getWorkflowTemplateById } from '@/lib/templates/catalog';
import { bindCredentialsToTemplate, getTemplateBindingKey, instantiateTemplateGraph, instantiateTemplateGraphPreservingCredentials, type CredentialBinding, } from '@/lib/templates/instantiate';
import { validateGraphShape } from '@/lib/workflow/graphValidation';
import { isExecutionBlockedInClientRuntime } from '@/lib/runtime-mode';
import { RunPanel } from './components/RunPanel';
import { SaveStatusIndicator } from './components/SaveStatusIndicator';
import { UsageCounter } from './components/UsageCounter';
import { WorkflowHeader } from './components/WorkflowHeader';
import { WorkflowLoadingState } from './components/WorkflowLoadingState';
import { WorkflowRouteIssueState } from './components/WorkflowRouteIssueState';
import { useWorkflowCanvasActions } from './hooks/useWorkflowCanvasActions';
import { useWorkflowExecution } from './hooks/useWorkflowExecution';
import { useWorkflowPersistence } from './hooks/useWorkflowPersistence';
const WORKFLOW_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const MAX_WORKFLOW_HISTORY = 100;
interface WorkflowGraphSnapshot {
    nodes: Node[];
    edges: Edge[];
}
function cloneGraphState<T>(value: T): T {
    if (typeof structuredClone === 'function') {
        return structuredClone(value);
    }
    return JSON.parse(JSON.stringify(value)) as T;
}
function parseGraphArray<T>(value: unknown): T[] {
    if (Array.isArray(value)) {
        return value as T[];
    }
    if (value &&
        typeof value === 'object' &&
        Symbol.iterator in value &&
        typeof (value as {
            [Symbol.iterator]?: unknown;
        })[Symbol.iterator] === 'function') {
        try {
            return Array.from(value as Iterable<T>);
        }
        catch {
            // Fall through to object/string parsing below.
        }
    }
    if (value && typeof value === 'object') {
        const entries = Object.entries(value as Record<string, unknown>);
        const numericEntries = entries.filter(([key]) => /^\d+$/.test(key));
        if (numericEntries.length > 0) {
            return numericEntries
                .sort((a, b) => Number(a[0]) - Number(b[0]))
                .map(([, item]) => item as T);
        }
        const keyedArray = (value as Record<string, unknown>).items ??
            (value as Record<string, unknown>).values ??
            (value as Record<string, unknown>).data ??
            (value as Record<string, unknown>).nodes ??
            (value as Record<string, unknown>).edges;
        if (Array.isArray(keyedArray)) {
            return keyedArray as T[];
        }
    }
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            return parseGraphArray<T>(parsed);
        }
        catch {
            // Ignore malformed JSON and return empty graph fallback.
        }
    }
    return [];
}
function isEditableKeyboardTarget(target: EventTarget | null): boolean {
    if (!(target instanceof HTMLElement))
        return false;
    const tagName = target.tagName;
    return (target.isContentEditable ||
        tagName === 'INPUT' ||
        tagName === 'TEXTAREA' ||
        tagName === 'SELECT');
}
function isPersistedNodeChange(change: NodeChange<Node>): boolean {
    if (change.type === 'add' || change.type === 'remove') {
        return true;
    }
    if (change.type === 'position') {
        return change.dragging === false;
    }
    return false;
}
function extractCredentialId(data: unknown): string | undefined {
    if (!data || typeof data !== 'object') {
        return undefined;
    }
    const credentialValue = (data as Record<string, unknown>).credentialId;
    if (typeof credentialValue !== 'string') {
        return undefined;
    }
    const trimmed = credentialValue.trim();
    return trimmed.length > 0 ? trimmed : undefined;
}
const WorkflowId = ({ params }: {
    params: Promise<{
        id: string;
    }>;
}) => {
    const { id } = use(params);
    const router = useRouter();
    const hasValidWorkflowId = id === 'new' || WORKFLOW_ID_PATTERN.test(id);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [showExecutionBlockedDialog, setShowExecutionBlockedDialog] = useState(false);
    const [isEditingTitle, setIsEditingTitle] = useState(false);
    const titleInputRef = React.useRef<HTMLInputElement>(null);
    const [nodes, setNodes] = useNodesState<Node>([]);
    const [edges, setEdges] = useEdgesState<Edge>([]);
    const [workflowTitle, setWorkflowTitle] = useState('Workflow');
    const [tempTitle, setTempTitle] = useState('Workflow');
    const [currentWorkflowId, setCurrentWorkflowId] = useState(id);
    const autoTemplateSetupAppliedRef = React.useRef<Set<string>>(new Set());
    const undoStackRef = React.useRef<WorkflowGraphSnapshot[]>([]);
    const redoStackRef = React.useRef<WorkflowGraphSnapshot[]>([]);
    const isApplyingHistoryRef = React.useRef(false);
    const nodesRef = React.useRef<Node[]>([]);
    const edgesRef = React.useRef<Edge[]>([]);
    const { data: workflowData, isLoading, error, refetch } = trpc.workflow.getById.useQuery({ id }, {
        enabled: id !== 'new' && hasValidWorkflowId,
        staleTime: 60000,
        refetchOnWindowFocus: false,
        refetchOnMount: true,
        trpc: {
            context: {
                skipBatch: true,
            },
        },
        retry: (failureCount, queryError) => {
            const errorCode = (queryError as {
                data?: {
                    code?: string;
                };
            } | null)?.data?.code;
            if (errorCode === 'NOT_FOUND' || errorCode === 'UNAUTHORIZED') {
                return false;
            }
            return failureCount < 2;
        },
        retryDelay: (attempt) => Math.min(300 * 2 ** attempt, 2000),
    });
    const templateId = useMemo(() => {
        const metadata = workflowData?.trigger?.metadata as Record<string, unknown> | undefined;
        return metadata?.templateId as string | undefined;
    }, [workflowData]);
    const template = useMemo(() => {
        return templateId ? (getWorkflowTemplateById(templateId) ?? null) : null;
    }, [templateId]);
    const { data: credentials = [], isLoading: isCredentialsLoading } = trpc.credentials.getAll.useQuery(undefined, {
        staleTime: 60000,
        refetchOnWindowFocus: false,
        trpc: {
            context: {
                skipBatch: true,
            },
        },
        retry: 2,
    });
    const availableCredentials = useMemo(() => credentials.map((credential) => ({
        id: credential.id,
        platform: credential.platform.toLowerCase(),
    })), [credentials]);
    const allCredentialIds = useMemo(() => new Set(availableCredentials.map((credential) => credential.id)), [availableCredentials]);
    const credentialIdsByPlatform = useMemo(() => {
        const byPlatform = new Map<string, Set<string>>();
        for (const credential of availableCredentials) {
            const existing = byPlatform.get(credential.platform);
            if (existing) {
                existing.add(credential.id);
                continue;
            }
            byPlatform.set(credential.platform, new Set([credential.id]));
        }
        return byPlatform;
    }, [availableCredentials]);
    const singleCredentialByPlatform = useMemo(() => {
        const singleCredentialMap = new Map<string, string>();
        for (const [platform, credentialIds] of credentialIdsByPlatform.entries()) {
            if (credentialIds.size !== 1) {
                continue;
            }
            const [credentialId] = Array.from(credentialIds);
            if (credentialId) {
                singleCredentialMap.set(platform, credentialId);
            }
        }
        return singleCredentialMap;
    }, [credentialIdsByPlatform]);
    const templateBindingPlatformByNodeId = useMemo(() => {
        const byNodeId = new Map<string, string>();
        if (!template) {
            return byNodeId;
        }
        for (const binding of template.requiredBindings) {
            const platform = binding.platform.toLowerCase();
            for (const nodeId of binding.nodeIds) {
                if (!byNodeId.has(nodeId)) {
                    byNodeId.set(nodeId, platform);
                }
            }
        }
        return byNodeId;
    }, [template]);
    const isNodeCredentialValid = useCallback((nodeId: string, credentialId: string | undefined): boolean => {
        if (!credentialId) {
            return false;
        }
        const normalizedCredentialId = credentialId.trim();
        if (!normalizedCredentialId) {
            return false;
        }
        const requiredPlatform = templateBindingPlatformByNodeId.get(nodeId);
        if (requiredPlatform) {
            const platformCredentialIds = credentialIdsByPlatform.get(requiredPlatform);
            return Boolean(platformCredentialIds?.has(normalizedCredentialId));
        }
        return allCredentialIds.has(normalizedCredentialId);
    }, [templateBindingPlatformByNodeId, credentialIdsByPlatform, allCredentialIds]);
    const autoCredentialByProvider = useMemo(() => {
        const byProvider: {
            openai: string[];
            anthropic: string[];
            gemini: string[];
        } = {
            openai: [],
            anthropic: [],
            gemini: [],
        };
        for (const credential of credentials) {
            if (credential.platform === 'openai') {
                byProvider.openai.push(credential.id);
            }
            else if (credential.platform === 'anthropic') {
                byProvider.anthropic.push(credential.id);
            }
            else if (credential.platform === 'gemini') {
                byProvider.gemini.push(credential.id);
            }
        }
        return {
            openai: byProvider.openai.length === 1 ? byProvider.openai[0] : undefined,
            anthropic: byProvider.anthropic.length === 1 ? byProvider.anthropic[0] : undefined,
            gemini: byProvider.gemini.length === 1 ? byProvider.gemini[0] : undefined,
        };
    }, [credentials]);
    const utils = trpc.useUtils();
    const syncWorkflowCaches = useCallback((workflow: {
        id: string;
        title: string;
        createdAt: Date | string;
        updatedAt: Date | string;
        nodes: unknown;
        edges: unknown;
        trigger?: {
            metadata?: unknown;
        } | null;
    }) => {
        const createdAt = workflow.createdAt instanceof Date ? workflow.createdAt : new Date(workflow.createdAt);
        const updatedAt = workflow.updatedAt instanceof Date ? workflow.updatedAt : new Date(workflow.updatedAt);
        const nodeCount = Array.isArray(workflow.nodes) ? workflow.nodes.length : 0;
        const edgeCount = Array.isArray(workflow.edges) ? workflow.edges.length : 0;
        const metadata = workflow.trigger?.metadata;
        const templateId = metadata && typeof metadata === 'object' && !Array.isArray(metadata)
            ? (() => {
                const value = (metadata as Record<string, unknown>).templateId;
                return typeof value === 'string' && value.trim().length > 0 ? value : null;
            })()
            : null;
        utils.workflow.getById.setData({ id: workflow.id }, workflow as never);
        utils.workflow.getAll.setData(undefined, (old) => {
            if (!old)
                return old;
            const next = [...old];
            const index = next.findIndex((item) => item.id === workflow.id);
            if (index >= 0) {
                next[index] = workflow as never;
            }
            else {
                next.unshift(workflow as never);
            }
            return next;
        });
        utils.workflow.getAllSummaries.setData(undefined, (old) => {
            const nextSummary = {
                id: workflow.id,
                title: workflow.title,
                createdAt,
                updatedAt,
                nodeCount,
                edgeCount,
                templateId,
                triggerTypes: Array.isArray(workflow.nodes)
                    ? (workflow.nodes as Array<{ type?: string }>)
                        .filter((n) => n.type === 'cronTrigger' || n.type === 'webhookTrigger' || n.type === 'trigger')
                        .map((n) => n.type!)
                    : [],
                lastRunStatus: null as 'Pending' | 'Success' | 'Failure' | null,
                lastRunAt: null as Date | null,
            };
            if (!old) {
                return [nextSummary] as never;
            }
            const existingIndex = old.findIndex((item) => item.id === workflow.id);
            const next = existingIndex >= 0
                ? old.map((item) => item.id === workflow.id ? {
                    ...item,
                    ...nextSummary,
                } : item)
                : [nextSummary, ...old];
            next.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
            return next as never;
        });
    }, [utils.workflow.getAll, utils.workflow.getAllSummaries, utils.workflow.getById]);
    const createWorkflowMutation = trpc.workflow.create.useMutation({
        onSuccess: (workflow) => {
            syncWorkflowCaches(workflow);
        },
    });
    const updateWorkflowMutation = trpc.workflow.update.useMutation({
        onSuccess: (workflow) => {
            if ('title' in workflow) {
                syncWorkflowCaches(workflow);
            }
        },
    });
    const { saveStatus, lastSaveError, isCreateWorkflowPending, showTemplateSetup, setShowTemplateSetup, setTemplateSetupDismissed, graphRecoveryNotice, graphIntegrityError, markWorkflowChanged, handleImmediateSave, handleManualSave, } = useWorkflowPersistence({
        id,
        workflowData,
        template: template ?? null,
        currentWorkflowId,
        setCurrentWorkflowId,
        workflowTitle,
        setWorkflowTitle,
        setTempTitle,
        nodes,
        edges,
        setNodes,
        setEdges,
        onWorkflowCreated: (newWorkflow) => {
            router.replace(`/home/workflows/${newWorkflow.id}` as never);
        },
        createWorkflowMutation,
        updateWorkflowMutation,
        availableCredentials,
        credentialsReady: !isCredentialsLoading,
    });
    const handleTidyUp = useCallback((layoutedNodes: Node[]) => {
        if (!isApplyingHistoryRef.current) {
            undoStackRef.current.push({
                nodes: cloneGraphState(nodes),
                edges: cloneGraphState(edges),
            });
            if (undoStackRef.current.length > MAX_WORKFLOW_HISTORY) {
                undoStackRef.current.shift();
            }
            redoStackRef.current = [];
        }
        if (template) {
            const tidyBindings: CredentialBinding[] = [];
            for (const [index, binding] of template.requiredBindings.entries()) {
                const bindingKey = getTemplateBindingKey(binding, index);
                let resolvedCredentialId: string | undefined;
                const bindingPlatform = binding.platform.toLowerCase();
                const validCredentialIds = credentialIdsByPlatform.get(bindingPlatform);
                for (const nodeId of binding.nodeIds) {
                    const matchedNode = nodes.find((node) => node.id === nodeId);
                    const matchedData = matchedNode?.data && typeof matchedNode.data === 'object'
                        ? (matchedNode.data as Record<string, unknown>)
                        : null;
                    const credentialValue = extractCredentialId(matchedData);
                    if (credentialValue && validCredentialIds?.has(credentialValue)) {
                        resolvedCredentialId = credentialValue;
                        break;
                    }
                }
                if (!resolvedCredentialId) {
                    resolvedCredentialId = singleCredentialByPlatform.get(bindingPlatform);
                }
                if (!resolvedCredentialId) {
                    continue;
                }
                tidyBindings.push({
                    bindingKey,
                    platform: bindingPlatform,
                    credentialId: resolvedCredentialId,
                });
            }
            const resetGraph = instantiateTemplateGraphPreservingCredentials(template, nodes, tidyBindings.length > 0 ? tidyBindings : undefined);
            setNodes(resetGraph.nodes);
            setEdges(resetGraph.edges);
            markWorkflowChanged();
            if (currentWorkflowId !== 'new') {
                void handleImmediateSave({ nodes: resetGraph.nodes, edges: resetGraph.edges });
            }
            return;
        }
        setNodes(layoutedNodes);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            void handleImmediateSave({ nodes: layoutedNodes, edges });
        }
    }, [
        template,
        setNodes,
        setEdges,
        markWorkflowChanged,
        currentWorkflowId,
        handleImmediateSave,
        nodes,
        edges,
        credentialIdsByPlatform,
        singleCredentialByPlatform,
    ]);
    const captureGraphHistory = useCallback(() => {
        if (isApplyingHistoryRef.current)
            return;
        undoStackRef.current.push({
            nodes: cloneGraphState(nodesRef.current),
            edges: cloneGraphState(edgesRef.current),
        });
        if (undoStackRef.current.length > MAX_WORKFLOW_HISTORY) {
            undoStackRef.current.shift();
        }
        redoStackRef.current = [];
    }, []);
    const handleUndoGraphChange = useCallback(() => {
        if (isApplyingHistoryRef.current)
            return;
        const previousSnapshot = undoStackRef.current.pop();
        if (!previousSnapshot)
            return;
        redoStackRef.current.push({
            nodes: cloneGraphState(nodes),
            edges: cloneGraphState(edges),
        });
        if (redoStackRef.current.length > MAX_WORKFLOW_HISTORY) {
            redoStackRef.current.shift();
        }
        isApplyingHistoryRef.current = true;
        setNodes(cloneGraphState(previousSnapshot.nodes));
        setEdges(cloneGraphState(previousSnapshot.edges));
        markWorkflowChanged();
        isApplyingHistoryRef.current = false;
    }, [nodes, edges, setNodes, setEdges, markWorkflowChanged]);
    const handleRedoGraphChange = useCallback(() => {
        if (isApplyingHistoryRef.current)
            return;
        const nextSnapshot = redoStackRef.current.pop();
        if (!nextSnapshot)
            return;
        undoStackRef.current.push({
            nodes: cloneGraphState(nodes),
            edges: cloneGraphState(edges),
        });
        if (undoStackRef.current.length > MAX_WORKFLOW_HISTORY) {
            undoStackRef.current.shift();
        }
        isApplyingHistoryRef.current = true;
        setNodes(cloneGraphState(nextSnapshot.nodes));
        setEdges(cloneGraphState(nextSnapshot.edges));
        markWorkflowChanged();
        isApplyingHistoryRef.current = false;
    }, [nodes, edges, setNodes, setEdges, markWorkflowChanged]);
    const { onConnect, addNode, updateNodeData, deleteNode, addNodeAtPosition, duplicateNode, getNodeData, } = useWorkflowCanvasActions({
        nodes,
        edges,
        setNodes,
        setEdges,
        markWorkflowChanged,
        currentWorkflowId,
        isTemplateWorkflow: Boolean(template),
        handleImmediateSave,
        onBeforeGraphMutation: captureGraphHistory,
        autoCredentialByProvider,
    });
    const handleNodesChange = useCallback((changes: NodeChange<Node>[]) => {
        const hasPersistedChange = changes.some(isPersistedNodeChange);
        const shouldCaptureHistory = hasPersistedChange;
        if (hasPersistedChange && shouldCaptureHistory) {
            captureGraphHistory();
        }
        let nextNodesSnapshot: Node[] = nodesRef.current;
        let blockedTemplateCollapse = false;
        setNodes((prevNodes) => {
            const updatedNodes = applyNodeChanges(changes, prevNodes);
            const hasExplicitRemove = changes.some((change) => change.type === 'remove');
            const wouldCollapseToEmpty = prevNodes.length > 0 && updatedNodes.length === 0;
            if (wouldCollapseToEmpty &&
                (Boolean(template) || !hasExplicitRemove)) {
                blockedTemplateCollapse = true;
                nextNodesSnapshot = prevNodes;
                nodesRef.current = prevNodes;
                return prevNodes;
            }
            nextNodesSnapshot = updatedNodes;
            nodesRef.current = updatedNodes;
            return updatedNodes;
        });
        if (blockedTemplateCollapse) {
            return;
        }
        if (!hasPersistedChange)
            return;
        markWorkflowChanged();
        const removedNodeIds = new Set(changes
            .filter((change) => change.type === 'remove')
            .map((change) => change.id));
        if (removedNodeIds.size > 0) {
            let nextEdgesSnapshot: Edge[] = edgesRef.current;
            setEdges((prevEdges) => {
                const filteredEdges = prevEdges.filter((edge) => !removedNodeIds.has(edge.source) && !removedNodeIds.has(edge.target));
                nextEdgesSnapshot = filteredEdges;
                edgesRef.current = filteredEdges;
                return filteredEdges;
            });
            if (currentWorkflowId !== 'new') {
                void handleImmediateSave({ nodes: nextNodesSnapshot, edges: nextEdgesSnapshot });
            }
        }
    }, [
        setNodes,
        setEdges,
        markWorkflowChanged,
        currentWorkflowId,
        handleImmediateSave,
        captureGraphHistory,
        template,
    ]);
    const handleEdgesChange = useCallback((changes: EdgeChange<Edge>[]) => {
        const hasPersistedChange = changes.some((change) => change.type === 'add' || change.type === 'remove');
        if (hasPersistedChange) {
            captureGraphHistory();
        }
        setEdges((prevEdges) => {
            const updatedEdges = applyEdgeChanges(changes, prevEdges);
            edgesRef.current = updatedEdges;
            return updatedEdges;
        });
        if (!hasPersistedChange)
            return;
        markWorkflowChanged();
    }, [setEdges, markWorkflowChanged, captureGraphHistory]);
    const { usage, runs, runsLoading, hasMoreRuns, loadMoreRuns, isLoadingMoreRuns, runDetail, runDetailLoading, canvasNodes, nodeStatuses, selectedStatusNodeId, setSelectedStatusNodeId, isRunPanelOpen, selectedPanelRunId, setSelectedPanelRunId, panelLiveStatuses, panelWorkflowStatus, panelWorkflowFinishedAt, isPanelNodeFallbackPolling, isCronTriggerRunning, closeRunPanel, toggleRunPanel, isExecutingWorkflow, handleExecuteWorkflow, handleExecuteNode, handleExecuteTriggerNow, } = useWorkflowExecution({
        currentWorkflowId,
        nodes,
        edges,
        handleImmediateSave: () => handleImmediateSave(),
    });
    const isExecutionBlockedInProduction = isExecutionBlockedInClientRuntime();
    const handleExecuteWorkflowWithEnvironmentGate = useCallback(async () => {
        if (isExecutionBlockedInProduction) {
            setShowExecutionBlockedDialog(true);
            return;
        }
        await handleExecuteWorkflow();
    }, [isExecutionBlockedInProduction, handleExecuteWorkflow]);
    const handleExecuteNodeWithEnvironmentGate = useCallback(async (nodeId: string) => {
        if (isExecutionBlockedInProduction) {
            setShowExecutionBlockedDialog(true);
            return;
        }
        await handleExecuteNode(nodeId);
    }, [isExecutionBlockedInProduction, handleExecuteNode]);
    const handleExecuteTriggerNowWithEnvironmentGate = useCallback(async (source: 'cron' | 'webhook', triggerNodeId: string) => {
        if (isExecutionBlockedInProduction) {
            setShowExecutionBlockedDialog(true);
            return;
        }
        await handleExecuteTriggerNow(source, triggerNodeId);
    }, [isExecutionBlockedInProduction, handleExecuteTriggerNow]);
    const runPanelExecutionsHref = useMemo(() => {
        if (!currentWorkflowId || currentWorkflowId === 'new') {
            return { pathname: '/home/executions' } as const;
        }
        return {
            pathname: '/home/executions',
            query: {
                workflowId: currentWorkflowId,
                ...(selectedPanelRunId ? { runId: selectedPanelRunId } : {}),
            },
        } as const;
    }, [currentWorkflowId, selectedPanelRunId]);
    const handleAddNodeFromDrawer = useCallback((nodeType: string, label: string) => {
        const wasAdded = addNode(nodeType, label);
        if (wasAdded) {
            setIsDrawerOpen(false);
        }
    }, [addNode]);
    const handleTemplateCredentialSetup = useCallback(async (bindings: CredentialBinding[], additionalFields?: Record<string, Record<string, string>>, options?: {
        fillMissingOnly?: boolean;
    }) => {
        if (!template)
            return;
        const boundTemplate = bindCredentialsToTemplate(template, bindings, additionalFields, options);
        const persistedNodes = parseGraphArray<Node>(workflowData?.nodes);
        const persistedEdges = parseGraphArray<Edge>(workflowData?.edges);
        const runtimeGraphValidation = validateGraphShape(nodes as Array<{
            id?: unknown;
        }>, edges as Array<{
            source?: unknown;
            target?: unknown;
        }>);
        const persistedGraphValidation = validateGraphShape(persistedNodes as Array<{
            id?: unknown;
        }>, persistedEdges as Array<{
            source?: unknown;
            target?: unknown;
        }>);
        const runtimeGraphReady = runtimeGraphValidation.isValid && nodes.length > 0;
        const persistedGraphReady = persistedGraphValidation.isValid && persistedNodes.length > 0;
        const templateGraph = instantiateTemplateGraph(template, bindings, additionalFields, options);
        const baseNodes = runtimeGraphReady
            ? nodes
            : persistedGraphReady
                ? persistedNodes
                : templateGraph.nodes;
        const baseEdges = runtimeGraphReady
            ? edges
            : persistedGraphReady
                ? persistedEdges
                : templateGraph.edges;
        const boundNodeById = new Map(boundTemplate.nodes.map((node) => [node.id, node]));
        const nextNodes = baseNodes.map((node) => {
            const boundNode = boundNodeById.get(node.id);
            if (!boundNode)
                return node;
            const currentNodeData = node.data && typeof node.data === 'object'
                ? (node.data as Record<string, unknown>)
                : {};
            const boundNodeData = boundNode.data && typeof boundNode.data === 'object'
                ? (boundNode.data as Record<string, unknown>)
                : {};
            const mergedNodeData: Record<string, unknown> = {
                ...currentNodeData,
                ...boundNodeData,
            };
            if (options?.fillMissingOnly) {
                const currentCredentialId = extractCredentialId(currentNodeData);
                if (currentCredentialId && isNodeCredentialValid(node.id, currentCredentialId)) {
                    mergedNodeData.credentialId = currentCredentialId;
                }
                for (const [field, value] of Object.entries(boundNodeData)) {
                    if (field === 'credentialId' || field === 'isConfigured') {
                        continue;
                    }
                    const existingValue = currentNodeData[field];
                    const hasExistingValue = typeof existingValue === 'string'
                        ? existingValue.trim().length > 0
                        : existingValue !== undefined && existingValue !== null;
                    if (hasExistingValue) {
                        mergedNodeData[field] = existingValue;
                    }
                    else {
                        mergedNodeData[field] = value;
                    }
                }
            }
            return {
                ...node,
                data: mergedNodeData,
            };
        });
        const nextEdges = baseEdges;
        const nextGraphValidation = validateGraphShape(nextNodes as Array<{
            id?: unknown;
        }>, nextEdges as Array<{
            source?: unknown;
            target?: unknown;
        }>);
        if (!nextGraphValidation.isValid) {
            throw new Error(`Template setup produced an invalid graph: ${nextGraphValidation.errors.join(' ')}`);
        }
        setNodes(nextNodes);
        setEdges(nextEdges);
        setShowTemplateSetup(false);
        markWorkflowChanged();
        if (currentWorkflowId !== 'new') {
            await handleImmediateSave({
                nodes: nextNodes,
                edges: nextEdges,
            });
            utils.workflow.getById.setData({ id: currentWorkflowId }, (old) => {
                if (!old)
                    return old;
                return {
                    ...old,
                    nodes: nextNodes as unknown as typeof old.nodes,
                    edges: nextEdges as unknown as typeof old.edges,
                };
            });
        }
    }, [
        template,
        nodes,
        edges,
        workflowData?.nodes,
        workflowData?.edges,
        setNodes,
        setEdges,
        setShowTemplateSetup,
        markWorkflowChanged,
        currentWorkflowId,
        handleImmediateSave,
        utils,
        isNodeCredentialValid,
    ]);
    const defaultTemplateFields = useMemo<Record<string, Record<string, string>>>(() => {
        if (!template?.fieldRequirements)
            return {};
        const defaults: Record<string, Record<string, string>> = {};
        for (const fieldReq of template.fieldRequirements) {
            if (!fieldReq.defaultValue)
                continue;
            const nodeDefaults = defaults[fieldReq.nodeId] ?? {};
            nodeDefaults[fieldReq.field] = fieldReq.defaultValue;
            defaults[fieldReq.nodeId] = nodeDefaults;
        }
        return defaults;
    }, [template]);
    const autoTemplateBindings = useMemo<CredentialBinding[] | null>(() => {
        if (!template || template.requiredBindings.length === 0) {
            return null;
        }
        const bindings: CredentialBinding[] = [];
        for (const [index, binding] of template.requiredBindings.entries()) {
            const platform = binding.platform.toLowerCase();
            const credentialId = singleCredentialByPlatform.get(platform);
            if (!credentialId) {
                return null;
            }
            bindings.push({
                bindingKey: getTemplateBindingKey(binding, index),
                platform,
                credentialId,
            });
        }
        return bindings;
    }, [template, singleCredentialByPlatform]);
    useEffect(() => {
        if (!workflowData || !template || !currentWorkflowId || currentWorkflowId === 'new')
            return;
        if (!autoTemplateBindings || autoTemplateBindings.length === 0)
            return;
        if (isCredentialsLoading)
            return;
        if (autoTemplateSetupAppliedRef.current.has(currentWorkflowId))
            return;
        const nodeById = new Map(nodes.map((node) => [node.id, node]));
        const hasMissingCredentialBinding = template.requiredBindings.some((binding) => binding.nodeIds.some((nodeId) => {
            const node = nodeById.get(nodeId);
            if (!node)
                return false;
            const credentialId = extractCredentialId(node.data);
            return !isNodeCredentialValid(nodeId, credentialId);
        }));
        if (!hasMissingCredentialBinding)
            return;
        autoTemplateSetupAppliedRef.current.add(currentWorkflowId);
        setShowTemplateSetup(false);
        void handleTemplateCredentialSetup(autoTemplateBindings, defaultTemplateFields, {
            fillMissingOnly: true,
        });
    }, [
        workflowData,
        template,
        currentWorkflowId,
        nodes,
        autoTemplateBindings,
        defaultTemplateFields,
        handleTemplateCredentialSetup,
        setShowTemplateSetup,
        isCredentialsLoading,
        isNodeCredentialValid,
    ]);
    useEffect(() => {
        nodesRef.current = nodes;
    }, [nodes]);
    useEffect(() => {
        edgesRef.current = edges;
    }, [edges]);
    useEffect(() => {
        undoStackRef.current = [];
        redoStackRef.current = [];
    }, [id]);
    useEffect(() => {
        const handler = (event: KeyboardEvent) => {
            if (event.defaultPrevented)
                return;
            if (!(event.metaKey || event.ctrlKey))
                return;
            if (isEditableKeyboardTarget(event.target))
                return;
            const key = event.key.toLowerCase();
            const isUndo = key === 'z' && !event.shiftKey && !event.altKey;
            const isRedo = (key === 'z' && event.shiftKey && !event.altKey) ||
                (key === 'y' && event.ctrlKey && !event.metaKey && !event.shiftKey && !event.altKey);
            if (isUndo) {
                event.preventDefault();
                handleUndoGraphChange();
                return;
            }
            if (isRedo) {
                event.preventDefault();
                handleRedoGraphChange();
            }
        };
        window.addEventListener('keydown', handler);
        return () => window.removeEventListener('keydown', handler);
    }, [handleUndoGraphChange, handleRedoGraphChange]);
    useEffect(() => {
        if (isEditingTitle && titleInputRef.current) {
            titleInputRef.current.focus();
            titleInputRef.current.select();
        }
    }, [isEditingTitle]);
    const handleTitleSave = useCallback(() => {
        if (tempTitle.trim() && tempTitle !== workflowTitle) {
            setWorkflowTitle(tempTitle.trim());
            markWorkflowChanged();
        }
        else {
            setTempTitle(workflowTitle);
        }
        setIsEditingTitle(false);
    }, [tempTitle, workflowTitle, setWorkflowTitle, markWorkflowChanged]);
    const handleTitleKeyDown = useCallback((event: React.KeyboardEvent<HTMLInputElement>) => {
        if (event.key === 'Enter') {
            handleTitleSave();
            return;
        }
        if (event.key === 'Escape') {
            setTempTitle(workflowTitle);
            setIsEditingTitle(false);
        }
    }, [handleTitleSave, workflowTitle]);
    const handleBackNavigation = useCallback(() => {
        if (typeof window !== 'undefined' && window.history.length > 1) {
            router.back();
            return;
        }
        router.push('/home/workflows');
    }, [router]);
    const errorCode = (error as {
        data?: {
            code?: string;
        };
    } | null)?.data?.code;
    const errorMessage = error?.message.toLowerCase() ?? '';
    const isNotFoundError = errorCode === 'NOT_FOUND' || errorMessage.includes('workflow not found');
    const isUnauthorizedError = errorCode === 'UNAUTHORIZED';
    const showInlineLoadWarning = Boolean(error && workflowData);
    if (!hasValidWorkflowId) {
        return (<WorkflowRouteIssueState code="Invalid Workflow Link" title="This workflow URL is not valid" description="The link appears malformed. Open the workflow from your dashboard to continue."/>);
    }
    if (isLoading) {
        return <WorkflowLoadingState />;
    }
    if (error && !workflowData) {
        if (isNotFoundError) {
            return (<WorkflowRouteIssueState code="Workflow Not Found" title="This workflow no longer exists" description="The workflow may have been deleted, moved, or you may not have access to it."/>);
        }
        if (isUnauthorizedError) {
            return (<WorkflowRouteIssueState code="Authorization Required" title="Your session may have expired" description="Please sign in again from the Workflows page and reopen this workflow."/>);
        }
        return (<WorkflowRouteIssueState code="Unable To Load" title="We could not load this workflow" description="Please try again from the Workflows page." onRetry={() => {
                void refetch();
            }}/>);
    }
    const usageCounterNode = usage ? (<UsageCounter runCount={usage.runCount} monthlyRunLimit={usage.monthlyRunLimit}/>) : null;
    const saveStatusNode = (<SaveStatusIndicator saveStatus={saveStatus} lastSaveError={lastSaveError}/>);
    return (<>
      <div className="flex h-full min-h-0 items-center justify-center bg-[#151515] px-6 py-10 md:hidden">
        <div className="w-full max-w-md rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] p-8 text-center shadow-[0_20px_40px_-12px_rgba(0,0,0,0.45)]">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5 text-white/85">
            <svg aria-hidden="true" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <g>
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2"></circle>
                <path d="M10.75 9.77333C10.75 10.8043 10.0784 11.5 9.25 11.5C8.42157 11.5 7.75 10.8043 7.75 9.77333C7.75 8.7424 8.42157 8 9.25 8C10.0784 8 10.75 8.7424 10.75 9.77333Z" fill="currentColor"></path>
                <path d="M16.25 9.77333C16.25 10.8043 15.5784 11.5 14.75 11.5C13.9216 11.5 13.25 10.8043 13.25 9.77333C13.25 8.7424 13.9216 8 14.75 8C15.5784 8 16.25 8.7424 16.25 9.77333Z" fill="currentColor"></path>
                <path d="M16.3179 11.8088C16.1444 11.6247 15.8555 11.6247 15.682 11.8088C13.8859 13.7148 13.5535 17 16.0001 17C18.4467 17 18.114 13.7148 16.3179 11.8088Z" fill="currentColor"></path>
                <path d="M12 14.2295C12.5778 14.2295 13.1089 14.3862 13.5322 14.6113C13.5206 14.7069 13.5121 14.8017 13.5068 14.8955C13.4876 15.2364 13.5096 15.5853 13.5898 15.9189C13.1578 15.8344 12.6038 15.7139 12 15.7139C10.6193 15.7139 9.5 16.3463 9.5 15.7295C9.50041 15.1127 10.6195 14.2295 12 14.2295Z" fill="currentColor"></path>
              </g>
            </svg>
          </div>
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-white/50">Mobile Unsupported</p>
          <h1 className="mt-2 text-2xl font-bold text-white">Sorry, this page is not available on mobile</h1>
          <p className="mt-3 text-sm text-white/60">Please open this workflow on a tablet or desktop to continue editing and running it.</p>
          <div className="mt-8 flex items-center justify-center">
            <button type="button" onClick={handleBackNavigation} className="inline-flex h-10 items-center justify-center rounded-xl border border-white/15 bg-white/5 px-4 text-sm font-medium text-white transition-colors hover:bg-white/10">
              Back
            </button>
          </div>
        </div>
      </div>

      <div className="hidden h-full flex-col overflow-hidden md:flex">
        {graphRecoveryNotice && (<div className="mx-4 mt-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-xs text-emerald-100">
            {graphRecoveryNotice}
          </div>)}
        {graphIntegrityError && (<div className="mx-4 mt-3 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-100">
            {graphIntegrityError}
          </div>)}
        {showInlineLoadWarning && (<div className="mx-4 mt-3 flex items-center justify-between gap-3 rounded-lg border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-100">
            <span>
              Live refresh failed. You are viewing cached workflow data.
            </span>
            <button type="button" onClick={() => {
                void refetch();
            }} className="inline-flex shrink-0 items-center rounded-md border border-amber-400/40 px-2.5 py-1 text-[11px] font-medium text-amber-100 transition-colors hover:bg-amber-400/10">
              Retry
            </button>
          </div>)}
        <TooltipProvider>
          <ReactFlowProvider>
            <EditorProvider onUpdateNodeData={updateNodeData} onDeleteNode={deleteNode} onAddNode={addNodeAtPosition} onDuplicateNode={duplicateNode} getNodeData={getNodeData} nodeStatuses={nodeStatuses} onExecuteNode={handleExecuteNodeWithEnvironmentGate} onExecuteWorkflow={handleExecuteWorkflowWithEnvironmentGate} canEditNodes={true}>
              <WorkflowHeader isEditingTitle={isEditingTitle} titleInputRef={titleInputRef} tempTitle={tempTitle} workflowTitle={workflowTitle} currentWorkflowId={currentWorkflowId} isRunPanelOpen={isRunPanelOpen} isCreateWorkflowPending={isCreateWorkflowPending} usageCounter={usageCounterNode} saveStatusIndicator={saveStatusNode} onTempTitleChange={setTempTitle} onTitleSave={handleTitleSave} onTitleKeyDown={handleTitleKeyDown} onStartTitleEdit={() => setIsEditingTitle(true)} onToggleRunPanel={toggleRunPanel} onManualSave={handleManualSave}/>

              <div className="flex flex-1 min-h-0">
                <div className="flex-1 relative">
                  <Drawer direction="right" open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
                    <div className="relative w-full h-full">
                      <WorkflowCanvas nodes={canvasNodes} edges={edges} onNodesChange={handleNodesChange} onEdgesChange={handleEdgesChange} onConnect={onConnect} onExecute={handleExecuteWorkflowWithEnvironmentGate} onExecuteTriggerNow={handleExecuteTriggerNowWithEnvironmentGate} isExecuting={isExecutingWorkflow} isCronTriggerRunning={isCronTriggerRunning} onOpenDrawer={() => setIsDrawerOpen(prev => !prev)} onTidyUp={handleTidyUp}/>

                      {nodes.length === 0 && <EmptyCanvasPrompt />}
                      {nodes.length > 0 && <AddNodeButton showPulse={nodes.length === 1}/>}
                    </div>

                    <NodeDrawer onAddNode={handleAddNodeFromDrawer} nodes={nodes}/>
                  </Drawer>
                </div>

                <AnimatePresence mode="wait">
                  {isRunPanelOpen && (<motion.div key="run-panel" initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }} exit={{ width: 0, opacity: 0 }} transition={{ type: 'spring', stiffness: 300, damping: 28 }} className="overflow-hidden shrink-0 h-full min-h-0 bg-[#101010]">
                      <RunPanel runs={runs} isLoading={runsLoading} selectedRunId={selectedPanelRunId} onSelectRun={setSelectedPanelRunId} runDetail={runDetail} runDetailLoading={runDetailLoading} liveStatuses={panelLiveStatuses} workflowStatus={panelWorkflowStatus} workflowFinishedAt={panelWorkflowFinishedAt} selectedNodeId={selectedStatusNodeId} onSelectNode={setSelectedStatusNodeId} onClose={closeRunPanel} hasNextPage={hasMoreRuns} fetchNextPage={loadMoreRuns} isFetchingNextPage={isLoadingMoreRuns} isNodeFallbackPolling={isPanelNodeFallbackPolling} executionsHref={runPanelExecutionsHref}/>
                    </motion.div>)}
                </AnimatePresence>
              </div>
            </EditorProvider>
          </ReactFlowProvider>

          <TemplatePreflightModal template={template ?? null} open={showTemplateSetup} onClose={() => {
            setShowTemplateSetup(false);
            setTemplateSetupDismissed(true);
        }} onConfirm={handleTemplateCredentialSetup}/>

          {isExecutionBlockedInProduction && (<Dialog open={showExecutionBlockedDialog} onOpenChange={setShowExecutionBlockedDialog}>
            <DialogContent className="max-w-md">
              <DialogHeader className="sr-only">
                <DialogTitle>Workflow Execution Is Disabled</DialogTitle>
                <DialogDescription>
                  The dev doesn&apos;t have money to host backend server.
                </DialogDescription>
              </DialogHeader>

              <div className="p-0">
                <Image src="/images/sad-cat-bubble.jpg" alt="Sad cat" width={640} height={640} className="mx-auto h-80 w-auto max-w-full object-contain"/>
              </div>

              <div className="flex items-center justify-center gap-2 pt-1">
                <button type="button" onClick={() => setShowExecutionBlockedDialog(false)} className="inline-flex h-10 items-center justify-center rounded-md border border-white/20 px-4 text-sm font-medium text-white/80 transition-colors hover:bg-white/10 hover:text-white">
                  Stay Here
                </button>
                <a href="https://github.com/abhinavkale-dev/fynt" target="_blank" rel="noopener noreferrer" className="inline-flex h-10 items-center justify-center rounded-md bg-[#F04D26] px-4 text-sm font-medium text-white transition-colors hover:bg-[#F04D26]/90">
                  Self Host
                </a>
              </div>
            </DialogContent>
          </Dialog>)}
        </TooltipProvider>
      </div>
    </>);
};
export default WorkflowId;
