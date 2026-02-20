import { cn } from "@/lib/utils";
function Kbd({ className, ...props }: React.ComponentProps<"kbd">) {
    return (<kbd data-slot="kbd" className={cn("bg-[#2a2a2a] border border-white/8 text-white/60 pointer-events-none inline-flex h-5 w-fit min-w-5 select-none items-center justify-center gap-1 rounded px-1.5 font-sans text-[11px] font-medium", "[&_svg:not([class*='size-'])]:size-3", "in-data-[slot=tooltip-content]:bg-background/20 in-data-[slot=tooltip-content]:text-background dark:in-data-[slot=tooltip-content]:bg-background/10", className)} {...props}/>);
}
function KbdGroup({ className, ...props }: React.ComponentProps<"div">) {
    return (<kbd data-slot="kbd-group" className={cn("inline-flex items-center gap-1", className)} {...props}/>);
}
export { Kbd, KbdGroup };
