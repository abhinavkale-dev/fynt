"use client";
import { useMemo, useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, CircleHelp, Search } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc/client";
import { WORKFLOW_TEMPLATES } from "@/lib/templates/catalog";
import { getTemplateBindingKey, instantiateTemplateGraph, type CredentialBinding, } from "@/lib/templates/instantiate";
import { NODE_UI } from "@/lib/nodeUI";
import { getNodeDef } from "@repo/shared";
import { TEMPLATE_CATEGORY_LABELS, type TemplateCategory, } from "@/lib/templates/types";
const TIMING = {
    headerDuration: 0.2,
    cardStagger: 0.06,
    cardDelayStart: 0.15,
};
const CARD = {
    spring: { type: "spring" as const, stiffness: 300, damping: 24 },
    hoverSpring: { type: "spring" as const, stiffness: 400, damping: 25 },
};
const TAB = {
    enter: { opacity: 0 },
    center: { opacity: 1 },
    exit: { opacity: 0 },
    transition: { duration: 0.12 },
};
const cardContainer = {
    hidden: {},
    show: { transition: { staggerChildren: TIMING.cardStagger, delayChildren: TIMING.cardDelayStart } },
};
const cardItem = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show: { opacity: 1, y: 0, scale: 1, transition: CARD.spring },
};
const ALL_CATEGORIES: (TemplateCategory | "all")[] = [
    "all",
    ...Object.keys(TEMPLATE_CATEGORY_LABELS) as TemplateCategory[],
];
const categoryLabels: Record<string, string> = {
    all: "All",
    ...TEMPLATE_CATEGORY_LABELS,
};
function escapeRegExp(value: string): string {
    return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
function getNextTemplateWorkflowTitle(baseTitle: string, workflows: Array<{
    title: string | null;
}>): string {
    const escapedBase = escapeRegExp(baseTitle.trim());
    const matchPattern = new RegExp(`^${escapedBase}(?:\\s#(\\d+))?$`);
    let maxIndex = 0;
    for (const workflow of workflows) {
        const title = (workflow.title ?? "").trim();
        const match = title.match(matchPattern);
        if (!match)
            continue;
        if (match[1]) {
            const parsed = Number.parseInt(match[1], 10);
            if (Number.isFinite(parsed)) {
                maxIndex = Math.max(maxIndex, parsed);
            }
        }
        else {
            maxIndex = Math.max(maxIndex, 1);
        }
    }
    return maxIndex === 0 ? baseTitle : `${baseTitle} #${maxIndex + 1}`;
}
function SetupTimeIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 18 18" aria-hidden="true">
      <path d="M9.00006 1V9L3.3432 3.34317C4.79092 1.89545 6.79095 1 9.00006 1C9.00007 1 9.00005 1 9.00006 1Z" fill="#F7F8F8" fillOpacity="0.2"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M9 1C4.58179 1 1 4.58179 1 9C1 13.4182 4.58179 17 9 17C13.4182 17 17 13.4182 17 9C17 4.58181 13.4182 1.00003 9 1C9.00002 1 8.99998 1 9 1ZM9 1C6.79089 1 4.79092 1.89545 3.3432 3.34317L9.00006 9L9 1Z" fill="#F7F8F8" fillOpacity="0.4"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L9.53033 8.46967C9.82322 8.76256 9.82322 9.23744 9.53033 9.53033C9.23744 9.82322 8.76256 9.82322 8.46967 9.53033L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z" fill="#F7F8F8"/>
    </svg>);
}
function NodeCountIcon() {
    return (<svg xmlns="http://www.w3.org/2000/svg" width="14px" height="14px" viewBox="0 0 18 18" aria-hidden="true">
      <path fillRule="evenodd" clipRule="evenodd" d="M6.50781 3.75C6.50781 2.3689 7.62671 1.25 9.00781 1.25C10.3889 1.25 11.5078 2.3689 11.5078 3.75C11.5078 5.1311 10.3889 6.25 9.00781 6.25C7.62671 6.25 6.50781 5.1311 6.50781 3.75Z" fill="#F7F8F8"/>
      <path d="M11.2991 4.75188C12.6788 5.38813 13.7509 6.57959 14.228 8.03861C14.3568 8.4323 14.7803 8.64709 15.174 8.51835C15.5677 8.38961 15.7825 7.96609 15.6537 7.57239C14.9915 5.54733 13.4324 3.9301 11.4446 3.18878C11.4859 3.36918 11.5078 3.55703 11.5078 3.75C11.5078 4.10632 11.4333 4.44518 11.2991 4.75188Z" fill="#F7F8F8" fillOpacity="0.4"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M11.696 12.75C11.696 11.3689 12.8149 10.25 14.196 10.25C15.5771 10.25 16.696 11.3689 16.696 12.75C16.696 14.1311 15.5771 15.25 14.196 15.25C12.8149 15.25 11.696 14.1311 11.696 12.75Z" fill="#F7F8F8"/>
      <path d="M12.1854 14.2362C10.9428 15.1175 9.37078 15.4517 7.86472 15.1337C7.45945 15.0481 7.06153 15.3072 6.97593 15.7125C6.89034 16.1178 7.1495 16.5157 7.55477 16.6013C9.64416 17.0426 11.8294 16.4991 13.4672 15.1421C12.9481 14.9843 12.5007 14.6621 12.1854 14.2362Z" fill="#F7F8F8" fillOpacity="0.4"/>
      <path fillRule="evenodd" clipRule="evenodd" d="M1.31934 12.75C1.31934 11.3689 2.43823 10.25 3.81934 10.25C5.20044 10.25 6.31934 11.3689 6.31934 12.75C6.31934 14.1311 5.20044 15.25 3.81934 15.25C2.43823 15.25 1.31934 14.1311 1.31934 12.75Z" fill="#F7F8F8"/>
      <path d="M4.90389 6.07739C5.18047 5.76904 5.15471 5.29487 4.84636 5.01829C4.53801 4.74172 4.06384 4.76747 3.78726 5.07582C2.35956 6.66754 1.73943 8.83649 2.09963 10.9352C2.4803 10.5743 2.97448 10.3321 3.52317 10.2673C3.38111 8.75132 3.87666 7.22263 4.90389 6.07739Z" fill="#F7F8F8" fillOpacity="0.4"/>
    </svg>);
}
interface TemplateCardProps {
    template: (typeof WORKFLOW_TEMPLATES)[0];
    isCreating: boolean;
    mutationPending: boolean;
    onUseTemplate: (templateId: string) => void;
}
function TemplateCard({ template, isCreating, mutationPending, onUseTemplate }: TemplateCardProps) {
    const [showHighlights, setShowHighlights] = useState(false);
    const [hoveredHighlights, setHoveredHighlights] = useState(false);
    const [openOverflow, setOpenOverflow] = useState<"integrations" | "credentials" | null>(null);
    const [hoveredOverflow, setHoveredOverflow] = useState<"integrations" | "credentials" | null>(null);
    const integrationColRef = useRef<HTMLDivElement>(null);
    const [colWidth, setColWidth] = useState(153);
    useEffect(() => {
        const el = integrationColRef.current;
        if (!el) return;
        const ro = new ResizeObserver(([entry]) => {
            if (entry) setColWidth(entry.contentRect.width);
        });
        ro.observe(el);
        return () => ro.disconnect();
    }, []);
    const uniqueNodeTypes = Array.from(new Set(template.nodes.map((n) => n.type)));
    // Icon row: first icon 32px, each subsequent adds 26px (32 - 6px overlap from -space-x-1.5),
    // overflow pill also adds 26px. Total for N icons + pill = 32 + N*26.
    // Solve for N: maxIcons = floor((colWidth - 32) / 26)
    const maxIcons = Math.max(1, Math.min(uniqueNodeTypes.length, Math.floor((colWidth - 32) / 26)));
    const visibleNodeTypes = uniqueNodeTypes.length > maxIcons ? uniqueNodeTypes.slice(0, maxIcons) : uniqueNodeTypes;
    const hiddenNodeCount = Math.max(0, uniqueNodeTypes.length - visibleNodeTypes.length);
    const hiddenIntegrationLabels = uniqueNodeTypes.slice(visibleNodeTypes.length).map((t) => getNodeDef(t)?.label ?? t);
    // Credential pills: avg pill ~68px + 8px gap = 76px each, overflow pill ~40px.
    // Total for N pills + overflow = N*76 + 40. Solve: maxCredentials = floor((colWidth - 40) / 76)
    const maxCredentials = Math.max(1, Math.floor((colWidth - 40) / 76));
    const visibleCredentials = template.requiredCredentials.slice(0, maxCredentials);
    const hiddenCredentialCount = Math.max(0, template.requiredCredentials.length - visibleCredentials.length);
    const hiddenCredentials = template.requiredCredentials.slice(visibleCredentials.length);
    const isHighlightsVisible = showHighlights || hoveredHighlights;
    const isIntegrationOverflowVisible = openOverflow === "integrations" || hoveredOverflow === "integrations";
    const isCredentialOverflowVisible = openOverflow === "credentials" || hoveredOverflow === "credentials";
    return (<motion.div className="h-full" variants={cardItem} whileHover={{ y: -4, transition: CARD.hoverSpring }}>
        <Card className="mx-auto flex h-full w-full max-w-[370px] flex-col gap-0 overflow-visible rounded-2xl border border-[#333] bg-card p-0 text-foreground shadow-[0_20px_40px_-12px_rgba(0,0,0,0.35)] transition-shadow duration-200 hover:shadow-[0_22px_44px_-12px_rgba(0,0,0,0.45)] md:mx-0 md:max-w-none">
          <div className="flex-1 p-6">
            <div className="mb-1 flex items-start justify-between gap-3">
              <div className="min-w-0 pr-2">
                <h2 className="truncate text-xl font-bold leading-tight text-foreground">{template.name}</h2>
              </div>
              <div className="relative mt-0.5 shrink-0" onMouseEnter={() => setHoveredHighlights(true)} onMouseLeave={() => setHoveredHighlights(false)}>
                <button type="button" aria-label="Show template highlights" aria-expanded={isHighlightsVisible} onClick={() => setShowHighlights((prev) => !prev)} className="inline-flex h-6 w-6 items-center justify-center rounded-full border border-white/15 bg-white/5 text-white/70 transition-colors hover:bg-white/10 hover:text-white">
                  <CircleHelp className="h-4 w-4"/>
                </button>
                <AnimatePresence>
                  {isHighlightsVisible && template.highlights.length > 0 && (<motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute right-0 top-8 z-20 w-52 rounded-lg border border-white/10 bg-[#1b1b1b] p-3 shadow-2xl">
                      <ul className="space-y-1.5">
                        {template.highlights.slice(0, 3).map((highlight) => (<li key={highlight} className="text-xs text-white/80">• {highlight}</li>))}
                      </ul>
                    </motion.div>)}
                </AnimatePresence>
              </div>
            </div>
            <p className="mb-6 min-h-[72px] text-[13px] leading-6 text-muted-foreground [display:-webkit-box] [-webkit-line-clamp:3] [-webkit-box-orient:vertical] overflow-hidden">
              {template.description}
            </p>
            <div className="mb-6 w-full border-t border-dashed border-white/10"/>
            <div className="mb-6 grid grid-cols-2 gap-2.5">
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#25272c] text-white/60">
                  <SetupTimeIcon />
                </div>
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45">Setup Time</p>
                  <p className="text-[12px] font-semibold leading-4 text-foreground">~{template.estimatedSetupMinutes} mins</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="flex h-6 w-6 items-center justify-center rounded-md bg-[#25272c] text-white/60">
                  <NodeCountIcon />
                </div>
                <div>
                  <p className="text-[8px] font-semibold uppercase tracking-[0.14em] text-white/45">Node count</p>
                  <p className="text-[12px] font-semibold leading-4 text-foreground">{template.nodes.length} Nodes</p>
                </div>
              </div>
            </div>
            <div className="mb-2 grid grid-cols-2 gap-4">
              <div className="min-w-0" ref={integrationColRef}>
                <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-white/45">Integrations</p>
                <div className="flex items-center -space-x-1.5">
                  {visibleNodeTypes.map((nodeType, index) => {
                    const ui = NODE_UI[nodeType];
                    const def = getNodeDef(nodeType);
                    return (<span key={nodeType} className="z-10 inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3d42] bg-[#24262b] text-white/90 shadow-[0_0_0_2px_#151515]" style={{ zIndex: 40 - index }} title={def?.label ?? nodeType}>
                        {ui?.icon ?? (<span className="text-[10px] font-bold text-white/70">{(def?.label ?? nodeType).slice(0, 1)}</span>)}
                      </span>);
                  })}
                  {hiddenNodeCount > 0 && (<div className="relative z-0" onMouseEnter={() => setHoveredOverflow("integrations")} onMouseLeave={() => setHoveredOverflow(null)}>
                      <button type="button" aria-label={`Show ${hiddenNodeCount} more integration${hiddenNodeCount === 1 ? "" : "s"}`} aria-expanded={isIntegrationOverflowVisible} onClick={() => setOpenOverflow((prev) => (prev === "integrations" ? null : "integrations"))} className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-[#3a3d42] bg-[#2a2c31] text-[10px] font-bold text-white/75 shadow-[0_0_0_2px_#151515] transition-colors hover:text-white" title={`${hiddenNodeCount} more node type${hiddenNodeCount === 1 ? "" : "s"}`}>
                        +{hiddenNodeCount}
                      </button>
                      <AnimatePresence>
                        {isIntegrationOverflowVisible && (<motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute left-0 top-10 z-30 min-w-40 rounded-lg border border-white/10 bg-[#1b1b1b] p-2.5 shadow-2xl">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">More Integrations</p>
                            <ul className="space-y-1">
                              {hiddenIntegrationLabels.map((label) => (<li key={label} className="text-xs text-white/80">• {label}</li>))}
                            </ul>
                          </motion.div>)}
                      </AnimatePresence>
                    </div>)}
                </div>
              </div>
              <div className="min-w-0">
                <div className="relative mb-3 flex items-center">
                  <p className="text-xs font-semibold uppercase tracking-wider text-white/45">Required Credentials</p>
                </div>
                <div className="flex items-center gap-2">
                  {template.requiredCredentials.length === 0 ? (<span className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 shadow-sm">None</span>) : (visibleCredentials.map((credential) => (<span key={credential} className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2.5 py-1 text-xs font-medium text-white/70 shadow-sm">{credential}</span>)))}
                  {hiddenCredentialCount > 0 && (<div className="relative" onMouseEnter={() => setHoveredOverflow("credentials")} onMouseLeave={() => setHoveredOverflow(null)}>
                      <button type="button" aria-label={`Show ${hiddenCredentialCount} more credential${hiddenCredentialCount === 1 ? "" : "s"}`} aria-expanded={isCredentialOverflowVisible} onClick={() => setOpenOverflow((prev) => (prev === "credentials" ? null : "credentials"))} className="inline-flex items-center rounded-md border border-white/10 bg-white/5 px-2 py-1 text-xs font-medium text-white/70 shadow-sm transition-colors hover:text-white" title={`${hiddenCredentialCount} more credential${hiddenCredentialCount === 1 ? "" : "s"}`}>
                        +{hiddenCredentialCount}
                      </button>
                      <AnimatePresence>
                        {isCredentialOverflowVisible && (<motion.div initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: -4 }} transition={{ duration: 0.15, ease: "easeOut" }} className="absolute left-0 top-9 z-30 min-w-40 rounded-lg border border-white/10 bg-[#1b1b1b] p-2.5 shadow-2xl">
                            <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-[0.12em] text-white/45">More Credentials</p>
                            <ul className="space-y-1">
                              {hiddenCredentials.map((credential) => (<li key={credential} className="text-xs text-white/80">• {credential}</li>))}
                            </ul>
                          </motion.div>)}
                      </AnimatePresence>
                    </div>)}
                </div>
              </div>
            </div>
          </div>
          <Button onClick={() => onUseTemplate(template.id)} disabled={mutationPending} className="group mx-6 mb-6 mt-1 h-10 w-auto rounded-xl bg-brand px-4 py-2 font-semibold text-white shadow-lg shadow-black/25 transition-all duration-200 hover:bg-brand-hover active:scale-[0.98]">
            {isCreating ? (<span className="flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                </svg>
                Creating...
              </span>) : (<span className="flex items-center justify-center gap-2">
                <span>Use Template</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1"/>
              </span>)}
          </Button>
        </Card>
      </motion.div>);
}
export default function TemplatesPage() {
    const router = useRouter();
    const utils = trpc.useUtils();
    const [creatingTemplateId, setCreatingTemplateId] = useState<string | null>(null);
    const [activeCategory, setActiveCategory] = useState<TemplateCategory | "all">("all");
    const [search, setSearch] = useState("");
    const { data: credentials = [] } = trpc.credentials.getAll.useQuery(undefined, {
        staleTime: 60000,
        refetchOnWindowFocus: false,
    });
    const createWorkflowMutation = trpc.workflow.create.useMutation({
        onSuccess: () => {
            void Promise.all([
                utils.workflow.getAll.invalidate(),
                utils.workflow.getAllSummaries.invalidate(),
            ]);
        },
    });
    const filteredTemplates = useMemo(() => {
        const query = search.toLowerCase().trim();
        return WORKFLOW_TEMPLATES.filter((t) => {
            if (activeCategory !== "all" && t.category !== activeCategory)
                return false;
            if (query) {
                const matchesName = t.name.toLowerCase().includes(query);
                const matchesDesc = t.description.toLowerCase().includes(query);
                const matchesTags = t.tags.some((tag) => tag.includes(query));
                if (!matchesName && !matchesDesc && !matchesTags)
                    return false;
            }
            return true;
        });
    }, [activeCategory, search]);
    const categoryCounts = useMemo(() => {
        const counts: Record<string, number> = { all: WORKFLOW_TEMPLATES.length };
        for (const t of WORKFLOW_TEMPLATES) {
            counts[t.category] = (counts[t.category] || 0) + 1;
        }
        return counts;
    }, []);
    const handleUseTemplate = async (templateId: string) => {
        const template = WORKFLOW_TEMPLATES.find((item) => item.id === templateId);
        if (!template)
            return;
        await createWorkflowFromTemplate(template);
    };
    const createWorkflowFromTemplate = async (template: typeof WORKFLOW_TEMPLATES[0]) => {
        try {
            setCreatingTemplateId(template.id);
            const workflowId = crypto.randomUUID();
            const availableCredentials = credentials.length > 0 ? credentials : await utils.credentials.getAll.fetch();
            const defaultTemplateFields: Record<string, Record<string, string>> = {};
            for (const fieldReq of template.fieldRequirements ?? []) {
                if (!fieldReq.defaultValue)
                    continue;
                const nodeDefaults = defaultTemplateFields[fieldReq.nodeId] ?? {};
                nodeDefaults[fieldReq.field] = fieldReq.defaultValue;
                defaultTemplateFields[fieldReq.nodeId] = nodeDefaults;
            }
            const autoBindings: CredentialBinding[] = [];
            for (const [index, binding] of template.requiredBindings.entries()) {
                const platform = binding.platform;
                const matches = availableCredentials.filter((credential) => credential.platform.toLowerCase() === platform);
                if (matches.length !== 1) {
                    autoBindings.length = 0;
                    break;
                }
                autoBindings.push({
                    bindingKey: getTemplateBindingKey(binding, index),
                    platform,
                    credentialId: matches[0]!.id,
                });
            }
            const graph = instantiateTemplateGraph(template, autoBindings.length > 0 ? autoBindings : undefined, Object.keys(defaultTemplateFields).length > 0 ? defaultTemplateFields : undefined);
            const existingWorkflows = utils.workflow.getAllSummaries.getData() ??
                (await utils.workflow.getAllSummaries.fetch());
            const nextTemplateTitle = getNextTemplateWorkflowTitle(template.name, existingWorkflows);
            const now = new Date();
            const triggerMetadata = {
                templateId: template.id,
                templateVersion: template.templateVersion,
                executionMode: "strict_template_v1",
            };
            const optimisticWorkflow = {
                id: workflowId,
                title: nextTemplateTitle,
                userId: "",
                nodes: graph.nodes as unknown[],
                edges: graph.edges as unknown[],
                trigger: { metadata: triggerMetadata as unknown, type: { id: template.availableTriggerId, name: template.availableTriggerId, image: "" } } as never,
                actions: [] as never[],
                createdAt: now,
                updatedAt: now,
            };
            const summaryItem = {
                id: workflowId,
                title: nextTemplateTitle,
                createdAt: now,
                updatedAt: now,
                nodeCount: graph.nodes.length,
                edgeCount: graph.edges.length,
                templateId: template.id,
                triggerTypes: graph.nodes
                    .filter((n: { type?: string }) => n.type === 'cronTrigger' || n.type === 'webhookTrigger' || n.type === 'trigger')
                    .map((n: { type?: string }) => n.type!) as string[],
                lastRunStatus: null as 'Pending' | 'Success' | 'Failure' | null,
                lastRunAt: null as Date | null,
            };
            utils.workflow.getById.setData({ id: workflowId }, optimisticWorkflow);
            utils.workflow.getAllSummaries.setData(undefined, (previous) => {
                if (!previous || previous.length === 0) return [summaryItem];
                return [summaryItem, ...previous.filter((w) => w.id !== workflowId)];
            });
            router.push(`/home/workflows/${workflowId}`);
            createWorkflowMutation.mutate(
                {
                    id: workflowId,
                    title: nextTemplateTitle,
                    availableTriggerId: template.availableTriggerId,
                    triggerMetadata,
                    actions: [],
                    nodes: graph.nodes,
                    edges: graph.edges,
                },
                {
                    onError: (error) => {
                        console.error("Failed to create workflow from template", error);
                        utils.workflow.getById.invalidate({ id: workflowId });
                    },
                }
            );
        }
        catch (error) {
            console.error("Failed to create workflow from template", error);
        }
        finally {
            setCreatingTemplateId(null);
        }
    };
    return (<div className="flex-1 flex flex-col">
      
      <motion.div className="mb-6" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: TIMING.headerDuration, ease: [0.25, 0.46, 0.45, 0.94] }}>
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground">
          Start with ready-made workflows. Pick a template and customize it to fit your needs.
        </p>
      </motion.div>

      
      <motion.div className="mb-6 space-y-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1, duration: 0.2 }}>
        
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40"/>
          <input type="text" placeholder="Search templates..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors"/>
        </div>

        
        <div className="flex gap-1 overflow-x-auto pb-1">
          {ALL_CATEGORIES.map((cat) => {
            const isActive = activeCategory === cat;
            const count = categoryCounts[cat] || 0;
            if (cat !== "all" && count === 0)
                return null;
            return (<button key={cat} onClick={() => setActiveCategory(cat)} className={`relative px-3 py-1.5 rounded-md text-sm font-medium whitespace-nowrap transition-colors ${isActive
                    ? "text-white bg-white/10"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"}`}>
                <AnimatePresence mode="popLayout">
                  <motion.span key={`${cat}-${isActive ? "active" : "inactive"}`} initial={TAB.enter} animate={TAB.center} exit={TAB.exit} transition={TAB.transition} style={{ display: "inline-block" }}>
                    {categoryLabels[cat]}
                  </motion.span>
                </AnimatePresence>
                <span className="ml-1.5 text-[10px] text-white/40">{count}</span>
                {isActive && (<motion.div className="absolute bottom-0 left-2 right-2 h-0.5 bg-white/60 rounded-full" layoutId="template-tab-underline" transition={{ type: "spring", stiffness: 400, damping: 30 }}/>)}
              </button>);
        })}
        </div>
      </motion.div>

      
      {filteredTemplates.length === 0 ? (<motion.p className="text-sm text-white/50 text-center py-8" initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.2 }}>
          No templates match your search.
        </motion.p>) : (<motion.div className="grid items-stretch gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4" variants={cardContainer} initial="hidden" animate="show" key={`${activeCategory}-${search}`}>
          {filteredTemplates.map((template) => {
                const isCreating = creatingTemplateId === template.id && createWorkflowMutation.isPending;
                return (<TemplateCard key={template.id} template={template} isCreating={isCreating} mutationPending={createWorkflowMutation.isPending} onUseTemplate={handleUseTemplate}/>);
            })}
        </motion.div>)}
    </div>);
}
