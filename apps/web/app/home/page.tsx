'use client';
import React, { useEffect, useState, useMemo } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { EASE_OUT_QUAD, staggerContainer as makeStaggerContainer, staggerItem } from '@/lib/animation/variants';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, } from '@/components/ui/dialog';
import { usePathname, useRouter } from 'next/navigation';
import { CircleHelp, Clock3, GitBranch, Globe, Pencil, Search, Timer, Trash2, Workflow } from 'lucide-react';
import { trpc } from '@/lib/trpc/client';
import { generateWorkflowName } from '@/lib/utils/generateWorkflowName';
import { WORKFLOW_TEMPLATES } from '@/lib/templates/catalog';
const TEMPLATE_NAME_BY_ID = new Map(WORKFLOW_TEMPLATES.map((template) => [template.id, template.name]));
const DEFAULT_VIEWPORT_WIDTH = 1280;
const DEFAULT_VIEWPORT_HEIGHT = 900;
const WORKFLOW_SUMMARY_CACHE_KEY = 'fynt:workflow-summaries:v1';
const WORKFLOW_SUMMARY_CACHE_TTL_MS = 5 * 60000;
type WorkflowSummary = {
    id: string;
    title: string | null;
    createdAt: Date;
    updatedAt: Date;
    nodeCount: number;
    edgeCount: number;
    templateId: string | null;
    triggerTypes: string[];
    lastRunStatus: 'Pending' | 'Success' | 'Failure' | null;
    lastRunAt: Date | null;
};
type CachedWorkflowSummary = Omit<WorkflowSummary, 'createdAt' | 'updatedAt' | 'lastRunAt'> & {
    createdAt: string;
    updatedAt: string;
    lastRunAt: string | null;
};
function isValidCachedWorkflowSummary(workflow: CachedWorkflowSummary): boolean {
    if (!workflow || typeof workflow !== 'object')
        return false;
    if (typeof workflow.id !== 'string' || workflow.id.length === 0)
        return false;
    if (workflow.title !== null && typeof workflow.title !== 'string')
        return false;
    if (typeof workflow.createdAt !== 'string' || Number.isNaN(new Date(workflow.createdAt).getTime()))
        return false;
    if (typeof workflow.updatedAt !== 'string' || Number.isNaN(new Date(workflow.updatedAt).getTime()))
        return false;
    if (typeof workflow.nodeCount !== 'number' || !Number.isFinite(workflow.nodeCount))
        return false;
    if (typeof workflow.edgeCount !== 'number' || !Number.isFinite(workflow.edgeCount))
        return false;
    if (workflow.templateId !== null && typeof workflow.templateId !== 'string')
        return false;
    if (!Array.isArray(workflow.triggerTypes))
        return false;
    if (workflow.lastRunStatus !== null && !['Pending', 'Success', 'Failure'].includes(workflow.lastRunStatus))
        return false;
    if (workflow.lastRunAt !== null && typeof workflow.lastRunAt !== 'string')
        return false;
    return true;
}
function loadWorkflowSummaryCache(): WorkflowSummary[] | null {
    if (typeof window === 'undefined')
        return null;
    try {
        const raw = window.localStorage.getItem(WORKFLOW_SUMMARY_CACHE_KEY);
        if (!raw)
            return null;
        const parsed = JSON.parse(raw) as {
            savedAt?: number;
            workflows?: CachedWorkflowSummary[];
        };
        if (!parsed.savedAt || !Array.isArray(parsed.workflows))
            return null;
        if (Date.now() - parsed.savedAt > WORKFLOW_SUMMARY_CACHE_TTL_MS)
            return null;
        const validWorkflows = parsed.workflows.filter(isValidCachedWorkflowSummary);
        if (validWorkflows.length !== parsed.workflows.length) {
            window.localStorage.removeItem(WORKFLOW_SUMMARY_CACHE_KEY);
            return null;
        }
        return validWorkflows.map((workflow) => ({
            ...workflow,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(workflow.updatedAt),
            lastRunAt: workflow.lastRunAt ? new Date(workflow.lastRunAt) : null,
        }));
    }
    catch {
        return null;
    }
}
function saveWorkflowSummaryCache(workflows: WorkflowSummary[]) {
    if (typeof window === 'undefined')
        return;
    const payload = {
        savedAt: Date.now(),
        workflows: workflows.map((workflow) => ({
            ...workflow,
            createdAt: workflow.createdAt.toISOString(),
            updatedAt: workflow.updatedAt.toISOString(),
            lastRunAt: workflow.lastRunAt?.toISOString() ?? null,
        })),
    };
    window.localStorage.setItem(WORKFLOW_SUMMARY_CACHE_KEY, JSON.stringify(payload));
}
function WorkflowCardIcon() {
    return (<svg aria-hidden="true" width="24px" height="24px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g>
        <path d="M9.6001 3.38541C10.4744 2.88061 10.9116 2.62821 11.3764 2.52942C11.7876 2.44201 12.2126 2.44201 12.6238 2.52942C13.0886 2.62821 13.5258 2.88061 14.4001 3.38541L18.2604 5.61413C19.1347 6.11892 19.5718 6.37132 19.8898 6.72442C20.1711 7.03686 20.3836 7.40493 20.5135 7.80477C20.6604 8.25666 20.6604 8.76146 20.6604 9.77105V14.2285C20.6604 15.2381 20.6604 15.7429 20.5135 16.1948C20.3836 16.5946 20.1711 16.9627 19.8898 17.2751C19.5718 17.6282 19.1347 17.8806 18.2604 18.3854L14.4001 20.6141C13.5258 21.1189 13.0886 21.3713 12.6238 21.4701C12.2126 21.5575 11.7876 21.5575 11.3764 21.4701C10.9116 21.3713 10.4744 21.1189 9.6001 20.6141L5.73984 18.3854C4.86551 17.8806 4.42835 17.6282 4.11041 17.2751C3.8291 16.9627 3.61659 16.5946 3.48667 16.1948C3.33984 15.7429 3.33984 15.2381 3.33984 14.2285V9.77105C3.33984 8.76146 3.33984 8.25666 3.48667 7.80477C3.61659 7.40493 3.8291 7.03686 4.11041 6.72442C4.42835 6.37132 4.86551 6.11892 5.73984 5.61413L9.6001 3.38541Z" stroke="currentColor" strokeWidth="2"></path>
        <path d="M20.6604 7L12.0001 12M12.0001 22V12M3.33984 7L12.0001 12" stroke="currentColor" strokeWidth="2"></path>
        <path d="M7.67188 4.5L16.3321 9.5" stroke="currentColor" strokeWidth="2"></path>
      </g>
    </svg>);
}
function StartBlankIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 18 18" aria-hidden="true">
      <path opacity="0.4" d="M14.7501 9.75H3.25009C2.83599 9.75 2.50009 9.4141 2.50009 9C2.50009 8.5859 2.83599 8.25 3.25009 8.25H14.7501C15.1642 8.25 15.5001 8.5859 15.5001 9C15.5001 9.4141 15.1642 9.75 14.7501 9.75Z" fill="#F7F8F8"/>
      <path d="M9.00009 15.5C8.58599 15.5 8.25009 15.1641 8.25009 14.75V3.25C8.25009 2.8359 8.58599 2.5 9.00009 2.5C9.41419 2.5 9.75009 2.8359 9.75009 3.25V14.75C9.75009 15.1641 9.41419 15.5 9.00009 15.5Z" fill="#F7F8F8"/>
    </svg>);
}
function TemplateOptionIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="16px" height="16px" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M15.5001 12H13.7501V10.25C13.7501 9.8359 13.4142 9.5 13.0001 9.5C12.586 9.5 12.2501 9.8359 12.2501 10.25V12H10.5001C10.086 12 9.75012 12.3359 9.75012 12.75C9.75012 13.1641 10.086 13.5 10.5001 13.5H12.2501V15.25C12.2501 15.6641 12.586 16 13.0001 16C13.4142 16 13.7501 15.6641 13.7501 15.25V13.5H15.5001C15.9142 13.5 16.2501 13.1641 16.2501 12.75C16.2501 12.3359 15.9142 12 15.5001 12Z" fill="#F7F8F8"/>
      <path d="M5.00011 8.25C6.79503 8.25 8.25011 6.79493 8.25011 5C8.25011 3.20507 6.79503 1.75 5.00011 1.75C3.20518 1.75 1.75012 3.20507 1.75012 5C1.75012 6.79493 3.20518 8.25 5.00011 8.25Z" fill="#F7F8F8" fillOpacity="0.4"/>
      <path d="M13.0001 8.25C14.795 8.25 16.2501 6.79493 16.2501 5C16.2501 3.20507 14.795 1.75 13.0001 1.75C11.2052 1.75 9.75012 3.20507 9.75012 5C9.75012 6.79493 11.2052 8.25 13.0001 8.25Z" fill="#F7F8F8" fillOpacity="0.4"/>
      <path d="M5.00011 16.25C6.79503 16.25 8.25011 14.7949 8.25011 13C8.25011 11.2051 6.79503 9.75 5.00011 9.75C3.20518 9.75 1.75012 11.2051 1.75012 13C1.75012 14.7949 3.20518 16.25 5.00011 16.25Z" fill="#F7F8F8" fillOpacity="0.4"/>
    </svg>);
}
const Home = () => {
    const pathname = usePathname();
    const router = useRouter();
    const utils = trpc.useUtils();
    const [page, setPage] = useState(1);
    const [viewportWidth, setViewportWidth] = useState(DEFAULT_VIEWPORT_WIDTH);
    const [viewportHeight, setViewportHeight] = useState(DEFAULT_VIEWPORT_HEIGHT);
    const [search, setSearch] = useState('');
    const [editingWorkflowId, setEditingWorkflowId] = useState<string | null>(null);
    const [editingName, setEditingName] = useState('');
    const [workflowToDelete, setWorkflowToDelete] = useState<{
        id: string;
        title: string;
    } | null>(null);
    const [pendingDeleteWorkflowId, setPendingDeleteWorkflowId] = useState<string | null>(null);
    const [deleteError, setDeleteError] = useState<string | null>(null);
    const [cachedWorkflows, setCachedWorkflows] = useState<WorkflowSummary[] | null>(null);
    const { data: liveWorkflows } = trpc.workflow.getAllSummaries.useQuery(undefined, {
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    useEffect(() => {
        if (liveWorkflows) {
            return;
        }
        const cached = loadWorkflowSummaryCache();
        if (cached) {
            setCachedWorkflows(cached);
        }
    }, [liveWorkflows]);
    useEffect(() => {
        if (!liveWorkflows)
            return;
        const normalizedWorkflows = liveWorkflows.map((workflow) => ({
            ...workflow,
            createdAt: new Date(workflow.createdAt),
            updatedAt: new Date(workflow.updatedAt),
            lastRunAt: workflow.lastRunAt ? new Date(workflow.lastRunAt) : null,
        }));
        setCachedWorkflows(normalizedWorkflows);
        saveWorkflowSummaryCache(normalizedWorkflows);
    }, [liveWorkflows]);
    const workflows = useMemo<WorkflowSummary[]>(() => (liveWorkflows as WorkflowSummary[] | undefined) ?? cachedWorkflows ?? [], [liveWorkflows, cachedWorkflows]);
    useEffect(() => {
        const syncViewportSize = () => {
            setViewportWidth(window.innerWidth);
            setViewportHeight(window.innerHeight);
        };
        syncViewportSize();
        window.addEventListener('resize', syncViewportSize);
        window.addEventListener('pageshow', syncViewportSize);
        return () => {
            window.removeEventListener('resize', syncViewportSize);
            window.removeEventListener('pageshow', syncViewportSize);
        };
    }, []);
    useEffect(() => {
        if (pathname === '/home') {
            setPage(1);
        }
    }, [pathname]);
    const gridColumns = useMemo(() => {
        const width = viewportWidth || DEFAULT_VIEWPORT_WIDTH;
        if (width >= 1280)
            return 4;
        if (width >= 1024)
            return 3;
        if (width >= 768)
            return 2;
        return 1;
    }, [viewportWidth]);
    const pageSize = useMemo(() => {
        const width = viewportWidth || DEFAULT_VIEWPORT_WIDTH;
        const height = viewportHeight || DEFAULT_VIEWPORT_HEIGHT;
        if (width < 768)
            return 6;
        const cardHeight = 152;
        const rowGap = 16;
        const hasWorkflows = workflows.length > 0;
        const reservedHeight = 64 +
            32 +
            88 +
            (hasWorkflows ? 56 : 0) +
            16 +
            44;
        const rowsThatFit = Math.floor((Math.max(cardHeight, height - reservedHeight) + rowGap) / (cardHeight + rowGap));
        const minRows = 1;
        const rows = Math.max(minRows, Math.min(6, rowsThatFit));
        return gridColumns * rows;
    }, [viewportWidth, viewportHeight, workflows.length, gridColumns]);
    const filteredWorkflows = useMemo(() => {
        const query = search.toLowerCase().trim();
        if (!query)
            return workflows;
        return workflows.filter((workflow) => {
            const title = (workflow.title ?? '').toLowerCase();
            const templateName = workflow.templateId
                ? (TEMPLATE_NAME_BY_ID.get(workflow.templateId) ?? '').toLowerCase()
                : '';
            return title.includes(query) || templateName.includes(query);
        });
    }, [workflows, search]);
    const totalPages = Math.max(1, Math.ceil(filteredWorkflows.length / pageSize));
    const currentPage = Math.min(page, totalPages);
const paginatedWorkflows = useMemo(() => filteredWorkflows.slice((currentPage - 1) * pageSize, currentPage * pageSize), [filteredWorkflows, currentPage, pageSize]);
    useEffect(() => {
        if (page > totalPages) {
            setPage(totalPages);
        }
        if (page < 1) {
            setPage(1);
        }
    }, [page, totalPages]);
    useEffect(() => {
        setPage(1);
    }, [search]);
    const createWorkflowMutation = trpc.workflow.create.useMutation({
        onSuccess: () => {
            void Promise.all([
                utils.workflow.getAll.invalidate(),
                utils.workflow.getAllSummaries.invalidate(),
            ]);
        }
    });
    const updateWorkflowMutation = trpc.workflow.update.useMutation({
        onSuccess: () => {
            void Promise.all([
                utils.workflow.getAll.invalidate(),
                utils.workflow.getAllSummaries.invalidate(),
            ]);
        }
    });
    const deleteWorkflowMutation = trpc.workflow.delete.useMutation({
        onMutate: async ({ id: workflowId }) => {
            setDeleteError(null);
            setPendingDeleteWorkflowId(workflowId);
            setWorkflowToDelete(null);
            await Promise.all([
                utils.workflow.getAll.cancel(),
                utils.workflow.getAllSummaries.cancel(),
            ]);
            const previousAll = utils.workflow.getAll.getData();
            const previousSummaries = utils.workflow.getAllSummaries.getData();
            const previousCachedWorkflows = cachedWorkflows;
            const previousCacheRaw = typeof window !== 'undefined'
                ? window.localStorage.getItem(WORKFLOW_SUMMARY_CACHE_KEY)
                : null;
            utils.workflow.getAll.setData(undefined, (old) => old ? old.filter((workflow) => workflow.id !== workflowId) : old);
            utils.workflow.getAllSummaries.setData(undefined, (old) => old ? old.filter((workflow) => workflow.id !== workflowId) : old);
            utils.workflow.getById.setData({ id: workflowId }, () => undefined);
            setCachedWorkflows((previous) => {
                if (!previous)
                    return previous;
                const next = previous.filter((workflow) => workflow.id !== workflowId);
                saveWorkflowSummaryCache(next);
                return next;
            });
            const cachedLocalSummaries = loadWorkflowSummaryCache();
            if (cachedLocalSummaries) {
                const next = cachedLocalSummaries.filter((workflow) => workflow.id !== workflowId);
                saveWorkflowSummaryCache(next);
            }
            return {
                workflowId,
                previousAll,
                previousSummaries,
                previousCachedWorkflows,
                previousCacheRaw,
            };
        },
        onError: (error, _input, context) => {
            if (context) {
                utils.workflow.getAll.setData(undefined, context.previousAll);
                utils.workflow.getAllSummaries.setData(undefined, context.previousSummaries);
                setCachedWorkflows(context.previousCachedWorkflows);
                if (typeof window !== 'undefined') {
                    if (context.previousCacheRaw === null) {
                        window.localStorage.removeItem(WORKFLOW_SUMMARY_CACHE_KEY);
                    }
                    else {
                        window.localStorage.setItem(WORKFLOW_SUMMARY_CACHE_KEY, context.previousCacheRaw);
                    }
                }
            }
            setDeleteError(error instanceof Error ? error.message : 'Failed to delete workflow. Please try again.');
        },
        onSettled: async () => {
            setPendingDeleteWorkflowId(null);
            await Promise.all([
                utils.workflow.getAll.invalidate(),
                utils.workflow.getAllSummaries.invalidate(),
            ]);
        },
    });
    const handleCreateWorkflow = () => {
        const newId = crypto.randomUUID();
        const randomName = generateWorkflowName();
        const now = new Date();
        const optimisticWorkflow = {
            id: newId,
            title: randomName,
            userId: "",
            nodes: [] as unknown[],
            edges: [] as unknown[],
            trigger: { metadata: {} as unknown, type: { id: "manual", name: "manual", image: "" } } as never,
            actions: [] as never[],
            createdAt: now,
            updatedAt: now,
        };
        utils.workflow.getById.setData({ id: newId }, optimisticWorkflow);
        const summaryItem = {
            id: newId,
            title: randomName,
            createdAt: now,
            updatedAt: now,
            nodeCount: 0,
            edgeCount: 0,
            templateId: null as string | null,
            triggerTypes: [] as string[],
            lastRunStatus: null as 'Pending' | 'Success' | 'Failure' | null,
            lastRunAt: null as Date | null,
        };
        utils.workflow.getAllSummaries.setData(undefined, (previous) => {
            if (!previous || previous.length === 0) return [summaryItem];
            return [summaryItem, ...previous.filter((w) => w.id !== newId)];
        });
        setCachedWorkflows((prev) => {
            const next = prev ? [summaryItem, ...prev.filter((w) => w.id !== newId)] : [summaryItem];
            saveWorkflowSummaryCache(next);
            return next;
        });
        router.push(`/home/workflows/${newId}`);
        createWorkflowMutation.mutate(
            {
                id: newId,
                title: randomName,
                availableTriggerId: 'manual',
                triggerMetadata: {},
                actions: [],
                nodes: [],
                edges: [],
            },
            {
                onError: (error) => {
                    console.error('Failed to create workflow:', error);
                    utils.workflow.getById.invalidate({ id: newId });
                },
            }
        );
    };
    const handleDeleteWorkflow = async (workflowId: string) => {
        try {
            await deleteWorkflowMutation.mutateAsync({ id: workflowId });
        }
        catch (error) {
            console.error('Failed to delete workflow:', error);
        }
    };
    const handleEditName = (workflowId: string, currentName: string | null, e: React.MouseEvent) => {
        e.stopPropagation();
        setEditingWorkflowId(workflowId);
        setEditingName(currentName ?? '');
    };
    const handleSaveNameEdit = async (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && editingWorkflowId && editingName.trim()) {
            try {
                await updateWorkflowMutation.mutateAsync({
                    id: editingWorkflowId,
                    title: editingName.trim()
                });
                setEditingWorkflowId(null);
                setEditingName('');
            }
            catch (error) {
                console.error('Failed to update workflow name:', error);
            }
        }
        else if (e.key === 'Escape') {
            setEditingWorkflowId(null);
            setEditingName('');
        }
    };
    const formatRelativeTime = (date: Date | string) => {
        const now = new Date();
        const then = new Date(date);
        const diffMs = now.getTime() - then.getTime();
        const diffSeconds = Math.floor(diffMs / 1000);
        const diffMinutes = Math.floor(diffSeconds / 60);
        const diffHours = Math.floor(diffMinutes / 60);
        const diffDays = Math.floor(diffHours / 24);
        const diffWeeks = Math.floor(diffDays / 7);
        const diffMonths = Math.floor(diffDays / 30);
        const diffYears = Math.floor(diffDays / 365);
        if (diffSeconds < 60)
            return 'just now';
        if (diffMinutes < 60)
            return `${diffMinutes}m ago`;
        if (diffHours < 24)
            return `${diffHours}h ago`;
        if (diffDays < 7)
            return `${diffDays}d ago`;
        if (diffWeeks < 4)
            return `${diffWeeks}w ago`;
        if (diffMonths < 12)
            return `${diffMonths}mo ago`;
        return `${diffYears}y ago`;
    };
    return (<div className="flex-1 flex flex-col">
      <motion.div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2, ease: EASE_OUT_QUAD }}>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Workflows</h1>
          <p className="text-sm text-muted-foreground">
            Manage and create your workflow automations
          </p>
        </div>
        {workflows.length > 0 && (<Button onClick={handleCreateWorkflow} disabled={createWorkflowMutation.isPending} className="bg-brand hover:bg-brand-hover text-white active:scale-[0.97] transition-transform duration-100 ease-out">
            <span className="mr-2 inline-flex items-center justify-center">
              <StartBlankIcon />
            </span>
            {createWorkflowMutation.isPending ? 'Creating...' : 'Create Workflow'}
          </Button>)}
      </motion.div>

      {workflows.length > 0 && (<div className="mb-4">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40"/>
            <input type="text" placeholder="Search workflows..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors"/>
          </div>
        </div>)}

      {deleteError && (<div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
          {deleteError}
        </div>)}

      {workflows.length === 0 ? (<Card className="min-h-[520px] rounded-none border-0 bg-transparent p-0 shadow-none">
          <motion.div className="flex min-h-[520px] flex-col items-center justify-center px-6 py-14 text-center" variants={makeStaggerContainer(0.07, 0.1)} initial="hidden" animate="show">
            <motion.div variants={{ ...staggerItem, hidden: { opacity: 0, y: 12, scale: 0.9 }, show: { ...staggerItem.show, scale: 1 } }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="64px" height="64px" viewBox="0 0 18 18" className="mb-6" aria-hidden="true">
                <path fillRule="evenodd" clipRule="evenodd" d="M2 7.25C2 5.73128 3.23069 4.5 4.75 4.5H13.25C14.7693 4.5 16 5.73128 16 7.25V13.25C16 14.7687 14.7693 16 13.25 16H4.75C3.23069 16 2 14.7687 2 13.25V7.25Z" fill="#F7F8F8" fillOpacity="0.4"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M4.5 12.75C4.5 12.3358 4.83579 12 5.25 12H7.25C7.66421 12 8 12.3358 8 12.75C8 13.1642 7.66421 13.5 7.25 13.5H5.25C4.83579 13.5 4.5 13.1642 4.5 12.75Z" fill="#F7F8F8"/>
                <path d="M15.6445 5.89654C15.1723 5.06272 14.2771 4.5 13.25 4.5H4.75C3.71996 4.5 2.82259 5.06594 2.35143 5.9037L3.77709 3.0288C4.24151 2.09309 5.1956 1.5 6.241 1.5H11.759C12.8044 1.5 13.7584 2.09285 14.2228 3.02856L15.6445 5.89654Z" fill="#F7F8F8"/>
                <path fillRule="evenodd" clipRule="evenodd" d="M9.00002 3.5C9.41423 3.5 9.75002 3.83579 9.75002 4.25V7.25C9.75002 7.66421 9.41423 8 9.00002 8C8.5858 8 8.25002 7.66421 8.25002 7.25V4.25C8.25002 3.83579 8.5858 3.5 9.00002 3.5Z" fill="#F7F8F8"/>
              </svg>
            </motion.div>

            <motion.h3 className="mb-2 text-2xl font-semibold text-foreground" variants={staggerItem}>No workflows yet</motion.h3>
            <motion.p className="mb-6 max-w-md text-sm text-muted-foreground" variants={staggerItem}>
              Create your first workflow automation to get started
            </motion.p>

            <motion.div className="mt-2 grid w-full max-w-xl gap-2 sm:grid-cols-2" variants={staggerItem}>
              <button onClick={handleCreateWorkflow} disabled={createWorkflowMutation.isPending} className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/80">
                  <StartBlankIcon />
                </span>
                <span>
                  <p className="text-sm font-semibold text-foreground">Start Blank</p>
                  <p className="text-xs text-muted-foreground">Build a workflow from scratch</p>
                </span>
              </button>

              <button onClick={() => router.push('/home/templates')} className="group flex items-start gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 text-left transition-colors hover:border-white/20 hover:bg-white/[0.05]">
                <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/5 text-white/80">
                  <TemplateOptionIcon />
                </span>
                <span>
                  <p className="text-sm font-semibold text-foreground">Use Template</p>
                  <p className="text-xs text-muted-foreground">Pick from ready-made automations</p>
                </span>
              </button>
            </motion.div>
          </motion.div>
        </Card>) : filteredWorkflows.length === 0 ? (<motion.div className="py-8 text-sm text-white/50 text-center" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          No workflows match your search.
        </motion.div>) : (<motion.div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" layout>
          <AnimatePresence mode="popLayout">
          {paginatedWorkflows.map((workflow, index) => (<motion.div key={workflow.id} layout initial={{ opacity: 0, y: 16, scale: 0.97 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 8, scale: 0.97 }} whileHover={{ y: -4, transition: { type: "spring", stiffness: 400, damping: 30 } }} whileTap={{ scale: 0.985, transition: { duration: 0.1, ease: "easeOut" } }} transition={{
                    duration: 0.22,
                    ease: EASE_OUT_QUAD,
                    delay: Math.min(index, 7) * 0.04,
                }}>
            {(() => {
                    const templateSourceName = workflow.templateId ? TEMPLATE_NAME_BY_ID.get(workflow.templateId) : null;
                    const isDeletingWorkflow = pendingDeleteWorkflowId === workflow.id;
                    return (<Card className="relative flex h-auto cursor-pointer flex-col gap-0 overflow-hidden border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0.005))] p-4 shadow-[0_4px_24px_-1px_rgba(0,0,0,0.24),0_2px_8px_-1px_rgba(0,0,0,0.12)] transition-[border-color,box-shadow] duration-300 ease-out hover:border-white/20 hover:shadow-[0_12px_32px_-2px_rgba(0,0,0,0.35),0_4px_12px_-2px_rgba(0,0,0,0.2)] group" onClick={() => {
                            if (isDeletingWorkflow)
                                return;
                            setPage(1);
                            router.push(`/home/workflows/${workflow.id}`);
                        }}>
              <div className="absolute right-4 top-4 z-10 flex items-center gap-1 opacity-0 -translate-y-1 transition-[opacity,transform] duration-200 group-hover:opacity-100 group-hover:translate-y-0">
                <button onClick={(e) => handleEditName(workflow.id, workflow.title, e)} className="rounded-md p-1.5 text-white/45 transition-colors hover:bg-white/10 hover:text-brand" disabled={isDeletingWorkflow} title="Edit name">
                  <Pencil className="h-4 w-4"/>
                </button>
                <button onClick={(e) => {
                            e.stopPropagation();
                            setWorkflowToDelete({
                                id: workflow.id,
                                title: workflow.title || 'Untitled Workflow',
                            });
                        }} className="rounded-md p-1.5 text-white/45 transition-colors hover:bg-red-500/15 hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-40" disabled={isDeletingWorkflow} title="Delete">
                  <Trash2 className="h-4 w-4"/>
                </button>
              </div>
              
              {editingWorkflowId === workflow.id ? (<input type="text" value={editingName} onChange={(e) => setEditingName(e.target.value)} onKeyDown={handleSaveNameEdit} onBlur={() => {
                                setEditingWorkflowId(null);
                                setEditingName('');
                            }} autoFocus onClick={(e) => e.stopPropagation()} className="mb-3 w-full border-b border-brand bg-transparent pr-16 text-lg font-semibold text-foreground outline-none"/>) : (<div className="mb-2 flex items-start gap-2.5 pr-14">
                  <motion.span className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/75" whileHover={{ rotate: 8, scale: 1.08 }} transition={{ type: "spring", stiffness: 350, damping: 20 }}>
                    <WorkflowCardIcon />
                  </motion.span>
                  <div className="min-w-0 pt-0.5">
                    <h3 className="truncate text-lg font-semibold leading-tight text-foreground transition-colors group-hover:text-white" title={workflow.title || 'Untitled Workflow'}>
                      {workflow.title || 'Untitled Workflow'}
                    </h3>
                    <div className="mt-1 flex items-center gap-x-2 whitespace-nowrap text-xs font-medium text-white/55 md:flex-col md:items-start md:gap-y-0.5 xl:flex-row xl:items-center xl:gap-y-0">
                      <span className="inline-flex items-center gap-1">
                        <Clock3 className="h-3 w-3 text-white/40"/>
                        Updated {formatRelativeTime(workflow.updatedAt)}
                      </span>
                      <span className="h-1 w-1 rounded-full bg-white/25 md:hidden xl:block"/>
                      <span>Created {formatRelativeTime(workflow.createdAt)}</span>
                    </div>
                    <div className="mt-1 flex min-h-5 flex-wrap items-center gap-1.5">
                      <span className={templateSourceName
                                ? "inline-flex shrink-0 whitespace-nowrap items-center rounded-md border border-brand/25 bg-brand/10 px-2 py-0.5 text-[10px] font-semibold text-brand"
                                : "inline-flex shrink-0 whitespace-nowrap items-center rounded-md border border-white/15 bg-white/5 px-2 py-0.5 text-[10px] font-semibold text-white/65"}>
                        {templateSourceName ? "From template" : "Custom"}
                      </span>
                      {workflow.lastRunStatus != null && workflow.triggerTypes.includes('cronTrigger') && (
                        <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-sky-400/20 bg-sky-400/10 px-2 py-0.5 text-[10px] font-semibold text-sky-400">
                          <Timer className="h-2.5 w-2.5" />Cron
                        </span>
                      )}
                      {workflow.lastRunStatus != null && workflow.triggerTypes.includes('webhookTrigger') && (
                        <span className="inline-flex shrink-0 whitespace-nowrap items-center gap-1 rounded-md border border-violet-400/20 bg-violet-400/10 px-2 py-0.5 text-[10px] font-semibold text-violet-400">
                          <Globe className="h-2.5 w-2.5" />Webhook
                        </span>
                      )}
                    </div>
                  </div>
                </div>)}

              <div className="my-3 h-px w-full bg-white/8"/>

              {(() => {
                const hasAutomatedTrigger = workflow.triggerTypes.includes('cronTrigger') || workflow.triggerTypes.includes('webhookTrigger');
                return (
                  <div className={`mb-0 grid gap-2 ${hasAutomatedTrigger ? 'grid-cols-3' : 'grid-cols-2'}`}>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Nodes</span>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
                        <Workflow className="h-4 w-4 text-white/45"/>
                        {workflow.nodeCount}
                      </div>
                    </div>
                    <div className="flex flex-col gap-1 border-l border-white/10 pl-3">
                      <span className="text-[10px] font-semibold uppercase tracking-wider text-white/45">Edges</span>
                      <div className="flex items-center gap-1.5 text-sm font-semibold text-white/80">
                        <GitBranch className="h-4 w-4 text-white/45"/>
                        {workflow.edgeCount}
                      </div>
                    </div>
                    {hasAutomatedTrigger && (
                      <div className="flex flex-col gap-1 border-l border-white/10 pl-3">
                        <span className="flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider text-white/45">
                          Status
                          <span className="group/tip relative cursor-help">
                            <CircleHelp className="h-3 w-3 text-white/30 transition-colors hover:text-white/60" />
                            <span className="pointer-events-none absolute bottom-full right-0 z-20 mb-1.5 whitespace-nowrap rounded-md bg-white/10 px-2.5 py-1.5 text-[10px] font-medium normal-case tracking-normal text-white/80 opacity-0 backdrop-blur-md transition-opacity group-hover/tip:opacity-100">
                              Status of latest cron or webhook run
                            </span>
                          </span>
                        </span>
                        {workflow.lastRunStatus != null ? (
                          <div className="flex items-center gap-1.5 text-sm font-semibold">
                            <span className={
                              workflow.lastRunStatus === 'Success'
                                ? "relative inline-block h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.5)] before:absolute before:inset-0 before:animate-[status-pulse_2s_ease-out_infinite] before:rounded-full before:bg-emerald-400"
                                : workflow.lastRunStatus === 'Failure'
                                  ? "inline-block h-2 w-2 rounded-full bg-red-400 shadow-[0_0_6px_rgba(248,113,113,0.5)]"
                                  : "relative inline-block h-2 w-2 rounded-full bg-amber-400 shadow-[0_0_6px_rgba(251,191,36,0.5)] before:absolute before:inset-0 before:animate-[status-pulse_2s_ease-out_infinite] before:rounded-full before:bg-amber-400"
                            } />
                            <span className={
                              workflow.lastRunStatus === 'Success'
                                ? "text-sm text-emerald-400/90"
                                : workflow.lastRunStatus === 'Failure'
                                  ? "text-sm text-red-400/90"
                                  : "text-sm text-amber-400/90"
                            }>
                              {workflow.lastRunStatus === 'Pending' ? 'Running' : workflow.lastRunStatus === 'Success' ? 'Active' : 'Failed'}
                            </span>
                          </div>
                        ) : (
                          <span className="text-sm font-semibold text-white/30">—</span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })()}
            </Card>);
                })()}
            </motion.div>))}
          </AnimatePresence>
        </motion.div>)}

      <div className="mt-auto flex w-full flex-col gap-3 pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center justify-end gap-2">
          <Button variant="outline" className="text-white" size="sm" disabled={currentPage <= 1} onClick={() => setPage((prev) => Math.max(1, prev - 1))}>
            Previous
          </Button>
          <Button variant="outline" className="text-white" size="sm" disabled={currentPage >= totalPages} onClick={() => setPage((prev) => Math.min(totalPages, prev + 1))}>
            Next
          </Button>
        </div>
      </div>

      <Dialog open={!!workflowToDelete} onOpenChange={(open) => !open && setWorkflowToDelete(null)}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Workflow</DialogTitle>
            <DialogDescription>
              Delete <span className="font-medium text-white">{workflowToDelete?.title}</span>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={() => setWorkflowToDelete(null)} className="text-grey-500 hover:text-black hover:bg-white/80" disabled={deleteWorkflowMutation.isPending}>
              Cancel
            </Button>
            <Button onClick={async () => {
            if (!workflowToDelete)
                return;
            await handleDeleteWorkflow(workflowToDelete.id);
        }} disabled={deleteWorkflowMutation.isPending} className="bg-red-600 hover:bg-red-700 text-white">
              {deleteWorkflowMutation.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>);
};
export default Home;
