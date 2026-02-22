'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction, } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { trpc } from '@/lib/trpc/client';
import { primeExecutionSocketAuth, subscribeToExecutionRun } from '@/lib/executions/executionSocketClient';
import type { RunPanelDetail, RunPanelListItem } from '../components/RunPanel';
interface UseWorkflowExecutionParams {
    currentWorkflowId: string;
    nodes: Node[];
    edges: Edge[];
    handleImmediateSave: () => Promise<void>;
}
interface UsageSnapshot {
    runCount: number;
    monthlyRunLimit: number;
}
interface UseWorkflowExecutionResult {
    usage: UsageSnapshot | null;
    runs: RunPanelListItem[];
    runsLoading: boolean;
    hasMoreRuns: boolean | undefined;
    loadMoreRuns: () => void;
    isLoadingMoreRuns: boolean;
    runDetail: RunPanelDetail | null;
    runDetailLoading: boolean;
    canvasNodes: Node[];
    nodeStatuses: Record<string, string>;
    selectedStatusNodeId: string | null;
    setSelectedStatusNodeId: Dispatch<SetStateAction<string | null>>;
    isRunPanelOpen: boolean;
    selectedPanelRunId: string | null;
    setSelectedPanelRunId: Dispatch<SetStateAction<string | null>>;
    panelLiveStatuses: Record<string, string>;
    panelWorkflowStatus: string | null;
    panelWorkflowFinishedAt: Date | null;
    activeNodeStatusSource: 'socket' | 'polling' | 'idle';
    isActiveNodeFallbackPolling: boolean;
    isPanelNodeFallbackPolling: boolean;
    isCronTriggerRunning: boolean;
    closeRunPanel: () => void;
    toggleRunPanel: () => void;
    isExecutingWorkflow: boolean;
    handleExecuteWorkflow: () => Promise<void>;
    handleExecuteNode: (nodeId: string) => Promise<void>;
    handleExecuteTriggerNow: (source: 'cron' | 'webhook', triggerNodeId: string) => Promise<void>;
}
const RUN_PANEL_FALLBACK_POLL_MS = 2000;
const WORKFLOW_TERMINAL_STATUSES = new Set(['Success', 'Failure']);
interface NodeRunStatusLike {
    nodeId?: unknown;
    status?: unknown;
}
function isWorkflowTerminalStatus(status: string | null | undefined): boolean {
    return typeof status === 'string' && WORKFLOW_TERMINAL_STATUSES.has(status);
}
function mapNodeStatusesFromNodeRuns(nodeRuns: NodeRunStatusLike[] | null | undefined): Record<string, string> {
    if (!Array.isArray(nodeRuns) || nodeRuns.length === 0) {
        return {};
    }
    const statuses: Record<string, string> = {};
    for (const nodeRun of nodeRuns) {
        if (typeof nodeRun.nodeId !== 'string' || typeof nodeRun.status !== 'string') {
            continue;
        }
        statuses[nodeRun.nodeId] = nodeRun.status;
    }
    return statuses;
}
interface ExecutionStreamOptions {
    onWorkflowTerminal?: (status: 'Success' | 'Failure') => void;
    onSocketStatus?: (status: 'connected' | 'disconnected' | 'reconnecting') => void;
}
interface ExecutionStreamBootstrapLike {
    token?: unknown;
    wsUrl?: unknown;
    expiresInSeconds?: unknown;
}
interface ExecuteMutationResultLike {
    runId: string;
    stream?: ExecutionStreamBootstrapLike | null;
}
function primeSocketAuthFromExecuteResult(result: ExecuteMutationResultLike): void {
    const bootstrap = result.stream;
    if (!bootstrap || typeof bootstrap !== 'object') {
        return;
    }
    if (typeof bootstrap.token !== 'string' || bootstrap.token.trim().length === 0) {
        return;
    }
    primeExecutionSocketAuth(result.runId, {
        token: bootstrap.token,
        wsUrl: typeof bootstrap.wsUrl === 'string' ? bootstrap.wsUrl : undefined,
        expiresInSeconds: typeof bootstrap.expiresInSeconds === 'number' ? bootstrap.expiresInSeconds : undefined,
    });
}
export function useWorkflowExecution({ currentWorkflowId, nodes, edges, handleImmediateSave, }: UseWorkflowExecutionParams): UseWorkflowExecutionResult {
    const utils = trpc.useUtils();
    const executeWorkflowMutation = trpc.workflow.execute.useMutation();
    const [nodeStatuses, setNodeStatuses] = useState<Record<string, string>>({});
    const [selectedStatusNodeId, setSelectedStatusNodeId] = useState<string | null>(null);
    const [isRunPanelOpen, setIsRunPanelOpen] = useState(false);
    const [selectedPanelRunId, setSelectedPanelRunId] = useState<string | null>(null);
    const [panelLiveStatuses, setPanelLiveStatuses] = useState<Record<string, string>>({});
    const [panelWorkflowStatus, setPanelWorkflowStatus] = useState<string | null>(null);
    const [panelWorkflowFinishedAt, setPanelWorkflowFinishedAt] = useState<Date | null>(null);
    const [isPanelStreamConnected, setIsPanelStreamConnected] = useState(false);
    const [isActiveRunStreamConnected, setIsActiveRunStreamConnected] = useState(false);
    const [activeWorkflowRunId, setActiveWorkflowRunId] = useState<string | null>(null);
    const [isWorkflowRunActive, setIsWorkflowRunActive] = useState(false);
    const [activeTriggerSource, setActiveTriggerSource] = useState<'cron' | 'webhook' | null>(null);
    const activeExecutionSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
    const disposeRunSubscription = useCallback((runId: string) => {
        const key = `run:${runId}`;
        const dispose = activeExecutionSubscriptionsRef.current.get(key);
        if (!dispose) {
            return;
        }
        dispose();
        activeExecutionSubscriptionsRef.current.delete(key);
    }, []);
    const disposeAllRunSubscriptions = useCallback(() => {
        const subscriptions = activeExecutionSubscriptionsRef.current;
        for (const [key, dispose] of subscriptions.entries()) {
            if (!key.startsWith("run:")) {
                continue;
            }
            dispose();
            subscriptions.delete(key);
        }
    }, []);
    const usageQuery = trpc.execution.getUsage.useQuery(undefined, {
        refetchOnWindowFocus: false,
        trpc: {
            context: {
                skipBatch: true,
            },
        },
        retry: 2,
    });
    const runsQuery = trpc.execution.getAll.useInfiniteQuery({ workflowId: currentWorkflowId, limit: 10 }, {
        enabled: currentWorkflowId !== 'new' && isRunPanelOpen,
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        refetchOnWindowFocus: false,
    });
    const refetchRuns = runsQuery.refetch;
    const recentRuns = useMemo<RunPanelListItem[]>(() => (runsQuery.data?.pages.flatMap((page) => page.runs) ?? []) as RunPanelListItem[], [runsQuery.data]);
    const shouldPollActiveWorkflowRun = Boolean(activeWorkflowRunId && isWorkflowRunActive && !isActiveRunStreamConnected);
    const runDetailQuery = trpc.execution.getById.useQuery({ runId: selectedPanelRunId ?? '' }, { enabled: Boolean(selectedPanelRunId), refetchOnWindowFocus: false });
    const refetchRunDetail = runDetailQuery.refetch;
    const activeWorkflowRunQuery = trpc.execution.getById.useQuery({ runId: activeWorkflowRunId ?? '' }, {
        enabled: Boolean(activeWorkflowRunId),
        refetchOnWindowFocus: false,
        refetchInterval: shouldPollActiveWorkflowRun ? RUN_PANEL_FALLBACK_POLL_MS : false,
    });
    const refetchActiveWorkflowRun = activeWorkflowRunQuery.refetch;
    const runDetail = useMemo<RunPanelDetail | null>(() => (runDetailQuery.data ? (runDetailQuery.data as RunPanelDetail) : null), [runDetailQuery.data]);
    const panelEffectiveWorkflowStatus = panelWorkflowStatus || runDetail?.status || null;
    const isPanelNodeFallbackPolling = Boolean(selectedPanelRunId && !isWorkflowTerminalStatus(panelEffectiveWorkflowStatus) && !isPanelStreamConnected);
    const panelPolledStatuses = useMemo(() => mapNodeStatusesFromNodeRuns(runDetail?.nodeRuns as NodeRunStatusLike[] | undefined), [runDetail?.nodeRuns]);
    const activeWorkflowStatus = activeWorkflowRunQuery.data?.status ?? null;
    const isActiveWorkflowTerminal = isWorkflowTerminalStatus(activeWorkflowStatus);
    const activePolledStatuses = useMemo(() => mapNodeStatusesFromNodeRuns(activeWorkflowRunQuery.data?.nodeRuns as NodeRunStatusLike[] | undefined), [activeWorkflowRunQuery.data?.nodeRuns]);
    const isActiveNodeFallbackPolling = Boolean(activeWorkflowRunId && isWorkflowRunActive && !isActiveWorkflowTerminal && !isActiveRunStreamConnected);
    const isCronTriggerRunning = activeTriggerSource === 'cron' && isWorkflowRunActive;
    const activeNodeStatusSource: 'socket' | 'polling' | 'idle' = !activeWorkflowRunId || !isWorkflowRunActive || isActiveWorkflowTerminal
        ? 'idle'
        : isActiveRunStreamConnected
            ? 'socket'
            : 'polling';
    const usage = useMemo<UsageSnapshot | null>(() => usageQuery.data
        ? {
            runCount: usageQuery.data.runCount,
            monthlyRunLimit: usageQuery.data.monthlyRunLimit,
        }
        : null, [usageQuery.data]);
    const canvasNodes = useMemo(() => nodes.map((node: Node) => ({
        ...node,
        selected: selectedStatusNodeId ? node.id === selectedStatusNodeId : Boolean(node.selected),
    })), [nodes, selectedStatusNodeId]);
    const closeRunPanel = useCallback(() => {
        setIsRunPanelOpen(false);
        setSelectedStatusNodeId(null);
        setNodeStatuses({});
    }, []);
    const toggleRunPanel = useCallback(() => {
        if (isRunPanelOpen) {
            closeRunPanel();
            return;
        }
        setIsRunPanelOpen(true);
    }, [isRunPanelOpen, closeRunPanel]);
    useEffect(() => {
        if (!selectedPanelRunId) {
            return;
        }
        const subscriptions = activeExecutionSubscriptionsRef.current;
        if (isWorkflowTerminalStatus(panelEffectiveWorkflowStatus)) {
            return;
        }
        setIsPanelStreamConnected(false);
        const unsubscribe = subscribeToExecutionRun(selectedPanelRunId, (data) => {
            if (data.type === 'socket') {
                if (data.status === 'connected')
                    setIsPanelStreamConnected(true);
                if (data.status === 'disconnected')
                    setIsPanelStreamConnected(false);
                return;
            }
            if (data.type === 'node' &&
                typeof data.nodeId === 'string' &&
                typeof data.status === 'string') {
                const nodeId = data.nodeId;
                const status = data.status;
                setPanelLiveStatuses((prev) => ({ ...prev, [nodeId]: status }));
            }
            if (data.type === 'workflow' && data.status) {
                setPanelWorkflowStatus(data.status);
                if (data.status === 'Success' || data.status === 'Failure') {
                    setPanelWorkflowFinishedAt(new Date(data.timestamp ?? Date.now()));
                    setIsPanelStreamConnected(false);
                    void refetchRunDetail();
                    void refetchRuns();
                }
            }
        });
        subscriptions.set(`panel:${selectedPanelRunId}`, unsubscribe);
        return () => {
            const key = `panel:${selectedPanelRunId}`;
            const dispose = subscriptions.get(key);
            if (dispose) {
                dispose();
                subscriptions.delete(key);
            }
            setIsPanelStreamConnected(false);
        };
    }, [selectedPanelRunId, refetchRunDetail, refetchRuns]);
    useEffect(() => {
        setPanelLiveStatuses({});
        setPanelWorkflowStatus(null);
        setPanelWorkflowFinishedAt(null);
        setIsPanelStreamConnected(false);
    }, [selectedPanelRunId]);
    useEffect(() => {
        if (!selectedPanelRunId || !isPanelNodeFallbackPolling) {
            return;
        }
        if (Object.keys(panelPolledStatuses).length === 0) {
            return;
        }
        setPanelLiveStatuses(panelPolledStatuses);
    }, [selectedPanelRunId, isPanelNodeFallbackPolling, panelPolledStatuses]);
    useEffect(() => {
        if (!selectedPanelRunId || !isPanelNodeFallbackPolling) {
            return;
        }
        void refetchRunDetail();
        void refetchRuns();
        const interval = setInterval(() => {
            void refetchRunDetail();
            void refetchRuns();
        }, RUN_PANEL_FALLBACK_POLL_MS);
        return () => clearInterval(interval);
    }, [selectedPanelRunId, isPanelNodeFallbackPolling, refetchRunDetail, refetchRuns]);
    useEffect(() => {
        if (!activeWorkflowRunId || !isActiveNodeFallbackPolling) {
            return;
        }
        if (Object.keys(activePolledStatuses).length === 0) {
            return;
        }
        setNodeStatuses(activePolledStatuses);
    }, [activeWorkflowRunId, isActiveNodeFallbackPolling, activePolledStatuses]);
    useEffect(() => {
        if (!activeWorkflowRunId || !isActiveWorkflowTerminal) {
            return;
        }
        if (Object.keys(activePolledStatuses).length === 0) {
            return;
        }
        // Reconcile final persisted statuses for the last nodes even if socket terminal arrives before node terminal events.
        setNodeStatuses(activePolledStatuses);
    }, [activeWorkflowRunId, isActiveWorkflowTerminal, activePolledStatuses]);
    useEffect(() => {
        setIsActiveRunStreamConnected(false);
    }, [activeWorkflowRunId]);
    useEffect(() => {
        if (!runDetail)
            return;
        if (runDetail.finishedAt && !panelWorkflowFinishedAt) {
            setPanelWorkflowFinishedAt(new Date(runDetail.finishedAt));
        }
        if ((runDetail.status === 'Success' || runDetail.status === 'Failure') &&
            panelWorkflowStatus !== runDetail.status) {
            setPanelWorkflowStatus(runDetail.status);
        }
    }, [runDetail, panelWorkflowFinishedAt, panelWorkflowStatus]);
    const openExecutionStream = useCallback((runId: string, onNodeStatus: (nodeId: string, status: string) => void, options?: ExecutionStreamOptions) => {
        const key = `run:${runId}`;
        const existing = activeExecutionSubscriptionsRef.current.get(key);
        if (existing) {
            existing();
            activeExecutionSubscriptionsRef.current.delete(key);
        }
        const unsubscribe = subscribeToExecutionRun(runId, (data) => {
            if (data.type === 'socket') {
                options?.onSocketStatus?.(data.status);
                return;
            }
            if (data.type === 'node' &&
                typeof data.nodeId === 'string' &&
                typeof data.status === 'string') {
                onNodeStatus(data.nodeId, data.status);
            }
            if (data.type === 'workflow' && (data.status === 'Success' || data.status === 'Failure')) {
                const dispose = activeExecutionSubscriptionsRef.current.get(key);
                if (dispose) {
                    dispose();
                    activeExecutionSubscriptionsRef.current.delete(key);
                }
                options?.onWorkflowTerminal?.(data.status);
                utils.execution.getUsage.invalidate();
                void refetchRuns();
            }
        });
        activeExecutionSubscriptionsRef.current.set(key, unsubscribe);
    }, [utils, refetchRuns]);
    const handleExecuteWorkflow = useCallback(async () => {
        if (currentWorkflowId === 'new')
            return;
        if (executeWorkflowMutation.isPending || isWorkflowRunActive)
            return;
        await handleImmediateSave();
        const { validateWorkflow } = await import('@repo/shared');
        const validation = validateWorkflow(nodes.filter((node) => node.type).map((node) => ({ id: node.id, type: node.type!, data: node.data })), edges.map((edge) => ({ source: edge.source, target: edge.target, sourceHandle: edge.sourceHandle })));
        if (!validation.canExecute) {
            return;
        }
        try {
            setNodeStatuses({});
            setSelectedStatusNodeId(null);
            const result = await executeWorkflowMutation.mutateAsync({
                workflowId: currentWorkflowId,
            });
            primeSocketAuthFromExecuteResult(result as ExecuteMutationResultLike);
            disposeAllRunSubscriptions();
            setIsWorkflowRunActive(true);
            setActiveTriggerSource(null);
            setActiveWorkflowRunId(result.runId);
            setIsActiveRunStreamConnected(false);
            setIsRunPanelOpen(true);
            setSelectedPanelRunId(result.runId);
            openExecutionStream(result.runId, (nodeId, status) => {
                setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
            }, {
                onSocketStatus: (status) => {
                    setIsActiveRunStreamConnected(status === 'connected');
                },
                onWorkflowTerminal: () => {
                    setIsActiveRunStreamConnected(false);
                    void refetchActiveWorkflowRun();
                },
            });
        }
        catch (error) {
            console.error('Failed to execute workflow:', error);
        }
    }, [
        currentWorkflowId,
        handleImmediateSave,
        nodes,
        edges,
        executeWorkflowMutation,
        isWorkflowRunActive,
        openExecutionStream,
        disposeAllRunSubscriptions,
        refetchActiveWorkflowRun,
    ]);
    useEffect(() => {
        if (!activeWorkflowRunId)
            return;
        const status = activeWorkflowRunQuery.data?.status;
        if (status !== 'Success' && status !== 'Failure')
            return;
        disposeRunSubscription(activeWorkflowRunId);
        setIsWorkflowRunActive(false);
        setActiveTriggerSource(null);
        setIsActiveRunStreamConnected(false);
        setActiveWorkflowRunId(null);
    }, [activeWorkflowRunId, activeWorkflowRunQuery.data?.status, disposeRunSubscription]);
    const handleExecuteNode = useCallback(async (nodeId: string) => {
        if (currentWorkflowId === 'new')
            return;
        await handleImmediateSave();
        try {
            setSelectedStatusNodeId(nodeId);
            setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'Pending' }));
            const result = await executeWorkflowMutation.mutateAsync({
                workflowId: currentWorkflowId,
                nodeId,
            });
            primeSocketAuthFromExecuteResult(result as ExecuteMutationResultLike);
            disposeAllRunSubscriptions();
            openExecutionStream(result.runId, (streamNodeId, status) => {
                setNodeStatuses((prev) => ({ ...prev, [streamNodeId]: status }));
            });
        }
        catch (error) {
            console.error('Failed to execute node:', error);
            setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'Failed' }));
        }
    }, [currentWorkflowId, handleImmediateSave, executeWorkflowMutation, openExecutionStream, disposeAllRunSubscriptions]);
    const handleExecuteTriggerNow = useCallback(async (source: 'cron' | 'webhook', triggerNodeId: string) => {
        if (currentWorkflowId === 'new')
            return;
        if (executeWorkflowMutation.isPending || isWorkflowRunActive)
            return;
        await handleImmediateSave();
        try {
            setNodeStatuses({});
            setSelectedStatusNodeId(null);
            const result = await executeWorkflowMutation.mutateAsync({
                workflowId: currentWorkflowId,
                triggerSource: source,
                triggerNodeId,
            });
            primeSocketAuthFromExecuteResult(result as ExecuteMutationResultLike);
            disposeAllRunSubscriptions();
            setIsWorkflowRunActive(true);
            setActiveTriggerSource(source);
            setActiveWorkflowRunId(result.runId);
            setIsActiveRunStreamConnected(false);
            setIsRunPanelOpen(true);
            setSelectedPanelRunId(result.runId);
            openExecutionStream(result.runId, (nodeId, status) => {
                setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
            }, {
                onSocketStatus: (status) => {
                    setIsActiveRunStreamConnected(status === 'connected');
                },
                onWorkflowTerminal: () => {
                    setIsActiveRunStreamConnected(false);
                    void refetchActiveWorkflowRun();
                },
            });
        }
        catch (error) {
            console.error('Failed to execute trigger run now:', error);
            setActiveTriggerSource(null);
        }
    }, [
        currentWorkflowId,
        executeWorkflowMutation,
        isWorkflowRunActive,
        handleImmediateSave,
        disposeAllRunSubscriptions,
        openExecutionStream,
        refetchActiveWorkflowRun,
    ]);
    const loadMoreRuns = useCallback(() => {
        void runsQuery.fetchNextPage();
    }, [runsQuery]);
    useEffect(() => {
        const subscriptions = activeExecutionSubscriptionsRef.current;
        return () => {
            for (const dispose of subscriptions.values()) {
                dispose();
            }
            subscriptions.clear();
        };
    }, []);
    return {
        usage,
        runs: recentRuns,
        runsLoading: runsQuery.isLoading,
        hasMoreRuns: runsQuery.hasNextPage,
        loadMoreRuns,
        isLoadingMoreRuns: runsQuery.isFetchingNextPage,
        runDetail,
        runDetailLoading: runDetailQuery.isLoading,
        canvasNodes,
        nodeStatuses,
        selectedStatusNodeId,
        setSelectedStatusNodeId,
        isRunPanelOpen,
        selectedPanelRunId,
        setSelectedPanelRunId,
        panelLiveStatuses,
        panelWorkflowStatus,
        panelWorkflowFinishedAt,
        activeNodeStatusSource,
        isActiveNodeFallbackPolling,
        isPanelNodeFallbackPolling,
        isCronTriggerRunning,
        closeRunPanel,
        toggleRunPanel,
        isExecutingWorkflow: executeWorkflowMutation.isPending || isWorkflowRunActive,
        handleExecuteWorkflow,
        handleExecuteNode,
        handleExecuteTriggerNow,
    };
}
