'use client';
import { useEffect, useState, type ComponentProps } from 'react';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
const RUN_STATUS_COLORS: Record<string, string> = {
    Pending: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    Success: 'bg-green-500/20 text-green-400 border-green-500/30',
    Failure: 'bg-red-500/20 text-red-400 border-red-500/30',
};
const NODE_STATUS_COLORS: Record<string, string> = {
    Pending: 'text-yellow-400',
    Running: 'text-yellow-400',
    Success: 'text-green-400',
    Failed: 'text-red-400',
    Skipped: 'text-gray-400',
};
function formatRunDuration(start: Date, end?: Date | null, nowMs: number = Date.now()): string {
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
function runTimeAgo(date: Date, nowMs: number = Date.now()): string {
    const seconds = Math.floor((nowMs - new Date(date).getTime()) / 1000);
    if (seconds < 60)
        return 'just now';
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
export interface RunPanelListItem {
    id: string;
    status: string;
    source?: string | null;
    createdAt: Date;
    finishedAt: Date | null;
    workflow: {
        id: string;
        title: string;
    };
    nodeRuns: {
        id: string;
        status: string;
    }[];
}
export interface RunPanelNodeRunItem {
    id: string;
    nodeId: string;
    nodeType: string;
    status: string;
    startedAt: Date;
    completedAt: Date | null;
    output?: unknown;
    error?: string | null;
}
export interface RunPanelDetail {
    id: string;
    status: string;
    source?: string | null;
    createdAt: Date;
    finishedAt: Date | null;
    nodeRuns: RunPanelNodeRunItem[];
}
interface RunPanelProps {
    runs: RunPanelListItem[];
    isLoading: boolean;
    selectedRunId: string | null;
    onSelectRun: (id: string | null) => void;
    runDetail: RunPanelDetail | null | undefined;
    runDetailLoading: boolean;
    liveStatuses: Record<string, string>;
    workflowStatus: string | null;
    workflowFinishedAt: Date | null;
    selectedNodeId: string | null;
    onSelectNode: (nodeId: string | null) => void;
    onClose: () => void;
    hasNextPage: boolean | undefined;
    fetchNextPage: () => void;
    isFetchingNextPage: boolean;
    isNodeFallbackPolling?: boolean;
    executionsHref?: ComponentProps<typeof Link>['href'];
}
export function RunPanel({ runs, isLoading, selectedRunId, onSelectRun, runDetail, runDetailLoading, liveStatuses, workflowStatus, workflowFinishedAt, selectedNodeId, onSelectNode, onClose, hasNextPage, fetchNextPage, isFetchingNextPage, isNodeFallbackPolling = false, executionsHref = { pathname: '/home/executions' }, }: RunPanelProps) {
    const [nowMs, setNowMs] = useState(() => Date.now());
    const effectiveStatus = workflowStatus || runDetail?.status || 'Pending';
    const isWorkflowTerminal = effectiveStatus === 'Success' || effectiveStatus === 'Failure';
    const effectiveFinishedAt = runDetail?.finishedAt ||
        ((effectiveStatus === 'Success' || effectiveStatus === 'Failure') ? workflowFinishedAt : null);
    const [expandedOutputs, setExpandedOutputs] = useState<Set<string>>(new Set());
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 100);
        return () => {
            window.clearInterval(timer);
        };
    }, []);
    const toggleOutput = (nodeRunId: string) => {
        setExpandedOutputs((prev) => {
            const next = new Set(prev);
            if (next.has(nodeRunId)) {
                next.delete(nodeRunId);
            }
            else {
                next.add(nodeRunId);
            }
            return next;
        });
    };
    return (<div className="w-80 h-full min-h-0 border-l border-[#333] bg-[#101010] flex flex-col overflow-hidden shrink-0" onWheelCapture={(event) => {
            event.stopPropagation();
        }}>
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#333] shrink-0 bg-[#101010]">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-white">Runs</h3>
          {isNodeFallbackPolling && (<span className="inline-flex items-center rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
              Polling
            </span>)}
        </div>
        <div className="flex items-center gap-1">
          <Link href={executionsHref} className="inline-flex items-center justify-center w-7 h-7 rounded text-white/40 hover:text-white hover:bg-white/5 transition-colors duration-150" title="Open executions page" aria-label="Open executions page">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M7 17L17 7"/>
              <path d="M7 7h10v10"/>
            </svg>
          </Link>
          <button onClick={onClose} className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/5">
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      <div className="shrink-0 max-h-[40%] overflow-y-auto border-b border-[#333] bg-[#101010]" style={{ scrollbarGutter: 'stable' }}>
        {isLoading ? (<div className="p-3 space-y-2">
            {[1, 2, 3].map((i) => (<div key={i} className="h-10 bg-white/5 rounded animate-pulse"/>))}
          </div>) : runs.length === 0 ? (<div className="p-4 text-xs text-white/40 text-center">
            No runs yet. Execute the workflow to see results.
          </div>) : (<div className="p-2 space-y-0.5">
            {runs.map((run) => {
                const successNodes = run.nodeRuns.filter((n) => n.status === 'Success').length;
                const totalNodes = run.nodeRuns.length;
                return (<button key={run.id} onClick={() => onSelectRun(run.id)} className={`w-full text-left px-3 py-2 rounded-md text-xs border transition-colors ${selectedRunId === run.id
                        ? 'border-white/15 bg-white/[0.04] text-white'
                        : 'border-transparent text-white/60 hover:text-white hover:bg-white/[0.03]'}`}>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${RUN_STATUS_COLORS[run.status] || 'bg-gray-500/20 text-gray-400 border-gray-500/30'}`}>
                      {run.status}
                    </span>
                    <span className="text-white/40">
                      {totalNodes > 0 ? `${successNodes}/${totalNodes}` : '-'}
                    </span>
                    <span className="text-white/30 ml-auto">{runTimeAgo(run.createdAt, nowMs)}</span>
                  </div>
                </button>);
            })}
            {hasNextPage && (<button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="w-full text-center py-2 text-xs text-white/40 hover:text-white/60 transition-colors disabled:opacity-50">
                {isFetchingNextPage ? 'Loading...' : 'Load more'}
              </button>)}
          </div>)}
      </div>

      <div className="flex-1 min-h-0 overflow-hidden p-3 bg-[#101010]">
        <div className="flex h-full min-h-0 flex-col">
          {selectedRunId && runDetail && !runDetailLoading && (<div className="flex items-center justify-between mb-3 shrink-0">
              <div className="flex items-center gap-2">
                <span className={`inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium border ${RUN_STATUS_COLORS[effectiveStatus] || ''}`}>
                  {effectiveStatus}
                </span>
                <span className="text-white/40 text-xs">
                  {formatRunDuration(runDetail.createdAt, effectiveFinishedAt, nowMs)}
                </span>
                {isNodeFallbackPolling && (<span className="inline-flex items-center rounded border border-white/20 bg-white/5 px-1.5 py-0.5 text-[10px] font-medium text-white/60">
                    Polling
                  </span>)}
              </div>
              <button onClick={() => onSelectRun(null)} className="text-white/40 hover:text-white transition-colors p-1 rounded hover:bg-white/5" title="Close details">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"/>
                  <line x1="6" y1="6" x2="18" y2="18"/>
                </svg>
              </button>
            </div>)}

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain pr-1" style={{ scrollbarGutter: 'stable' }}>
            {!selectedRunId ? (<div className="text-xs text-white/40 text-center py-4">Select a run to see details.</div>) : runDetailLoading || !runDetail ? (<div className="space-y-2">
                {[1, 2].map((i) => (<div key={i} className="h-16 bg-white/5 rounded-lg animate-pulse"/>))}
              </div>) : (<div className="space-y-2 pb-1">
                {runDetail.nodeRuns.length === 0 ? (<p className="text-white/40 text-xs">No nodes executed yet.</p>) : (<AnimatePresence initial={false}>
                    {runDetail.nodeRuns.map((nr, index) => {
                        const isPersistedTerminal = nr.status === 'Success' || nr.status === 'Failed' || nr.status === 'Skipped';
                        const liveStatus = (isWorkflowTerminal || isPersistedTerminal)
                            ? nr.status
                            : (liveStatuses[nr.nodeId] || nr.status);
                        return (<motion.div key={nr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }} onClick={() => onSelectNode(nr.nodeId)} className={`rounded-lg border bg-[#101010] p-2.5 cursor-pointer transition-colors ${selectedNodeId === nr.nodeId
                                ? 'border-white/20 bg-[#131313]'
                                : 'border-[#333] hover:border-[#555]'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/70 font-medium">{nr.nodeType}</span>
                            <span className={`text-[10px] font-medium transition-colors duration-200 ${NODE_STATUS_COLORS[liveStatus] || 'text-white/50'}`}>
                              {liveStatus}
                            </span>
                          </div>
                          <div className="text-[10px] text-white/40 space-y-0.5">
                            {nr.startedAt && (<div>{formatRunDuration(nr.startedAt, nr.completedAt, nowMs)}</div>)}
                            {nr.error && (() => {
                                const [message, hint] = nr.error.split('\nHint: ');
                                return (<div className="text-red-400 mt-1 p-1.5 bg-red-500/10 rounded border border-red-500/20">
                                  <div className="font-medium mb-0.5">Error:</div>
                                  <div className="font-mono text-[9px] break-words">{message}</div>
                                  {hint && (<div className="mt-1.5 text-[9px] text-amber-400/90 flex items-start gap-1">
                                      <span className="shrink-0">Hint:</span>
                                      <span>{hint}</span>
                                    </div>)}
                                </div>);
                            })()}
                            {nr.output != null && liveStatus === 'Success' && (<div className="mt-1.5">
                                <button onClick={() => toggleOutput(nr.id)} className="flex items-center gap-1 font-medium text-white/60 hover:text-white/80 transition-colors cursor-pointer mb-0.5">
                                  <svg xmlns="http://www.w3.org/2000/svg" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={`transition-transform duration-150 ${expandedOutputs.has(nr.id) ? 'rotate-90' : ''}`}>
                                    <polyline points="9 18 15 12 9 6"/>
                                  </svg>
                                  Output
                                </button>
                                {expandedOutputs.has(nr.id) && (<div className="bg-[#0d0d0d] rounded p-1.5 border border-[#2a2a2a] max-h-64 overflow-y-auto">
                                    <pre className="text-[9px] font-mono text-white/70 whitespace-pre-wrap break-words">
                                      {typeof nr.output === 'string'
                                        ? nr.output
                                        : JSON.stringify(nr.output, null, 2)}
                                    </pre>
                                  </div>)}
                              </div>)}
                          </div>
                        </motion.div>);
                    })}
                  </AnimatePresence>)}
              </div>)}
          </div>
        </div>
      </div>
    </div>);
}
