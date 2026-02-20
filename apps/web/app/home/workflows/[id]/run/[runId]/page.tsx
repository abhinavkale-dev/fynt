'use client';
import React, { useMemo, useEffect, useState, useCallback } from 'react';
import { use } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { ReactFlow, ReactFlowProvider, Background, BackgroundVariant, MiniMap, Node, Edge, } from '@xyflow/react';
import { trpc } from '@/lib/trpc/client';
import { useExecutionSocket } from '@/lib/executions/useExecutionSocket';
import { nodeTypes } from '@/lib/reactflow/nodeTypes';
import { edgeTypes } from '@/lib/reactflow/edgeTypes';
import { EditorProvider } from '@/contexts/EditorContext';
import { Topbar } from '@/components/layout/topbar';
import { Skeleton } from '@/components/ui/skeleton';
import { Sheet, SheetContent, SheetHeader, SheetTitle, } from '@/components/ui/sheet';
import '@xyflow/react/dist/style.css';
const STATUS_COLORS: Record<string, string> = {
    Pending: 'text-yellow-400',
    Running: 'text-yellow-400',
    Success: 'text-green-400',
    Failed: 'text-red-400',
    Failure: 'text-red-400',
    Skipped: 'text-gray-400',
};
const STATUS_BG: Record<string, string> = {
    Pending: 'bg-yellow-500/20 border-yellow-500/30',
    Running: 'bg-yellow-500/20 border-yellow-500/30',
    Success: 'bg-green-500/20 border-green-500/30',
    Failed: 'bg-red-500/20 border-red-500/30',
    Failure: 'bg-red-500/20 border-red-500/30',
    Skipped: 'bg-gray-500/20 border-gray-500/30',
};
function formatDuration(start: Date, end?: Date | null, nowMs: number = Date.now()): string {
    const ms = Math.max(0, (end ? new Date(end).getTime() : nowMs) - new Date(start).getTime());
    if (ms < 1000)
        return `${Math.round(ms)}ms`;
    if (ms < 60000)
        return `${(ms / 1000).toFixed(1)}s`;
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}m ${seconds.toString().padStart(2, '0')}s`;
}
function formatOutput(output: any): string {
    if (!output)
        return '';
    if (typeof output === 'string')
        return output;
    if (output._truncated && output._preview)
        return output._preview;
    return JSON.stringify(output, null, 2);
}
interface LiveNodeInfo {
    status: string;
    nodeType?: string;
    output?: any;
    error?: string;
}
interface MergedNodeRun {
    id: string;
    nodeId: string;
    nodeType: string;
    status: string;
    output?: any;
    error?: string | null;
    startedAt?: Date | null;
    completedAt?: Date | null;
}
function RunDetailContent({ workflowId, runId }: {
    workflowId: string;
    runId: string;
}) {
    const utils = trpc.useUtils();
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [pollInterval, setPollInterval] = useState<number | false>(false);
    const [selectedNodeRunId, setSelectedNodeRunId] = useState<string | null>(null);
    const [showNodesList, setShowNodesList] = useState(false);
    const { data: run, isLoading } = trpc.execution.getById.useQuery({ runId }, {
        refetchOnWindowFocus: false,
        refetchInterval: pollInterval
    });
    const nodeStatuses = useMemo(() => {
        if (!run?.nodeRuns)
            return {};
        const statuses: Record<string, string> = {};
        for (const nr of run.nodeRuns) {
            statuses[nr.nodeId] = nr.status;
        }
        return statuses;
    }, [run?.nodeRuns]);
    const nodes = useMemo(() => {
        if (!run?.workflow?.nodes)
            return [];
        return (run.workflow.nodes as unknown as Node[]);
    }, [run?.workflow?.nodes]);
    const edges = useMemo(() => {
        if (!run?.workflow?.edges)
            return [];
        return (run.workflow.edges as unknown as Edge[]);
    }, [run?.workflow?.edges]);
    const memoizedNodeTypes = useMemo(() => nodeTypes, []);
    const [liveNodeData, setLiveNodeData] = useState<Record<string, LiveNodeInfo>>({});
    const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
    const isTerminal = run?.status === 'Success' || run?.status === 'Failure';
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 100);
        return () => {
            window.clearInterval(timer);
        };
    }, []);
    const handleSocketEvent = useCallback((data: any) => {
        if (data.type === 'node') {
            setLiveNodeData((prev) => ({
                ...prev,
                [data.nodeId]: {
                    status: data.status,
                    nodeType: data.nodeType || prev[data.nodeId]?.nodeType,
                    output: data.output ?? prev[data.nodeId]?.output,
                    error: data.error ?? prev[data.nodeId]?.error,
                },
            }));
        }
        if (data.type === 'workflow') {
            setWorkflowStatus(data.status);
            if (data.status === 'Success' || data.status === 'Failure') {
                void utils.execution.getById.invalidate({ runId });
            }
        }
    }, [runId, utils.execution.getById]);
    const { isConnected: isSocketConnected } = useExecutionSocket({
        runId,
        enabled: !isTerminal,
        onEvent: handleSocketEvent,
    });
    useEffect(() => {
        if (run?.status === 'Success' || run?.status === 'Failure') {
            setPollInterval(false);
            return;
        }
        setPollInterval(isSocketConnected ? 1500 : 2500);
    }, [run?.status, isSocketConnected]);
    const mergedStatuses = useMemo(() => {
        const result: Record<string, string> = { ...nodeStatuses };
        for (const [nodeId, info] of Object.entries(liveNodeData)) {
            result[nodeId] = info.status;
        }
        return result;
    }, [nodeStatuses, liveNodeData]);
    const mergedNodeRuns = useMemo((): MergedNodeRun[] => {
        const byNodeId = new Map<string, MergedNodeRun>();
        if (run?.nodeRuns) {
            for (const nr of run.nodeRuns) {
                byNodeId.set(nr.nodeId, {
                    id: nr.id,
                    nodeId: nr.nodeId,
                    nodeType: nr.nodeType,
                    status: nr.status,
                    output: nr.output,
                    error: nr.error,
                    startedAt: nr.startedAt,
                    completedAt: nr.completedAt,
                });
            }
        }
        for (const [nodeId, live] of Object.entries(liveNodeData)) {
            const existing = byNodeId.get(nodeId);
            if (existing) {
                byNodeId.set(nodeId, {
                    ...existing,
                    status: live.status,
                    output: live.output ?? existing.output,
                    error: live.error ?? existing.error,
                });
            }
            else {
                byNodeId.set(nodeId, {
                    id: `live-${nodeId}`,
                    nodeId,
                    nodeType: live.nodeType || 'unknown',
                    status: live.status,
                    output: live.output,
                    error: live.error ?? null,
                    startedAt: null,
                    completedAt: null,
                });
            }
        }
        return Array.from(byNodeId.values());
    }, [run?.nodeRuns, liveNodeData]);
    const effectiveStatus = workflowStatus || run?.status || 'Pending';
    if (isLoading) {
        return (<>
        <Topbar title="Loading..."/>
        <div className="pt-14 flex-1 flex items-center justify-center">
          <Skeleton className="h-64 w-96 bg-white/5"/>
        </div>
      </>);
    }
    if (!run) {
        return (<>
        <Topbar title="Not Found"/>
        <div className="pt-14 flex-1 flex items-center justify-center text-white/50">
          Execution not found
        </div>
      </>);
    }
    return (<>
      <Topbar title={run.workflow.title}>
        <div className="flex items-center gap-3">
          <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border transition-colors duration-200 ease ${STATUS_BG[effectiveStatus] || ''} ${STATUS_COLORS[effectiveStatus] || ''}`}>
            {effectiveStatus}
          </span>
          <span className="text-white/40 text-xs">
            {formatDuration(run.createdAt, run.finishedAt, nowMs)}
          </span>
          <Link href={`/home/workflows/${workflowId}`} className="text-xs text-white/50 hover:text-white transition-colors">
            Edit Workflow
          </Link>
          <button onClick={() => setShowNodesList(!showNodesList)} className="text-xs text-white/50 hover:text-white transition-colors px-2 py-1 rounded hover:bg-white/5">
            {showNodesList ? 'Hide' : 'View'} Runs ({mergedNodeRuns.length})
          </button>
        </div>
      </Topbar>

      <div className="flex flex-1 overflow-hidden" style={{ height: 'calc(100vh - 3.5rem)' }}>
        
        <div className="flex-1">
          <EditorProvider nodeStatuses={mergedStatuses} canEditNodes={false}>
            <ReactFlow nodes={nodes} edges={edges} nodeTypes={memoizedNodeTypes} edgeTypes={edgeTypes} fitView fitViewOptions={{ padding: 0.3 }} nodesDraggable={false} nodesConnectable={false} elementsSelectable={false} panOnScroll zoomOnScroll colorMode="dark" proOptions={{ hideAttribution: true }}>
              <MiniMap />
              <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="#4a4a4a"/>
            </ReactFlow>
          </EditorProvider>
        </div>

        
        {showNodesList && mergedNodeRuns.length > 0 && (<div className="absolute right-4 top-20 max-w-xs z-10">
            <div className="bg-[#1a1a1a] rounded-lg border border-[#333] p-3 shadow-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-xs font-medium text-white/70">Node Runs ({mergedNodeRuns.length})</h3>
                <button onClick={() => setShowNodesList(false)} className="text-white/40 hover:text-white/70 text-xs">
                  ✕
                </button>
              </div>
              <div className="space-y-1 max-h-96 overflow-y-auto">
                {mergedNodeRuns.map((nr) => (<button key={nr.id} onClick={() => {
                    setSelectedNodeRunId(nr.id);
                    setShowNodesList(false);
                }} className="w-full text-left px-2 py-1 rounded text-xs hover:bg-[#222] transition-colors flex items-center justify-between">
                    <span className="text-white/60 truncate">{nr.nodeType}</span>
                    <span className={`${STATUS_COLORS[nr.status] || 'text-white/50'} font-medium ml-2`}>
                      {nr.status}
                    </span>
                  </button>))}
              </div>
            </div>
          </div>)}

        
        <Sheet open={selectedNodeRunId !== null} onOpenChange={(open) => { if (!open)
        setSelectedNodeRunId(null); }}>
          <SheetContent side="right" className="w-96 overflow-y-auto bg-[#141414] border-l border-[#333]">
            <SheetHeader>
              <SheetTitle className="text-white">Node Run Details</SheetTitle>
            </SheetHeader>

            <div className="mt-6 space-y-2">
              {selectedNodeRunId && (() => {
            const selectedRun = mergedNodeRuns.find(nr => nr.id === selectedNodeRunId);
            if (!selectedRun)
                return null;
            return (<motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }} className="rounded-lg border border-[#333] bg-[#1a1a1a] p-3">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs text-white/70 font-medium">{selectedRun.nodeType}</span>
                      <span className={`text-xs font-medium transition-colors duration-200 ease ${STATUS_COLORS[selectedRun.status] || 'text-white/50'}`}>
                        {selectedRun.status}
                      </span>
                    </div>
                    <div className="text-xs text-white/40 space-y-0.5">
                      <div>ID: {selectedRun.nodeId.slice(0, 8)}...</div>
                      {selectedRun.startedAt && (<div>Duration: {formatDuration(selectedRun.startedAt, selectedRun.completedAt, nowMs)}</div>)}
                      {selectedRun.error && (() => {
                    const [message, hint] = selectedRun.error.split('\nHint: ');
                    return (<div className="text-red-400 mt-1 p-2 bg-red-500/10 rounded border border-red-500/20">
                            <div className="font-medium mb-1">Error:</div>
                            <div className="font-mono text-[10px] break-words">{message}</div>
                            {hint && (<div className="mt-1.5 text-[10px] text-amber-400/90 flex items-start gap-1">
                                <span className="shrink-0">Hint:</span>
                                <span>{hint}</span>
                              </div>)}
                          </div>);
                })()}
                      {selectedRun.output && selectedRun.status === 'Success' && (<div className="mt-2">
                          <div className="font-medium text-white/60 mb-1">Output:</div>
                          <div className="bg-[#0d0d0d] rounded p-2 border border-[#2a2a2a] max-h-96 overflow-y-auto">
                            <pre className="text-[10px] font-mono text-white/70 whitespace-pre-wrap break-words">
                              {formatOutput(selectedRun.output)}
                            </pre>
                          </div>
                          {selectedRun.output?._truncated && (<div className="text-[10px] text-white/30 mt-1 italic">
                              Output truncated ({Math.round(selectedRun.output._previewLength / 1024)}KB). Full output loads on completion.
                            </div>)}
                        </div>)}
                    </div>
                  </motion.div>);
        })()}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </>);
}
export default function RunPage({ params }: {
    params: Promise<{
        id: string;
        runId: string;
    }>;
}) {
    const { id, runId } = use(params);
    return (<ReactFlowProvider>
      <RunDetailContent workflowId={id} runId={runId}/>
    </ReactFlowProvider>);
}
