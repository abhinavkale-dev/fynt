const NodeSvg = () => (<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
    <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
  </svg>);
export function FooterSectionSeparator() {
    return (<>
      
      <div className="hidden">
        
        <div className="flex-shrink-0">
          <NodeSvg />
        </div>
        
        <div className="relative w-64 h-px bg-white/30"/>
        
        <div className="flex-shrink-0">
          <NodeSvg />
        </div>
      </div>

      
      <div className="hidden lg:flex items-center w-full mx-auto pointer-events-none z-20 py-12 justify-center">
        
        <div className="flex-shrink-0">
          <NodeSvg />
        </div>
        
        <div className="relative w-[600px] h-px bg-white/30"/>
        
        <div className="flex-shrink-0">
          <NodeSvg />
        </div>
      </div>
    </>);
}
