export function RulerTicks() {
    return (<div className="absolute inset-0 w-[80%] mx-auto pointer-events-none hidden lg:block z-10" aria-hidden="true">
            
            <div className="ruler-ticks absolute left-2 top-[40px] -translate-x-[calc(100%-1px)] pr-0 flex flex-col items-end gap-10 text-xs font-mono origin-right">
                <div className="flex w-fit items-center gap-2 text-white/30"><span className="-rotate-90">0</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex w-fit items-center gap-1 text-white/30"><span className="-rotate-90">50</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">100</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">150</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">200</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">250</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">300</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">350</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">400</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">450</span><span className="w-1 h-px bg-white/30"/></div>
                <div className="flex items-center gap-0.5 text-white/25"><span className="-rotate-90">500</span><span className="w-1 h-px bg-white/25"/></div>
                <div className="flex items-center gap-0.5 text-white/20"><span className="-rotate-90">550</span><span className="w-1 h-px bg-white/20"/></div>
                <div className="flex items-center gap-0.5 text-white/15"><span className="-rotate-90">600</span><span className="w-1 h-px bg-white/15"/></div>
                <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">650</span><span className="w-1 h-px bg-white/10"/></div>
                <div className="flex items-center gap-0.5 text-white/5"><span className="-rotate-90">700</span><span className="w-1 h-px bg-white/5"/></div>
                <div className="flex items-center gap-0.5 text-white/2"><span className="-rotate-90">750</span><span className="w-1 h-px bg-white/2"/></div>
            </div>

            
            <div className="ruler-ticks ruler-ticks-right absolute right-2 top-[40px] translate-x-[calc(100%-1px)] pl-0 flex flex-col items-start gap-10 text-xs font-mono origin-left">
                <div className="flex w-fit items-center gap-2 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">0</span></div>
                <div className="flex w-fit items-center gap-1 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">50</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">100</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">150</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">200</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">250</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">300</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">350</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">400</span></div>
                <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">450</span></div>
                <div className="flex items-center gap-0.5 text-white/25"><span className="w-1 h-px bg-white/25"/><span className="rotate-90">500</span></div>
                <div className="flex items-center gap-0.5 text-white/20"><span className="w-1 h-px bg-white/20"/><span className="rotate-90">550</span></div>
                <div className="flex items-center gap-0.5 text-white/15"><span className="w-1 h-px bg-white/15"/><span className="rotate-90">600</span></div>
                <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">650</span></div>
                <div className="flex items-center gap-0.5 text-white/5"><span className="w-1 h-px bg-white/5"/><span className="rotate-90">700</span></div>
                <div className="flex items-center gap-0.5 text-white/2"><span className="w-1 h-px bg-white/2"/><span className="rotate-90">750</span></div>
            </div>
        </div>);
}
