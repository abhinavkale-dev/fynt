const NodeSvg = () => (<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
    </svg>);
const LogoSvg = () => (<svg width="31" height="31" viewBox="0 0 31 31" overflow="visible" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#a)"><g filter="url(#b)"><rect x=".5" y=".5" width="29.998" height="30.003" rx="4.5" stroke="#ff6e00"/></g><g filter="url(#c)" fill="#ff6e00"><path d="m6.86 25.366 1.004-5.462h5.684l-1.115 5.462zm6.91-5.462 1.226-5.796h5.573l-1.338 5.796z"/><path d="m11.541 17.006 1.226-5.685h11.48l1.114-5.684H7.864l-2.23 11.37z"/></g></g><defs><filter id="a" x="0" y="0" width="31.198" height="31.203" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dx=".2" dy=".2"/><feGaussianBlur stdDeviation=".25"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend in2="shape" result="effect1_innerShadow_642_873"/></filter><filter id="b" x="0" y="0" width="31.198" height="31.203" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dx=".2" dy=".2"/><feGaussianBlur stdDeviation=".4"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend in2="shape" result="effect1_innerShadow_642_873"/></filter><filter id="c" x="5.635" y="5.637" width="20.827" height="20.829" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/><feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dx="1.1" dy="1.1"/><feGaussianBlur stdDeviation="1.05"/><feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/><feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.62 0"/><feBlend in2="shape" result="effect1_innerShadow_642_873"/></filter></defs></svg>);
export function SectionSeparators() {
    return (<>
            
            <div className="lg:hidden w-full mx-auto flex justify-center items-center pointer-events-none z-20 mt-0 py-1">
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
                
                <div className="relative w-16 h-px bg-white/30"/>
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
                
                <div className="flex-shrink-0 mx-3">
                    <LogoSvg />
                </div>
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
                
                <div className="relative w-16 h-px bg-white/30"/>
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
            </div>

            
            <div className="hidden lg:flex items-center w-full mx-auto pointer-events-none z-20 mt-0 py-2 justify-center">
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
                
                <div className="relative w-56 h-px bg-white/30"/>
                
                <div className="flex-shrink-0 mr-2">
                    <NodeSvg />
                </div>
                
                <div className="flex-shrink-0 mx-4">
                    <LogoSvg />
                </div>
                
                <div className="flex-shrink-0 ml-2">
                    <NodeSvg />
                </div>
                
                <div className="relative w-56 h-px bg-white/30"/>
                
                <div className="flex-shrink-0">
                    <NodeSvg />
                </div>
            </div>
        </>);
}
