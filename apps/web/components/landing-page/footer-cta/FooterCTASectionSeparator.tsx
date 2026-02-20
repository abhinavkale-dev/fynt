const NodeSvg = () => (<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
  </svg>);
export function FooterCTASectionSeparator() {
    return (<div className="hidden lg:block pointer-events-none z-20 py-12">
      <div className="relative">
        
        <div className="w-full h-px bg-white/20"/>

        
        <div className="absolute inset-0 w-[80%] mx-auto">
          <div className="absolute left-2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
            <NodeSvg />
          </div>
          <div className="absolute right-2 top-1/2 translate-x-1/2 -translate-y-1/2 z-30">
            <NodeSvg />
          </div>
        </div>
      </div>
    </div>);
}
