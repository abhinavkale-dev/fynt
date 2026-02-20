"use client";
import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion, type Transition, } from "framer-motion";
import { ArrowRight, Copy, FolderKanban, MessageSquareText, Plus, ShieldCheck, Upload, } from "lucide-react";
type TemplateId = "ai-automation" | "business" | "devops" | "marketing";
type TemplatePage = {
    title: string;
    subtitle: string;
    icon: React.ComponentType<{
        className?: string;
    }>;
    image: string;
};
type TemplateCategory = {
    id: TemplateId;
    label: string;
    shortLabel: string;
    accent: string;
    soft: string;
    status?: "NEW" | "SOON";
    disabled?: boolean;
    pages: TemplatePage[];
};
const TEMPLATE_CATEGORIES: TemplateCategory[] = [
    {
        id: "ai-automation",
        label: "AI & Automation",
        shortLabel: "AI",
        accent: "#22C55E",
        soft: "rgba(34, 197, 94, 0.14)",
        status: undefined,
        pages: [
            {
                title: "Daily AI Notion Digest",
                subtitle: "Collect daily metrics, summarize with AI, archive in Notion, and notify your team.",
                icon: MessageSquareText,
                image: "/templates/[AI]-daily-AI-notion-digest.avif",
            },
            {
                title: "Multi-Source AI Research Agent",
                subtitle: "Pull from two sources, synthesize with AI models, then publish to Slack with a run log.",
                icon: ShieldCheck,
                image: "/templates/[AI]-multi-source-ai-research-agent.avif",
            },
            {
                title: "Release Risk Review Center",
                subtitle: "Run multi-model governance checks and route pass/revise outcomes automatically.",
                icon: FolderKanban,
                image: "/templates/[AI]-release-risk-review-center.avif",
            },
        ],
    },
    {
        id: "business",
        label: "Business",
        shortLabel: "Business",
        accent: "#60A5FA",
        soft: "rgba(96, 165, 250, 0.14)",
        pages: [
            {
                title: "Notion Backlog Priority Sync",
                subtitle: "Score backlog items with AI and route high-priority work into GitHub automatically.",
                icon: FolderKanban,
                image: "/templates/[Business]-notion-backlog-priority-sync.avif",
            },
            {
                title: "Notion Page to Slack",
                subtitle: "Read recent entries from Notion and publish a short summary to Slack.",
                icon: ShieldCheck,
                image: "/templates/[Business]-notion-page-back-to-slack-lite.avif",
            },
            {
                title: "Policy Review Router",
                subtitle: "Route policy documents for AI-powered review and approval workflows.",
                icon: MessageSquareText,
                image: "/templates/[Business]-policy-review-router.avif",
            },
        ],
    },
    {
        id: "devops",
        label: "DevOps",
        shortLabel: "DevOps",
        accent: "#F59E0B",
        soft: "rgba(245, 158, 11, 0.14)",
        pages: [
            {
                title: "Cron API Health Watch",
                subtitle: "Run scheduled health checks and route alerts based on response health.",
                icon: FolderKanban,
                image: "/templates/[Devops]-cron-api-health-watch.avif",
            },
            {
                title: "GitHub Issue Comment Assistant",
                subtitle: "Create release notes from GitHub issue context and publish to Slack with an audit log.",
                icon: ShieldCheck,
                image: "/templates/[Devops]-github-issue-comment-assistant.avif",
            },
            {
                title: "Incident Response Command Center",
                subtitle: "Centralized incident intake with AI triage and multi-channel routing.",
                icon: MessageSquareText,
                image: "/templates/[Devops]-incident-response-command-center.avif",
            },
        ],
    },
    {
        id: "marketing",
        label: "Marketing",
        shortLabel: "Marketing",
        accent: "#F04D26",
        soft: "rgba(240, 77, 38, 0.14)",
        pages: [
            {
                title: "AI Social Post Sprint",
                subtitle: "Generate social post ideas with AI and share to Slack and Discord.",
                icon: FolderKanban,
                image: "/templates/[Marketing]-AI-social-post-sprint-lite.avif",
            },
            {
                title: "Content Repurpose AI",
                subtitle: "Transform existing content into multiple formats using AI for different channels.",
                icon: MessageSquareText,
                image: "/templates/[Marketing]-content-repurpose-AI.avif",
            },
            {
                title: "Weekly Campaign Briefing",
                subtitle: "Fetch campaign metrics weekly, summarize with AI, and post to Discord.",
                icon: ShieldCheck,
                image: "/templates/[Marketing]-weekly-campaign-briefing-discord.avif",
            },
        ],
    },
];
function getDefaultTemplateCategory(): TemplateCategory {
    const firstTemplate = TEMPLATE_CATEGORIES[0];
    if (!firstTemplate) {
        throw new Error("TEMPLATE_CATEGORIES must contain at least one template");
    }
    return firstTemplate;
}
const DEFAULT_TEMPLATE_CATEGORY = getDefaultTemplateCategory();
const CATEGORY_ICONS: Record<TemplateId, React.ReactNode> = {
    "ai-automation": (<svg aria-hidden="true" width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M22.0015 10.6253H14.3844L18.1976 4.03185L15.8178 2.65564L13.3762 6.87552V2H10.6253V9.61713L4.03185 5.80393L2.65563 8.1837L6.87707 10.6253H2V13.3747H9.61713L5.80393 19.9681L8.18525 21.3459L10.6253 17.1245V22H13.3762V14.3844L19.9697 18.1976L21.3459 15.8163L17.1245 13.3747H22.0015V10.6253Z" fill="currentColor"/></g></svg>),
    "business": (<svg aria-hidden="true" width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M20 12V17C20 18.6569 18.6569 20 17 20H7C5.34315 20 4 18.6569 4 17V12" stroke="currentColor" strokeWidth="2" strokeLinecap="square" strokeLinejoin="round"/><path d="M9.5002 4H14.5002M9.5002 4L8.93432 8.52703C8.70381 10.3711 10.1417 12 12.0002 12C13.8587 12 15.2966 10.3711 15.0661 8.52703L14.5002 4M9.5002 4H6.70577C5.39362 4 4.23372 4.85275 3.84233 6.10517L3.17593 8.23768C2.59278 10.1038 3.98689 12 5.94195 12C7.40345 12 8.63624 10.9117 8.81751 9.46151L9.5002 4ZM14.5002 4H17.2946C18.6068 4 19.7667 4.85275 20.1581 6.10517L20.8245 8.23768C21.4076 10.1038 20.0135 12 18.0585 12C16.597 12 15.3642 10.9117 15.1829 9.46151L14.5002 4Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g></svg>),
    "devops": (<svg aria-hidden="true" width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M7 19C4.23858 19 2 16.7614 2 14C2 11.4673 3.88316 9.37436 6.32568 9.04508C7.13649 6.69118 9.37075 5 12 5C15.3137 5 18 7.68629 18 11C20.2091 11 22 12.7909 22 15C22 17.2091 20.2091 19 18 19H7Z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g></svg>),
    "marketing": (<svg aria-hidden="true" width="14px" height="14px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth="2"/><path d="M15 15L17 17" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/><path d="M14.8735 20.5309C13.0122 21.1564 10.9868 21.1564 9.12546 20.5309M20.5304 9.12595C21.1559 10.9873 21.1559 13.0126 20.5304 14.874M9.12549 3.46912C10.9869 2.84362 13.0122 2.84363 14.8736 3.46913M3.46864 14.874C2.84314 13.0127 2.84313 10.9874 3.46864 9.12598" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></g></svg>),
};
const TAB_CARDS = {
    stagger: 0.15,
    initialScale: 0.96,
    spring: { type: "spring" as const, stiffness: 600, damping: 28 },
};
const TAB_FADE = {
    exitDuration: 0.25,
    enterDuration: 0.35,
    exitEase: [0.55, 0, 1, 0.45] as const,
    enterEase: [0.165, 0.84, 0.44, 1] as const,
    scale: 0.98,
    blur: 4,
};
const BUTTON = {
    duration: 0.13,
    easeEnter: [0.165, 0.84, 0.44, 1] as const,
    easeExit: [0.55, 0, 0.1, 1] as const,
    yOffset: "110%",
    rotateX: 28,
    widthSpring: { type: "spring" as const, stiffness: 500, damping: 35 },
};
export function TemplatesSection() {
    const router = useRouter();
    const [selectedTemplateId, setSelectedTemplateId] = useState<TemplateId>("ai-automation");
    const [activePageIndex, setActivePageIndex] = useState(0);
    const [hoveredDesktopPageIndex, setHoveredDesktopPageIndex] = useState<number | null>(null);
    const shouldReduceMotion = useReducedMotion();
    const tickerMeasureRef = useRef<HTMLSpanElement>(null);
    const [tickerWidth, setTickerWidth] = useState<number | undefined>(undefined);
    const visibleTemplates = useMemo(() => TEMPLATE_CATEGORIES, []);
    const selectedTemplate = useMemo<TemplateCategory>(() => TEMPLATE_CATEGORIES.find((item) => item.id === selectedTemplateId) ?? DEFAULT_TEMPLATE_CATEGORY, [selectedTemplateId]);
    useEffect(() => {
        setActivePageIndex(0);
    }, [selectedTemplateId]);
    useLayoutEffect(() => {
        if (tickerMeasureRef.current) {
            setTickerWidth(tickerMeasureRef.current.scrollWidth);
        }
    }, [selectedTemplate.label]);
    const orderedPageIndexes = useMemo(() => {
        const allIndexes = selectedTemplate.pages.map((_, index) => index);
        return [activePageIndex, ...allIndexes.filter((index) => index !== activePageIndex)];
    }, [selectedTemplate.pages, activePageIndex]);
    const pagePositionByIndex = useMemo(() => new Map(orderedPageIndexes.map((pageIndex, position) => [pageIndex, position])), [orderedPageIndexes]);
    const easeOutQuad = [0.25, 0.46, 0.45, 0.94] as const;
    const entranceTransition: Transition = shouldReduceMotion
        ? { duration: 0 }
        : { duration: 0.25, ease: easeOutQuad };
    const tabTransition: Transition = shouldReduceMotion
        ? { duration: 0 }
        : { type: "spring", stiffness: 380, damping: 28, mass: 0.75 };
    const prewarmTemplatesNavigation = useCallback(() => {
        router.prefetch("/home/templates");
        void fetch("/api/auth/get-session", {
            method: "GET",
            credentials: "include",
            cache: "no-store",
        }).catch(() => undefined);
    }, [router]);
    return (<>
    
    <div className="hidden md:flex justify-center bg-[#151515]">
      <svg width="709" height="60" viewBox="0 0 709 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M3 54v-8c0-8.837 7.163-16 16-16h318c8.837 0 16-7.163 16-16V6m0 30v16m350 2v-8c0-8.837-7.163-16-16-16H369c-8.837 0-16-7.163-16-16V6" stroke="#666"/>
        <rect x="350" width="6" height="6" rx="1" fill="#f04d26"/>
        <rect x="350" y="52" width="6" height="6" rx="1" fill="#f04d26"/>
        <rect y="54" width="6" height="6" rx="1" fill="#f04d26"/>
        <rect x="700" y="54" width="6" height="6" rx="1" fill="#f04d26"/>
      </svg>
    </div>
    <section id="templates" className="relative hidden md:block min-h-screen snap-start bg-[#151515] py-16 md:py-20 xl:py-24 overflow-x-hidden">
      <div className="relative z-10 w-[92%] md:w-[88%] lg:w-[90%] mx-auto">
        <div className="flex flex-col items-center">
          <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={entranceTransition} className="flex h-8 items-center gap-2 rounded-[11px] border border-[#F04D26] bg-[#F04D26]/5 px-2.5 text-xs font-medium text-white/75 shadow-[0_8px_24px_-14px_rgba(0,0,0,0.6)]">
    <svg aria-hidden="true" width="16px" height="16px" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><g><path d="M5.63803 19.673L6.09202 18.782H6.09202L5.63803 19.673ZM4.32698 18.362L3.43597 18.816H3.43597L4.32698 18.362ZM19.673 18.362L18.782 17.908V17.908L19.673 18.362ZM18.362 19.673L17.908 18.782H17.908L18.362 19.673ZM19.673 5.63803L18.782 6.09202V6.09202L19.673 5.63803ZM18.362 4.32698L18.816 3.43597V3.43597L18.362 4.32698ZM4.32698 5.63803L5.21799 6.09202V6.09202L4.32698 5.63803ZM5.63803 4.32698L6.09202 5.21799V5.21799L5.63803 4.32698ZM20 8.8H19V15.2H20H21V8.8H20ZM15.2 20V19H8.8V20V21H15.2V20ZM4 15.2H5V8.8H4H3V15.2H4ZM8.8 4V5H15.2V4V3H8.8V4ZM8.8 20V19C7.94342 19 7.36113 18.9992 6.91104 18.9624C6.47262 18.9266 6.24842 18.8617 6.09202 18.782L5.63803 19.673L5.18404 20.564C5.66937 20.8113 6.18608 20.9099 6.74817 20.9558C7.2986 21.0008 7.97642 21 8.8 21V20ZM4 15.2H3C3 16.0236 2.99922 16.7014 3.04419 17.2518C3.09012 17.8139 3.18868 18.3306 3.43597 18.816L4.32698 18.362L5.21799 17.908C5.1383 17.7516 5.07337 17.5274 5.03755 17.089C5.00078 16.6389 5 16.0566 5 15.2H4ZM5.63803 19.673L6.09202 18.782C5.7157 18.5903 5.40973 18.2843 5.21799 17.908L4.32698 18.362L3.43597 18.816C3.81947 19.5686 4.43139 20.1805 5.18404 20.564L5.63803 19.673ZM20 15.2H19C19 16.0566 18.9992 16.6389 18.9624 17.089C18.9266 17.5274 18.8617 17.7516 18.782 17.908L19.673 18.362L20.564 18.816C20.8113 18.3306 20.9099 17.8139 20.9558 17.2518C21.0008 16.7014 21 16.0236 21 15.2H20ZM15.2 20V21C16.0236 21 16.7014 21.0008 17.2518 20.9558C17.8139 20.9099 18.3306 20.8113 18.816 20.564L18.362 19.673L17.908 18.782C17.7516 18.8617 17.5274 18.9266 17.089 18.9624C16.6389 18.9992 16.0566 19 15.2 19V20ZM19.673 18.362L18.782 17.908C18.5903 18.2843 18.2843 18.5903 17.908 18.782L18.362 19.673L18.816 20.564C19.5686 20.1805 20.1805 19.5686 20.564 18.816L19.673 18.362ZM20 8.8H21C21 7.97642 21.0008 7.2986 20.9558 6.74817C20.9099 6.18608 20.8113 5.66937 20.564 5.18404L19.673 5.63803L18.782 6.09202C18.8617 6.24842 18.9266 6.47262 18.9624 6.91104C18.9992 7.36113 19 7.94342 19 8.8H20ZM15.2 4V5C16.0566 5 16.6389 5.00078 17.089 5.03755C17.5274 5.07337 17.7516 5.1383 17.908 5.21799L18.362 4.32698L18.816 3.43597C18.3306 3.18868 17.8139 3.09012 17.2518 3.04419C16.7014 2.99922 16.0236 3 15.2 3V4ZM19.673 5.63803L20.564 5.18404C20.1805 4.43139 19.5686 3.81947 18.816 3.43597L18.362 4.32698L17.908 5.21799C18.2843 5.40973 18.5903 5.7157 18.782 6.09202L19.673 5.63803ZM4 8.8H5C5 7.94342 5.00078 7.36113 5.03755 6.91104C5.07337 6.47262 5.1383 6.24842 5.21799 6.09202L4.32698 5.63803L3.43597 5.18404C3.18868 5.66937 3.09012 6.18608 3.04419 6.74817C2.99922 7.2986 3 7.97642 3 8.8H4ZM8.8 4V3C7.97642 3 7.2986 2.99922 6.74817 3.04419C6.18608 3.09012 5.66937 3.18868 5.18404 3.43597L5.63803 4.32698L6.09202 5.21799C6.24842 5.1383 6.47262 5.07337 6.91104 5.03755C7.36113 5.00078 7.94342 5 8.8 5V4ZM4.32698 5.63803L5.21799 6.09202C5.40973 5.71569 5.71569 5.40973 6.09202 5.21799L5.63803 4.32698L5.18404 3.43597C4.43139 3.81947 3.81947 4.43139 3.43597 5.18404L4.32698 5.63803Z" fill="currentColor"></path><path d="M12 4V12V20" stroke="currentColor" strokeWidth="2" strokeLinecap="square"></path><path d="M12 12H20" stroke="currentColor" strokeWidth="2" strokeLinecap="square"></path></g></svg>
            <span>Sector-specific Templates</span>
          </motion.div>
          <motion.h2 initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.6 }} transition={shouldReduceMotion ? { duration: 0 } : { ...entranceTransition, delay: 0.06 }} className="mt-4 text-center text-pretty font-serif italic text-[#7D7D87] text-xl md:text-2xl leading-tight xl:whitespace-nowrap">
            Ready-made user flows for apps
          </motion.h2>
        </div>

        <motion.div initial={{ opacity: 0, y: 8 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, amount: 0.4 }} transition={shouldReduceMotion ? { duration: 0 } : { ...entranceTransition, delay: 0.12 }} className="mx-auto mt-8 hidden w-full max-w-3xl flex-wrap justify-center gap-2.5 md:flex xl:gap-3.5">
          {visibleTemplates.map((template) => {
            const isActive = selectedTemplateId === template.id;
            return (<motion.button key={template.id} type="button" disabled={template.disabled} onClick={() => setSelectedTemplateId(template.id)} animate={shouldReduceMotion
                    ? undefined
                    : {
                        y: isActive ? -2 : 0,
                        scale: isActive ? 1.01 : 1,
                        opacity: template.disabled ? 0.45 : 1,
                    }} whileHover={template.disabled || shouldReduceMotion
                    ? undefined
                    : { y: -2, scale: isActive ? 1.01 : 1.005 }} whileTap={shouldReduceMotion ? undefined : { scale: 0.97 }} transition={tabTransition} className={`group relative flex h-11 items-center gap-2.5 rounded-[13px] border px-3 text-sm transition duration-200 active:scale-[0.97] ${template.disabled
                    ? "cursor-not-allowed border-white/10 bg-white/[0.02] text-white/35"
                    : isActive
                        ? "border-white/20 bg-white/10 text-white"
                        : "border-white/10 bg-white/[0.03] text-white/65 hover:border-white/20 hover:text-white"}`}>
                <span className="relative z-10 flex h-6 w-6 items-center justify-center rounded-[7px] border border-white/10" style={{ backgroundColor: template.soft }}>
                  <span className="text-white/85">{CATEGORY_ICONS[template.id]}</span>
                </span>
                <span className="relative z-10 pr-0.5">{template.label}</span>
                {template.status === "NEW" && (<span className="relative z-10 rounded-full bg-[#22C55E]/20 px-1.5 py-0.5 text-[10px] font-semibold text-[#22C55E]">
                    NEW
                  </span>)}
                {template.status === "SOON" && (<span className="relative z-10 rounded-full bg-white/10 px-1.5 py-0.5 text-[10px] font-semibold text-white/55">
                    SOON
                  </span>)}
              </motion.button>);
        })}
        </motion.div>

        
        <div className="relative mt-3 hidden md:block">
          <AnimatePresence mode="wait">
            <motion.div key={selectedTemplateId} initial={{ opacity: 0, scale: TAB_FADE.scale, filter: `blur(${TAB_FADE.blur}px)` }} animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }} exit={{
            opacity: 0,
            scale: TAB_FADE.scale,
            filter: `blur(${TAB_FADE.blur}px)`,
            transition: shouldReduceMotion
                ? { duration: 0 }
                : { duration: TAB_FADE.exitDuration, ease: TAB_FADE.exitEase },
        }} transition={shouldReduceMotion
            ? { duration: 0 }
            : { duration: TAB_FADE.enterDuration, ease: TAB_FADE.enterEase }}>
              <div className="relative z-0 max-h-[85vh] overflow-hidden pb-20">
                <div className="relative mx-auto grid w-full max-w-6xl justify-items-center pt-[7.25rem] [perspective:10000px]">
                  {selectedTemplate.pages.map((page, pageIndex) => {
            const Icon = page.icon;
            const index = pagePositionByIndex.get(pageIndex) ?? pageIndex;
            const widths = ["100%", "94%", "88%"];
            const offset = index * -65;
            const hoverLift = hoveredDesktopPageIndex === pageIndex ? -12 : 0;
            return (<button key={page.title} type="button" onClick={index === 0 ? undefined : () => setActivePageIndex(pageIndex)} onMouseEnter={() => setHoveredDesktopPageIndex(pageIndex)} onMouseLeave={() => setHoveredDesktopPageIndex(null)} className={`origin-top text-left [grid-area:1/1] transition-[transform,width] duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${index === 0 ? "cursor-default" : "cursor-pointer active:scale-[0.97]"}`} style={{
                    width: widths[index] ?? "100%",
                    transform: `translateY(${offset + hoverLift}px) translateZ(${-index}px)`,
                    zIndex: 20 - index,
                }}>
                        <motion.div initial={{ opacity: 0, scale: TAB_CARDS.initialScale }} animate={{
                    opacity: index > 2 ? 0 : 1,
                    scale: 1,
                }} transition={shouldReduceMotion
                    ? { duration: 0 }
                    : { ...TAB_CARDS.spring, delay: pageIndex * TAB_CARDS.stagger }}>
                          <div className={`w-full origin-top select-none overflow-hidden rounded-t-[22px] bg-[#1E1E1E] transition-all duration-350 ease-[cubic-bezier(0.22,1,0.36,1)] ${index === 0 ? "shadow-[0_22px_44px_-24px_rgba(0,0,0,0.95)]" : ""}`}>
                            <div className="flex items-center bg-[#1E1E1E] px-3.5 py-2.5">
                              <div className="flex min-w-0 items-center gap-2.5">
                                <div className="flex h-[22px] w-[22px] items-center justify-center rounded-[7px] border border-white/10" style={{ backgroundColor: selectedTemplate.soft }}>
                                  <Icon className="h-[13px] w-[13px] text-white/85"/>
                                </div>
                                <span className="truncate text-sm font-medium text-white/85">{page.title}</span>
                                <span className="text-xs text-white/30">-</span>
                                <span className="truncate text-[12.5px] text-white/55">{page.subtitle}</span>
                              </div>
                              <div className="ml-auto flex items-center gap-2.5 text-white/45">
                                <Upload className="h-[15px] w-[15px]"/>
                                <Plus className="h-[15px] w-[15px]"/>
                                <Copy className="h-[15px] w-[15px]"/>
                              </div>
                            </div>
                            <div className="px-3 pb-3">
                              <div className="rounded-2xl border border-[#2E2E2E] bg-[#151515] p-3">
                                <div className="relative aspect-[1.64571/1] w-full overflow-hidden rounded-[18px] border border-[#2A2A2A] bg-[#141414]">
                                  <Image src={page.image} alt={page.title} fill className="object-contain object-center" sizes="(max-width: 1280px) 90vw, 1000px" unoptimized priority={pageIndex === activePageIndex}/>
                                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[14%] bg-[linear-gradient(180deg,rgba(20,20,20,0)_0%,rgba(20,20,20,0.86)_90%,#141414_100%)] backdrop-blur-[4px]"/>
                                </div>
                              </div>
                            </div>
                          </div>
                        </motion.div>
                      </button>);
        })}
                </div>

                <div className="pointer-events-none absolute inset-x-0 bottom-0 h-64 bg-[linear-gradient(180deg,rgba(21,21,21,0)_0%,rgba(21,21,21,0.85)_60%,#151515_100%)]"/>
              </div>
            </motion.div>
          </AnimatePresence>

          
          <div className="absolute bottom-28 left-1/2 z-[60] isolate -translate-x-1/2">
            <div className="rounded-[18px] bg-black/30 p-1 backdrop-blur-md">
              <Link href="/home/templates" onMouseEnter={prewarmTemplatesNavigation} onFocus={prewarmTemplatesNavigation} onTouchStart={prewarmTemplatesNavigation} className="group inline-flex h-11 items-center gap-2.5 rounded-[13px] border border-[#F04D26] bg-[#F04D26] px-[18px] text-sm font-medium text-white whitespace-nowrap shadow-[0_12px_28px_-18px_rgba(240,77,38,0.95)] transition duration-200 ease-out active:scale-[0.97] hover:bg-[#de4723]">
                <span>Explore Template</span>
                <span className="text-white/30">-</span>
                
                <motion.div className="overflow-hidden" animate={tickerWidth !== undefined ? { width: tickerWidth } : undefined} transition={shouldReduceMotion ? { duration: 0 } : BUTTON.widthSpring}>
                  
                  <span ref={tickerMeasureRef} className="pointer-events-none invisible absolute whitespace-nowrap" aria-hidden>
                    {selectedTemplate.label}
                  </span>
                  <div className="grid" style={{ perspective: 800 }}>
                    <AnimatePresence mode="sync" initial={false}>
                      <motion.span key={selectedTemplateId} initial={{ y: BUTTON.yOffset, rotateX: -BUTTON.rotateX, opacity: 0.4 }} animate={{ y: 0, rotateX: 0, opacity: 1 }} exit={{
            y: `-${BUTTON.yOffset}`,
            rotateX: BUTTON.rotateX,
            opacity: 0.4,
            transition: shouldReduceMotion
                ? { duration: 0 }
                : { duration: BUTTON.duration, ease: BUTTON.easeExit },
        }} transition={shouldReduceMotion
            ? { duration: 0 }
            : { duration: BUTTON.duration, ease: BUTTON.easeEnter }} className="[grid-area:1/1] text-white/70 whitespace-nowrap" style={{ transformOrigin: "50% 50%" }}>
                        {selectedTemplate.label}
                      </motion.span>
                    </AnimatePresence>
                  </div>
                </motion.div>
                <ArrowRight className="h-4 w-4 shrink-0 text-white/70 transition-transform group-hover:translate-x-0.5"/>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
    
    <div className="hidden md:flex justify-center bg-[#151515]">
      <svg width="709" height="60" viewBox="0 0 709 60" fill="none" xmlns="http://www.w3.org/2000/svg">
        <path d="M705.5 6v8c0 8.837-7.163 16-16 16h-318c-8.837 0-16 7.163-16 16v8m0-30V8M5.5 6v8c0 8.837 7.163 16 16 16h318c8.837 0 16 7.163 16 16v8" stroke="#666"/>
        <rect x="358.5" y="60" width="6" height="6" rx="1" transform="rotate(-180 358.5 60)" fill="#f04d26"/>
        <rect x="358.5" y="8" width="6" height="6" rx="1" transform="rotate(-180 358.5 8)" fill="#f04d26"/>
        <rect x="708.5" y="6" width="6" height="6" rx="1" transform="rotate(-180 708.5 6)" fill="#f04d26"/>
        <rect x="8.5" y="6" width="6" height="6" rx="1" transform="rotate(-180 8.5 6)" fill="#f04d26"/>
      </svg>
    </div>
    </>);
}
