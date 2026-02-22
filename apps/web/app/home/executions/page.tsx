"use client";
import { Suspense, useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { trpc } from "@/lib/trpc/client";
import { useExecutionSocket } from "@/lib/executions/useExecutionSocket";
import { EASE_OUT_QUAD } from "@/lib/animation/variants";
import { useIsMobile } from "@/hooks/use-mobile";
import { useSearchParams } from "next/navigation";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, } from "@/components/ui/sheet";
import { Skeleton } from "@/components/ui/skeleton";
const TIMING = {
    header: { duration: 0.2, delay: 0 },
    pillStrip: { duration: 0.2, delay: 0.05 },
    pillItem: { duration: 0.15, stagger: 0.04 },
    cardList: { duration: 0.18, stagger: 0.03 },
    cardExit: { duration: 0.12 },
} as const;
const STATUS_COLORS: Record<string, string> = {
    Pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    Success: "bg-green-500/20 text-green-400 border-green-500/30",
    Failure: "bg-red-500/20 text-red-400 border-red-500/30",
};
const NODE_STATUS_COLORS: Record<string, string> = {
    Pending: "text-yellow-400",
    Running: "text-yellow-400",
    Success: "text-green-400",
    Failed: "text-red-400",
    Skipped: "text-gray-400",
};
function StatusBadge({ status }: {
    status: string;
}) {
    return (<span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${STATUS_COLORS[status] || "bg-gray-500/20 text-gray-400 border-gray-500/30"}`}>
      {status}
    </span>);
}
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
function timeAgo(date: Date, nowMs: number = Date.now()): string {
    const seconds = Math.floor((nowMs - new Date(date).getTime()) / 1000);
    if (seconds < 60)
        return "just now";
    if (seconds < 3600)
        return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400)
        return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
}
type StatusFilter = "Pending" | "Success" | "Failure" | undefined;
function MobileWorkflowPills({ workflows, isLoading, selectedId, onSelect, }: {
    workflows: {
        id: string;
        title: string;
    }[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    const shouldReduceMotion = useReducedMotion();
    if (isLoading) {
        return (<div className="flex gap-2 px-4 py-2 overflow-x-auto scrollbar-none">
        {[1, 2, 3].map((i) => (<div key={i} className="h-8 w-24 shrink-0 bg-white/5 rounded-full animate-pulse"/>))}
      </div>);
    }
    if (workflows.length === 0)
        return null;
    return (<motion.div className="overflow-x-auto scrollbar-none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: TIMING.pillStrip.duration, delay: TIMING.pillStrip.delay, ease: EASE_OUT_QUAD }}>
      <motion.div className="flex gap-2 px-4 py-2" initial="hidden" animate="show" variants={{
            hidden: {},
            show: { transition: { staggerChildren: shouldReduceMotion ? 0 : TIMING.pillItem.stagger } },
        }}>
        {workflows.map((wf) => (<motion.button key={wf.id} variants={shouldReduceMotion ? {} : {
                hidden: { opacity: 0, x: -8 },
                show: { opacity: 1, x: 0, transition: { duration: TIMING.pillItem.duration, ease: EASE_OUT_QUAD } },
            }} onClick={() => onSelect(wf.id)} whileTap={shouldReduceMotion ? {} : { scale: 0.96 }} className={`shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap transition-colors ${selectedId === wf.id
                ? "bg-white/15 text-white"
                : "text-white/50 bg-white/4 active:bg-white/10"}`}>
            {wf.title || "Untitled Workflow"}
          </motion.button>))}
      </motion.div>
    </motion.div>);
}
function WorkflowList({ workflows, isLoading, selectedId, onSelect, }: {
    workflows: {
        id: string;
        title: string;
    }[];
    isLoading: boolean;
    selectedId: string | null;
    onSelect: (id: string) => void;
}) {
    if (isLoading) {
        return (<div className="p-3 space-y-1">
        {[1, 2, 3, 4, 5].map((i) => (<div key={i} className="h-9 bg-white/5 rounded animate-pulse"/>))}
      </div>);
    }
    if (workflows.length === 0) {
        return (<motion.div className="p-4 text-sm text-white/40 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
        No workflows yet
      </motion.div>);
    }
    return (<motion.div className="p-2 h-full min-h-0 flex flex-col" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.03 } } }}>
      <div className="px-2 py-2 text-xs font-medium text-white/40 uppercase tracking-wider">
        Workflows
      </div>
      <div className="min-h-0 overflow-y-auto pr-1 max-h-[calc(100dvh-16rem)]" style={{ scrollbarGutter: "stable" }}>
        {workflows.map((wf) => (<motion.button key={wf.id} variants={{
                hidden: { opacity: 0, x: -8 },
                show: { opacity: 1, x: 0, transition: { duration: 0.15, ease: EASE_OUT_QUAD } },
            }} onClick={() => onSelect(wf.id)} className={`w-full text-left px-3 py-2.5 rounded-md text-sm transition-colors truncate ${selectedId === wf.id
                ? "bg-white/10 text-white"
                : "text-white/60 hover:text-white hover:bg-white/4"}`}>
          {wf.title || "Untitled Workflow"}
        </motion.button>))}
      </div>
    </motion.div>);
}
type RunItem = {
    id: string;
    status: string;
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
};
function ExecutionCard({ run, onSelectRun, nowMs, }: {
    run: RunItem;
    onSelectRun: (runId: string) => void;
    nowMs: number;
}) {
    const successNodes = run.nodeRuns.filter((n) => n.status === "Success").length;
    const totalNodes = run.nodeRuns.length;
    const duration = run.finishedAt
        ? formatDuration(run.createdAt, run.finishedAt, nowMs)
        : run.status === "Pending"
            ? formatDuration(run.createdAt, null, nowMs)
            : "—";
    return (<button onClick={() => onSelectRun(run.id)} className="w-full text-left rounded-lg border border-[#333] bg-[#141414] px-4 py-3 min-h-[56px] transition-colors [@media(hover:hover)_and_(pointer:fine)]:hover:bg-white/2 active:bg-white/4">
      <div className="flex items-center justify-between gap-2">
        <StatusBadge status={run.status}/>
        <span className="text-xs text-white/40 shrink-0">{timeAgo(run.createdAt, nowMs)}</span>
      </div>
      <div className="flex items-center justify-between mt-1.5 text-xs text-white/50">
        <span>{totalNodes > 0 ? `${successNodes}/${totalNodes} nodes passed` : "No nodes"}</span>
        <span className="shrink-0">{duration}</span>
      </div>
    </button>);
}
function MobileCardList({ runs, onSelectRun, workflowId, nowMs, }: {
    runs: RunItem[];
    onSelectRun: (runId: string) => void;
    workflowId: string | null;
    nowMs: number;
}) {
    const shouldReduceMotion = useReducedMotion();
    return (<AnimatePresence mode="wait">
      <motion.div key={workflowId ?? "empty"} className="space-y-2" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} exit={shouldReduceMotion ? {} : { opacity: 0, y: -4, transition: { duration: TIMING.cardExit.duration } }} transition={{ duration: 0.15, ease: EASE_OUT_QUAD }}>
        <motion.div initial="hidden" animate="show" variants={{
            hidden: {},
            show: { transition: { staggerChildren: shouldReduceMotion ? 0 : TIMING.cardList.stagger } },
        }}>
          {runs.map((run) => (<motion.div key={run.id} variants={shouldReduceMotion ? {} : {
                hidden: { opacity: 0, y: 8 },
                show: { opacity: 1, y: 0, transition: { duration: TIMING.cardList.duration, ease: EASE_OUT_QUAD } },
            }} className="mb-2">
              <ExecutionCard run={run} onSelectRun={onSelectRun} nowMs={nowMs}/>
            </motion.div>))}
        </motion.div>
      </motion.div>
    </AnimatePresence>);
}
function ExecutionTable({ runs, isLoading, hasNextPage, isFetchingNextPage, fetchNextPage, onSelectRun, isMobile, selectedWorkflowId, nowMs, }: {
    runs: RunItem[];
    isLoading: boolean;
    hasNextPage: boolean | undefined;
    isFetchingNextPage: boolean;
    fetchNextPage: () => void;
    onSelectRun: (runId: string) => void;
    isMobile: boolean;
    selectedWorkflowId: string | null;
    nowMs: number;
}) {
    if (isLoading) {
        if (isMobile) {
            return (<div className="space-y-2">
          {[1, 2, 3, 4, 5].map((i) => (<div key={i} className="h-[56px] bg-white/5 rounded-lg animate-pulse"/>))}
        </div>);
        }
        return (<div className="border border-[#333] rounded-lg overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="border-b border-[#333] text-left text-xs text-white/40 uppercase tracking-wider">
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Nodes</th>
              <th className="px-4 py-3">Started</th>
              <th className="px-4 py-3">Duration</th>
            </tr>
          </thead>
          <tbody>
            {[1, 2, 3, 4, 5].map((i) => (<tr key={i} className="border-b border-[#333] last:border-0">
                <td className="px-4 py-3"><div className="h-5 w-16 bg-white/5 rounded animate-pulse"/></td>
                <td className="px-4 py-3"><div className="h-4 w-16 bg-white/5 rounded animate-pulse"/></td>
                <td className="px-4 py-3"><div className="h-4 w-14 bg-white/5 rounded animate-pulse"/></td>
                <td className="px-4 py-3"><div className="h-4 w-12 bg-white/5 rounded animate-pulse"/></td>
              </tr>))}
          </tbody>
        </table>
      </div>);
    }
    if (runs.length === 0) {
        return (<motion.div className="text-white/50 text-sm py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
        No executions found for this workflow.
      </motion.div>);
    }
    return (<>
      {isMobile ? (<MobileCardList runs={runs} onSelectRun={onSelectRun} workflowId={selectedWorkflowId} nowMs={nowMs}/>) : (<div className="border border-[#333] rounded-lg overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#333] text-left text-xs text-white/40 uppercase tracking-wider">
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Nodes</th>
                <th className="px-4 py-3">Started</th>
                <th className="px-4 py-3">Duration</th>
              </tr>
            </thead>
            <tbody>
              {runs.map((run) => {
                const successNodes = run.nodeRuns.filter((n) => n.status === "Success").length;
                const totalNodes = run.nodeRuns.length;
                return (<tr key={run.id} onClick={() => onSelectRun(run.id)} className="border-b border-[#333] last:border-0 hover:bg-white/2 transition-colors cursor-pointer">
                    <td className="px-4 py-3">
                      <StatusBadge status={run.status}/>
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {totalNodes > 0 ? `${successNodes}/${totalNodes} passed` : "-"}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {timeAgo(run.createdAt, nowMs)}
                    </td>
                    <td className="px-4 py-3 text-sm text-white/60">
                      {run.finishedAt
                        ? formatDuration(run.createdAt, run.finishedAt, nowMs)
                        : run.status === "Pending"
                            ? formatDuration(run.createdAt, null, nowMs)
                            : "-"}
                    </td>
                  </tr>);
            })}
            </tbody>
          </table>
        </div>)}

      {hasNextPage && (<div className="mt-4 text-center">
          <button onClick={() => fetchNextPage()} disabled={isFetchingNextPage} className="px-4 py-2 text-sm text-white/60 hover:text-white hover:bg-white/5 rounded transition-colors disabled:opacity-50">
            {isFetchingNextPage ? "Loading..." : "Load more"}
          </button>
        </div>)}
    </>);
}
function ExecutionDetailSheet({ runId, open, onOpenChange, nowMs, }: {
    runId: string | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    nowMs: number;
}) {
    const { data: run, isLoading } = trpc.execution.getById.useQuery({ runId: runId! }, { enabled: !!runId, refetchOnWindowFocus: false });
    const utils = trpc.useUtils();
    const [liveStatuses, setLiveStatuses] = useState<Record<string, string>>({});
    const [workflowStatus, setWorkflowStatus] = useState<string | null>(null);
    const lastNodeRefetchAtRef = useRef(0);
    useExecutionSocket({
        runId: runId ?? null,
        enabled: Boolean(runId && run?.status === "Pending"),
        onEvent: (data) => {
            if (data.type === "node") {
                setLiveStatuses((prev) => ({ ...prev, [data.nodeId]: data.status }));
                if (runId) {
                    const now = Date.now();
                    if (now - lastNodeRefetchAtRef.current > 450) {
                        lastNodeRefetchAtRef.current = now;
                        void utils.execution.getById.invalidate({ runId });
                    }
                }
            }
            if (data.type === "workflow") {
                setWorkflowStatus(data.status);
                if ((data.status === "Success" || data.status === "Failure") && runId) {
                    void utils.execution.getById.invalidate({ runId });
                }
            }
        },
    });
    useEffect(() => {
        setLiveStatuses({});
        setWorkflowStatus(null);
    }, [runId]);
    const effectiveStatus = workflowStatus || run?.status || "Pending";
    return (<Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="sm:max-w-md bg-[#1a1a1a] border-[#333] p-0 overflow-y-auto rounded-l-xl outline-none focus:outline-none focus-visible:outline-none focus-visible:ring-0 [&>button]:opacity-100 [&>button>svg]:text-white" onOpenAutoFocus={(event) => event.preventDefault()}>
        {isLoading || !run ? (<>
            <SheetHeader className="p-4 pb-0">
              <SheetTitle className="text-white text-base">
                Loading...
              </SheetTitle>
            </SheetHeader>
            <div className="p-6 space-y-4">
              <Skeleton className="h-6 w-48 bg-white/5"/>
              <Skeleton className="h-4 w-32 bg-white/5"/>
              <div className="space-y-3 mt-6">
                {[1, 2, 3].map((i) => (<Skeleton key={i} className="h-20 w-full bg-white/5 rounded-lg"/>))}
              </div>
            </div>
          </>) : (<>
            <SheetHeader className="p-4 pb-0">
              <SheetTitle className="text-white text-base">
                {run.workflow.title}
              </SheetTitle>
              <SheetDescription asChild>
                <div className="flex items-center gap-2 mt-1">
                  <StatusBadge status={effectiveStatus}/>
                  <span className="text-white/40 text-xs">
                    {formatDuration(run.createdAt, run.finishedAt, nowMs)}
                  </span>
                  <span className="text-white/40 text-xs">
                    {timeAgo(run.createdAt, nowMs)}
                  </span>
                </div>
              </SheetDescription>
            </SheetHeader>

            <div className="border-t border-[#333] p-4">
              <h3 className="text-sm font-medium text-white mb-3">Node Runs</h3>
              <div className="space-y-2">
                {run.nodeRuns.length === 0 ? (<p className="text-white/40 text-xs">No nodes executed yet.</p>) : (<AnimatePresence initial={false}>
                    {run.nodeRuns.map((nr, index) => {
                    const liveStatus = liveStatuses[nr.nodeId] || nr.status;
                    return (<motion.div key={nr.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, delay: index * 0.04, ease: [0.25, 0.46, 0.45, 0.94] }} className="rounded-lg border border-[#333] bg-[#141414] p-3">
                          <div className="flex items-center justify-between mb-1">
                            <span className="text-xs text-white/70 font-medium">{nr.nodeType}</span>
                            <span className={`text-xs font-medium transition-colors duration-200 ease ${NODE_STATUS_COLORS[liveStatus] || "text-white/50"}`}>
                              {liveStatus}
                            </span>
                          </div>
                          <div className="text-xs text-white/40 space-y-0.5">
                            <div>ID: {nr.nodeId.slice(0, 8)}...</div>
                            {nr.startedAt && (<div>Duration: {formatDuration(nr.startedAt, nr.completedAt, nowMs)}</div>)}
                            {nr.error && (() => {
                            const [message, hint] = nr.error.split('\nHint: ');
                            return (<div className="text-red-400 mt-1 p-2 bg-red-500/10 rounded border border-red-500/20">
                                  <div className="font-medium mb-1">Error:</div>
                                  <div className="font-mono text-[10px] break-words">{message}</div>
                                  {hint && (<div className="mt-1.5 text-[10px] text-amber-400/90 flex items-start gap-1">
                                      <span className="shrink-0">Hint:</span>
                                      <span>{hint}</span>
                                    </div>)}
                                </div>);
                        })()}
                            {nr.output && liveStatus === "Success" && (<div className="mt-2">
                                <div className="font-medium text-white/60 mb-1">Output:</div>
                                <div className="bg-[#0d0d0d] rounded p-2 border border-[#2a2a2a] max-h-48 overflow-y-auto">
                                  <pre className="text-[10px] font-mono text-white/70 whitespace-pre-wrap wrap-break-word">
                                    {typeof nr.output === "string"
                                ? nr.output
                                : JSON.stringify(nr.output, null, 2)}
                                  </pre>
                                </div>
                              </div>)}
                          </div>
                        </motion.div>);
                })}
                  </AnimatePresence>)}
              </div>
            </div>
          </>)}
      </SheetContent>
    </Sheet>);
}
function ExecutionsPageContent() {
    const searchParams = useSearchParams();
    const isMobile = useIsMobile();
    const shouldReduceMotion = useReducedMotion();
    const [nowMs, setNowMs] = useState(() => Date.now());
    const [statusFilter, setStatusFilter] = useState<StatusFilter>(undefined);
    const [selectedWorkflowId, setSelectedWorkflowId] = useState<string | null>(null);
    const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
    const preselectedWorkflowIdRef = useRef<string | null>(null);
    const preselectedRunIdRef = useRef<string | null>(null);
    const requestedWorkflowId = useMemo(() => {
        const value = searchParams.get('workflowId');
        if (typeof value !== 'string') {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }, [searchParams]);
    const requestedRunId = useMemo(() => {
        const value = searchParams.get('runId');
        if (typeof value !== 'string') {
            return null;
        }
        const trimmed = value.trim();
        return trimmed.length > 0 ? trimmed : null;
    }, [searchParams]);
    const { data: workflowsData, isLoading: workflowsLoading } = trpc.workflow.getAllSummaries.useQuery(undefined, {
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    const workflows = useMemo(() => workflowsData ?? [], [workflowsData]);
    const usage = trpc.execution.getUsage.useQuery(undefined, {
        staleTime: 30000,
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (workflows.length === 0) {
            return;
        }
        if (requestedWorkflowId && preselectedWorkflowIdRef.current !== requestedWorkflowId) {
            preselectedWorkflowIdRef.current = requestedWorkflowId;
            if (workflows.some((workflow) => workflow.id === requestedWorkflowId)) {
                setSelectedWorkflowId(requestedWorkflowId);
                return;
            }
        }
        if (selectedWorkflowId === null) {
            const firstWorkflow = workflows[0];
            if (firstWorkflow) {
                setSelectedWorkflowId(firstWorkflow.id);
            }
        }
    }, [workflows, selectedWorkflowId, requestedWorkflowId]);
    useEffect(() => {
        if (selectedWorkflowId && workflows.length > 0 && !workflows.find(w => w.id === selectedWorkflowId)) {
            const firstWorkflow = workflows[0];
            if (firstWorkflow) {
                setSelectedWorkflowId(firstWorkflow.id);
            }
        }
    }, [workflows, selectedWorkflowId]);
    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage, refetch: refetchRuns, } = trpc.execution.getAll.useInfiniteQuery({ workflowId: selectedWorkflowId ?? undefined, status: statusFilter, limit: 20 }, {
        getNextPageParam: (lastPage) => lastPage.nextCursor,
        enabled: selectedWorkflowId !== null,
    });
    const runs = data?.pages.flatMap((page) => page.runs) ?? [];
    useEffect(() => {
        if (!requestedRunId || preselectedRunIdRef.current === requestedRunId) {
            return;
        }
        if (requestedWorkflowId && selectedWorkflowId !== requestedWorkflowId) {
            return;
        }
        const matchedRun = runs.find((run) => run.id === requestedRunId);
        if (matchedRun) {
            setSelectedRunId(requestedRunId);
            preselectedRunIdRef.current = requestedRunId;
            return;
        }
        if (!isLoading && !hasNextPage) {
            preselectedRunIdRef.current = requestedRunId;
        }
    }, [requestedRunId, requestedWorkflowId, selectedWorkflowId, runs, isLoading, hasNextPage]);
    const hasPendingRuns = runs.some((run) => run.status === "Pending");
    useEffect(() => {
        const timer = window.setInterval(() => {
            setNowMs(Date.now());
        }, 100);
        return () => {
            window.clearInterval(timer);
        };
    }, []);
    useEffect(() => {
        if (!hasPendingRuns)
            return;
        const interval = window.setInterval(() => {
            void refetchRuns();
        }, 2000);
        return () => {
            window.clearInterval(interval);
        };
    }, [hasPendingRuns, refetchRuns]);
    return (<div className="flex flex-col flex-1 min-h-0 -m-4 -mt-4">

      
      <motion.div className="px-4 md:px-6 pt-4 pb-4" initial={shouldReduceMotion ? false : { opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: TIMING.header.duration, ease: EASE_OUT_QUAD }}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-semibold text-white">Executions</h1>
            {usage.data && (<p className="text-sm text-white/50 mt-1">
                {usage.data.runCount} / {usage.data.monthlyRunLimit === -1 ? "Unlimited" : usage.data.monthlyRunLimit.toLocaleString()} executions this month
              </p>)}
          </div>
        </div>

        {usage.data && usage.data.monthlyRunLimit !== -1 && (<div className="w-full md:max-w-[460px] h-1.5 rounded-full bg-white/10 overflow-hidden">
            <div className={`h-full rounded-full transition-[width,background-color] duration-300 ease-in-out ${usage.data.runCount / usage.data.monthlyRunLimit > 0.8
                ? "bg-yellow-500"
                : "bg-[#f04d26]"}`} style={{
                width: `${Math.min((usage.data.runCount / usage.data.monthlyRunLimit) * 100, 100)}%`,
            }}/>
          </div>)}
      </motion.div>

      
      {isMobile && (<MobileWorkflowPills workflows={workflows} isLoading={workflowsLoading} selectedId={selectedWorkflowId} onSelect={setSelectedWorkflowId}/>)}

      
      <div className="flex flex-1 min-h-0">

        
        <motion.div className="hidden md:block w-64 shrink-0 p-2" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
          <div className="h-full min-h-0 overflow-hidden rounded-xl border border-[#333] bg-[#141414]">
            <WorkflowList workflows={workflows} isLoading={workflowsLoading} selectedId={selectedWorkflowId} onSelect={setSelectedWorkflowId}/>
          </div>
        </motion.div>

        
        <motion.div className="flex-1 overflow-y-auto p-4" initial={shouldReduceMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.15 }}>
          
          <div className="flex gap-2 mb-4 overflow-x-auto scrollbar-none">
            {([undefined, "Pending", "Success", "Failure"] as const).map((status) => (<button key={status ?? "all"} onClick={() => setStatusFilter(status)} className={`relative shrink-0 px-3 py-1.5 rounded text-sm transition-colors ${statusFilter === status
                ? "text-white"
                : "text-white/50 hover:text-white hover:bg-white/5"}`}>
                {statusFilter === status && (<motion.div className="absolute inset-0 bg-white/15 rounded" layoutId="execution-status-filter" transition={{ type: "spring", stiffness: 400, damping: 30 }}/>)}
                <span className="relative z-10">{status ?? "All"}</span>
              </button>))}
          </div>

          {selectedWorkflowId ? (<ExecutionTable runs={runs} isLoading={isLoading} hasNextPage={hasNextPage} isFetchingNextPage={isFetchingNextPage} fetchNextPage={fetchNextPage} onSelectRun={setSelectedRunId} isMobile={!!isMobile} selectedWorkflowId={selectedWorkflowId} nowMs={nowMs}/>) : (<motion.div className="text-white/50 text-sm py-8 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2, delay: 0.1 }}>
              Select a workflow to view its executions.
            </motion.div>)}
        </motion.div>
      </div>

      
      <ExecutionDetailSheet runId={selectedRunId} open={selectedRunId !== null} onOpenChange={(open) => { if (!open)
        setSelectedRunId(null); }} nowMs={nowMs}/>
    </div>);
}
function ExecutionsPageFallback() {
    return (<div className="flex flex-col flex-1 min-h-0 -m-4 -mt-4">
      <div className="px-4 md:px-6 pt-4 pb-4">
        <div className="h-8 w-40 rounded bg-white/5 animate-pulse"/>
        <div className="mt-2 h-4 w-60 rounded bg-white/5 animate-pulse"/>
      </div>
      <div className="flex flex-1 min-h-0">
        <div className="hidden md:block w-64 shrink-0 p-2">
          <div className="h-full min-h-0 overflow-hidden rounded-xl border border-[#333] bg-[#141414] p-3 space-y-2">
            {[1, 2, 3, 4].map((item) => (<div key={item} className="h-9 rounded bg-white/5 animate-pulse"/>))}
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {[1, 2, 3, 4, 5].map((item) => (<div key={item} className="h-[56px] rounded-lg bg-white/5 animate-pulse"/>))}
        </div>
      </div>
    </div>);
}
export default function ExecutionsPage() {
    return (<Suspense fallback={<ExecutionsPageFallback />}>
      <ExecutionsPageContent />
    </Suspense>);
}
