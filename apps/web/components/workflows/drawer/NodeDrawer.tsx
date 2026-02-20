'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from '@/components/ui/drawer';
import type { Node } from '@xyflow/react';
import { Search, ChevronRight } from 'lucide-react';
import { NODE_REGISTRY, CATEGORY_LABELS, CATEGORY_ORDER, type NodeCategory, } from '@repo/shared';
import { NODE_UI } from '@/lib/nodeUI';
import { Collapsible, CollapsibleContent, CollapsibleTrigger, } from '@/components/ui/collapsible';
interface NodeDrawerProps {
    onAddNode: (nodeType: string, label: string) => void;
    nodes: Node[];
}
const staggerContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06 } },
    exit: { transition: { staggerChildren: 0.03, staggerDirection: -1 } },
};
const staggerItem = {
    hidden: { opacity: 0, x: 16 },
    show: { opacity: 1, x: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
    exit: { opacity: 0, x: 8, transition: { duration: 0.12, ease: 'easeIn' as const } },
};
const CATEGORY_TINT: Record<NodeCategory, string> = {
    triggers: 'bg-orange-500/10 border-orange-500/40',
    integrations: 'bg-blue-500/10 border-blue-500/40',
    logic: 'bg-violet-500/10 border-violet-500/40',
    utilities: 'bg-emerald-500/10 border-emerald-500/40',
};
export function NodeDrawer({ onAddNode, nodes }: NodeDrawerProps) {
    const [search, setSearch] = useState('');
    const [openCategories, setOpenCategories] = useState<Record<NodeCategory, boolean>>({
        triggers: true,
        integrations: false,
        logic: false,
        utilities: false,
    });
    const hasTrigger = nodes.some((node) => {
        const def = NODE_REGISTRY.find((d) => d.type === node.type);
        return def?.isTrigger;
    });
    const grouped = useMemo(() => {
        const query = search.toLowerCase().trim();
        const result: Record<NodeCategory, typeof NODE_REGISTRY> = {
            triggers: [],
            integrations: [],
            logic: [],
            utilities: [],
        };
        for (const def of NODE_REGISTRY) {
            if (query && !def.label.toLowerCase().includes(query) && !def.description.toLowerCase().includes(query)) {
                continue;
            }
            result[def.category].push(def);
        }
        return result;
    }, [search]);
    const hasResults = CATEGORY_ORDER.some((cat) => grouped[cat].length > 0);
    useEffect(() => {
        if (search.trim()) {
            setOpenCategories({
                triggers: grouped.triggers.length > 0,
                integrations: grouped.integrations.length > 0,
                logic: grouped.logic.length > 0,
                utilities: grouped.utilities.length > 0,
            });
        }
        else {
            setOpenCategories({
                triggers: true,
                integrations: false,
                logic: false,
                utilities: false,
            });
        }
    }, [search, grouped]);
    return (<DrawerContent className="h-[85vh] flex flex-col">
            <DrawerHeader>
                <DrawerTitle>Add a step</DrawerTitle>
                <DrawerDescription>Choose a trigger or action to add to your workflow.</DrawerDescription>
            </DrawerHeader>

            
            <div className="px-4 pb-4">
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/40"/>
                    <input type="text" placeholder="Search nodes..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-9 pr-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/40 outline-none focus:border-white/20 transition-colors"/>
                </div>
            </div>

            <div className="flex-1 min-h-0 space-y-4 p-4 overflow-y-auto">
                {!hasResults && (<p className="text-sm text-white/50 text-center py-4">No nodes match &ldquo;{search}&rdquo;</p>)}

                {CATEGORY_ORDER.map((category, catIdx) => {
            const defs = grouped[category];
            if (defs.length === 0)
                return null;
            return (<Collapsible key={category} open={openCategories[category]} onOpenChange={(open) => {
                    setOpenCategories(prev => ({ ...prev, [category]: open }));
                }}>
                            <CollapsibleTrigger asChild aria-label={`Toggle ${CATEGORY_LABELS[category]} category`}>
                                <motion.button initial={{ opacity: 0, x: 8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: catIdx * 0.05, duration: 0.2, ease: 'easeOut' }} className="flex items-center gap-2 w-full text-left py-1.5 px-2 -mx-2 rounded-md hover:bg-white/5 transition-colors duration-150">
                                    <ChevronRight className={`size-3.5 text-white/40 shrink-0 transition-transform duration-200 ${openCategories[category] ? 'rotate-90' : ''}`}/>
                                    <h4 className="text-sm font-medium text-white">
                                        {CATEGORY_LABELS[category]}
                                    </h4>
                                    <span className="text-[10px] text-white/40 bg-white/5 rounded-full px-1.5 py-0.5 ml-auto">
                                        {defs.length}
                                    </span>
                                </motion.button>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="overflow-hidden transition-all duration-200 ease-out">
                                <motion.div className="space-y-2.5 mt-3" variants={staggerContainer} initial="hidden" animate="show" exit="exit">
                                    {defs.map((def) => {
                    const ui = NODE_UI[def.type];
                    const tint = CATEGORY_TINT[category];
                    const isDisabled = def.isTrigger && hasTrigger && def.maxPerWorkflow === 1;
                    return (<motion.button key={def.type} variants={staggerItem} type="button" onClick={() => {
                            if (!isDisabled) {
                                onAddNode(def.type, def.label);
                            }
                        }} disabled={isDisabled} className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${isDisabled
                            ? 'opacity-50 cursor-not-allowed'
                            : 'cursor-pointer hover:bg-white/5 active:bg-white/10'}`} aria-label={`Add ${def.label} ${def.isTrigger ? 'trigger' : 'action'}`}>
                                                <div className={`shrink-0 w-8 h-8 rounded-md border flex items-center justify-center text-muted-foreground ${tint}`}>
                                                    {ui?.icon}
                                                </div>
                                                <div className="flex flex-col min-w-0">
                                                    <span className="font-medium text-sm text-white">{def.label}</span>
                                                    <span className="text-xs text-white/70 truncate">
                                                        {isDisabled ? 'Already added' : def.description}
                                                    </span>
                                                </div>
                                            </motion.button>);
                })}
                                </motion.div>
                            </CollapsibleContent>
                        </Collapsible>);
        })}
            </div>
        </DrawerContent>);
}
