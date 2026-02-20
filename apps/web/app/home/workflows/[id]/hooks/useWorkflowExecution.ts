'use client';
import { useCallback, useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction, } from 'react';
import type { Edge, Node } from '@xyflow/react';
import { trpc } from '@/lib/trpc/client';
import { subscribeToExecutionRun } from '@/lib/executions/executionSocketClient';
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
    closeRunPanel: () => void;
    toggleRunPanel: () => void;
    isExecutingWorkflow: boolean;
    handleExecuteWorkflow: () => Promise<void>;
    handleExecuteNode: (nodeId: string) => Promise<void>;
}
const RUN_PANEL_FALLBACK_POLL_MS = 2000;
const RUN_PANEL_CONNECTED_SYNC_MS = 1500;
interface ExecutionStreamOptions {
    onWorkflowTerminal?: (status: 'Success' | 'Failure') => void;
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
    const [activeWorkflowRunId, setActiveWorkflowRunId] = useState<string | null>(null);
    const [isWorkflowRunActive, setIsWorkflowRunActive] = useState(false);
    const activeExecutionSubscriptionsRef = useRef<Map<string, () => void>>(new Map());
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
    const recentRuns = useMemo<RunPanelListItem[]>(() => (runsQuery.data?.pages.flatMap((page) => page.runs) ?? []) as RunPanelListItem[], [runsQuery.data]);
    const runDetailQuery = trpc.execution.getById.useQuery({ runId: selectedPanelRunId ?? '' }, { enabled: Boolean(selectedPanelRunId), refetchOnWindowFocus: false });
    const activeWorkflowRunQuery = trpc.execution.getById.useQuery({ runId: activeWorkflowRunId ?? '' }, {
        enabled: Boolean(activeWorkflowRunId),
        refetchOnWindowFocus: false,
        refetchInterval: isWorkflowRunActive ? 2000 : false,
    });
    const runDetail = useMemo<RunPanelDetail | null>(() => (runDetailQuery.data ? (runDetailQuery.data as RunPanelDetail) : null), [runDetailQuery.data]);
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
        const effectiveStatus = panelWorkflowStatus || runDetail?.status;
        if (effectiveStatus === 'Success' || effectiveStatus === 'Failure') {
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
                    runDetailQuery.refetch();
                    runsQuery.refetch();
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
    }, [selectedPanelRunId, panelWorkflowStatus, runDetail?.status, runDetailQuery, runsQuery]);
    useEffect(() => {
        setPanelLiveStatuses({});
        setPanelWorkflowStatus(null);
        setPanelWorkflowFinishedAt(null);
        setIsPanelStreamConnected(false);
    }, [selectedPanelRunId]);
    useEffect(() => {
        if (!selectedPanelRunId)
            return;
        const effectiveStatus = panelWorkflowStatus || runDetail?.status;
        if (effectiveStatus !== 'Pending')
            return;
        const interval = setInterval(() => {
            runDetailQuery.refetch();
            if (!isPanelStreamConnected) {
                runsQuery.refetch();
            }
        }, isPanelStreamConnected ? RUN_PANEL_CONNECTED_SYNC_MS : RUN_PANEL_FALLBACK_POLL_MS);
        return () => clearInterval(interval);
    }, [selectedPanelRunId, panelWorkflowStatus, runDetail?.status, runDetailQuery, runsQuery, isPanelStreamConnected]);
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
                runsQuery.refetch();
            }
        });
        activeExecutionSubscriptionsRef.current.set(key, unsubscribe);
    }, [utils, runsQuery]);
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
            setIsWorkflowRunActive(true);
            setActiveWorkflowRunId(result.runId);
            setIsRunPanelOpen(true);
            setSelectedPanelRunId(result.runId);
            openExecutionStream(result.runId, (nodeId, status) => {
                setNodeStatuses((prev) => ({ ...prev, [nodeId]: status }));
            }, {
                onWorkflowTerminal: () => {
                    setIsWorkflowRunActive(false);
                    setActiveWorkflowRunId((current) => (current === result.runId ? null : current));
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
    ]);
    useEffect(() => {
        if (!activeWorkflowRunId)
            return;
        const status = activeWorkflowRunQuery.data?.status;
        if (status !== 'Success' && status !== 'Failure')
            return;
        setIsWorkflowRunActive(false);
        setActiveWorkflowRunId(null);
    }, [activeWorkflowRunId, activeWorkflowRunQuery.data?.status]);
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
            openExecutionStream(result.runId, (streamNodeId, status) => {
                setNodeStatuses((prev) => ({ ...prev, [streamNodeId]: status }));
            });
        }
        catch (error) {
            console.error('Failed to execute node:', error);
            setNodeStatuses((prev) => ({ ...prev, [nodeId]: 'Failed' }));
        }
    }, [currentWorkflowId, handleImmediateSave, executeWorkflowMutation, openExecutionStream]);
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
        closeRunPanel,
        toggleRunPanel,
        isExecutingWorkflow: executeWorkflowMutation.isPending || isWorkflowRunActive,
        handleExecuteWorkflow,
        handleExecuteNode,
    };
}
