"use client";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown } from "lucide-react";
import type { MouseEvent as ReactMouseEvent } from "react";

const GITHUB_URL = "https://github.com/abhinavkale-dev/fynt";
const X_URL = "https://x.com/Abhinavstwt";
const PRIVACY_URL = "/privacy";
const TERMS_URL = "/terms";

const normalizeFooterLink = (href: string) => href.replace(/\/+$/, "");
const allowedFooterLinks = new Set([
    normalizeFooterLink(GITHUB_URL),
    normalizeFooterLink(X_URL),
    normalizeFooterLink(PRIVACY_URL),
    normalizeFooterLink(TERMS_URL),
]);
const LogoSvg = () => (<svg width="34" height="34" viewBox="-1 -1 33 33" fill="none" xmlns="http://www.w3.org/2000/svg" className="block overflow-visible">
    <g filter="url(#a)">
      <g filter="url(#b)">
        <rect x=".5" y=".5" width="29.998" height="30.003" rx="4.5" stroke="#ff6e00"/>
      </g>
      <g filter="url(#c)" fill="#ff6e00">
        <path d="m6.86 25.366 1.004-5.462h5.684l-1.115 5.462zm6.91-5.462 1.226-5.796h5.573l-1.338 5.796z"/>
        <path d="m11.541 17.006 1.226-5.685h11.48l1.114-5.684H7.864l-2.23 11.37z"/>
      </g>
    </g>
    <defs>
      <filter id="a" x="0" y="0" width="31.198" height="31.203" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dx=".2" dy=".2"/>
        <feGaussianBlur stdDeviation=".25"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend in2="shape" result="effect1_innerShadow_642_873"/>
      </filter>
      <filter id="b" x="0" y="0" width="31.198" height="31.203" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dx=".2" dy=".2"/>
        <feGaussianBlur stdDeviation=".4"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/>
        <feBlend in2="shape" result="effect1_innerShadow_642_873"/>
      </filter>
      <filter id="c" x="5.635" y="5.637" width="20.827" height="20.829" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB">
        <feFlood floodOpacity="0" result="BackgroundImageFix"/>
        <feBlend in="SourceGraphic" in2="BackgroundImageFix" result="shape"/>
        <feColorMatrix in="SourceAlpha" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/>
        <feOffset dx="1.1" dy="1.1"/>
        <feGaussianBlur stdDeviation="1.05"/>
        <feComposite in2="hardAlpha" operator="arithmetic" k2="-1" k3="1"/>
        <feColorMatrix values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.62 0"/>
        <feBlend in2="shape" result="effect1_innerShadow_642_873"/>
      </filter>
    </defs>
  </svg>);
const FooterSectionSeparator = () => (<>
    
    <div className="hidden">
      <div className="flex-shrink-0">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
        </svg>
      </div>
      <div className="relative w-full max-w-2xl h-px bg-white/30"/>
      <div className="flex-shrink-0">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
        </svg>
      </div>
    </div>

    
    <div className="hidden xl:flex items-center w-full mx-auto pointer-events-none z-20 py-12 justify-center">
      <div className="flex-shrink-0">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
        </svg>
      </div>
      <div className="relative w-full max-w-6xl h-px bg-white/30"/>
      <div className="flex-shrink-0">
        <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
        </svg>
      </div>
    </div>
  </>);
const ColumnSeparator = () => (<div className="hidden xl:flex flex-col items-center justify-start pointer-events-none">
    
    <div className="flex-shrink-0">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
      </svg>
    </div>
    
    <div className="relative w-px h-78 bg-white/30"/>
    
    <div className="flex-shrink-0">
      <svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
      </svg>
    </div>
  </div>);
export function Footer() {
    const currentYear = new Date().getFullYear();
    const blockDisallowedFooterNavigation = (event: ReactMouseEvent<HTMLElement>) => {
        const target = event.target;
        if (!(target instanceof HTMLElement))
            return;
        const anchor = target.closest("a");
        if (!(anchor instanceof HTMLAnchorElement))
            return;
        const href = anchor.getAttribute("href");
        if (!href)
            return;
        if (allowedFooterLinks.has(normalizeFooterLink(href)))
            return;
        event.preventDefault();
        event.stopPropagation();
    };
    return (<footer className="relative pt-8 pb-0 overflow-hidden" onClickCapture={blockDisallowedFooterNavigation} onAuxClickCapture={blockDisallowedFooterNavigation}>
      <div className="mx-auto max-w-7xl px-6">
        
        <div className="relative z-10 text-center mb-8 pb-6">
          
          <div className="flex justify-center mb-4">
            <LogoSvg />
          </div>
          
          
          <h2 className="text-2xl md:text-3xl font-semibold text-white mb-5">
            Designed & developed by <span className="text-white/70">@Abhinavstwt</span> 
          </h2>
          
          
          <div className="flex justify-center gap-3">
            <a href={X_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" fill="white"/>
              </svg>
            </a>
            <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z" fill="white"/>
              </svg>
            </a>
          </div>
        </div>

        
        <FooterSectionSeparator />

        
        <div className="relative z-10 max-w-6xl mx-auto -mb-3">
          
          <div className="xl:hidden divide-y divide-white/10 border-y border-white/10 mb-8">
            
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left">
                <h3 className="text-white font-semibold text-sm">Product</h3>
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-5">
                <ul className="space-y-3">
                  <li>
                    <a href="#workflows" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Workflows
                    </a>
                  </li>
                  <li>
                    <a href="#integrations" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Integrations
                    </a>
                  </li>
                  <li>
                    <a href="#templates" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Templates
                    </a>
                  </li>
                  <li>
                    <a href="#pricing" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Pricing
                    </a>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left">
                <h3 className="text-white font-semibold text-sm">Resources</h3>
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-5">
                <ul className="space-y-3">
                  <li>
                    <a href="#documentation" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Documentation
                    </a>
                  </li>
                  <li>
                    <a href="#guides" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Guides
                    </a>
                  </li>
                  <li>
                    <a href="#blog" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Blog
                    </a>
                  </li>
                  <li>
                    <a href="#tutorials" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Tutorials
                    </a>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left">
                <h3 className="text-white font-semibold text-sm">Developers</h3>
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-5">
                <ul className="space-y-3">
                  <li>
                    <a href="#api" className="text-white/60 hover:text-white text-sm transition-colors block">
                      API Reference
                    </a>
                  </li>
                  <li>
                    <a href="#sdks" className="text-white/60 hover:text-white text-sm transition-colors block">
                      SDKs
                    </a>
                  </li>
                  <li>
                    <a href="#webhooks" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Webhooks
                    </a>
                  </li>
                  <li>
                    <a href="#examples" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Examples
                    </a>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left">
                <h3 className="text-white font-semibold text-sm">Community</h3>
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-5">
                <ul className="space-y-3">
                  <li>
                    <a href="https://discord.gg/fynt" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Discord
                    </a>
                  </li>
                  <li>
                    <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition-colors block">
                      GitHub
                    </a>
                  </li>
                  <li>
                    <a href="#support" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Support
                    </a>
                  </li>
                  <li>
                    <a href="#status" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Status
                    </a>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>

            
            <Collapsible>
              <CollapsibleTrigger className="group flex w-full items-center justify-between py-5 text-left">
                <h3 className="text-white font-semibold text-sm">Company</h3>
                <div className="flex size-5 items-center justify-center rounded-full bg-white/10">
                  <ChevronDown className="h-3 w-3 text-white/70 transition-transform duration-200 group-data-[state=open]:rotate-180"/>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="pb-5">
                <ul className="space-y-3">
                  <li>
                    <a href="#about" className="text-white/60 hover:text-white text-sm transition-colors block">
                      About
                    </a>
                  </li>
                  <li>
                    <a href="#contact" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Contact
                    </a>
                  </li>
                  <li>
                    <a href="#careers" className="text-white/60 hover:text-white text-sm transition-colors block">
                      Careers
                    </a>
                  </li>
                </ul>
              </CollapsibleContent>
            </Collapsible>
          </div>

          
          <div className="xl:hidden py-5 text-center">
            <p className="text-white/60 text-sm">
              © {currentYear} Fynt. All rights reserved.
            </p>
          </div>

          
          <div className="hidden xl:flex justify-center items-start gap-12 mb-1">
            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-4">
                Product
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#workflows" className="text-white/60 hover:text-white text-sm transition-colors">
                    Workflows
                  </a>
                </li>
                <li>
                  <a href="#integrations" className="text-white/60 hover:text-white text-sm transition-colors">
                    Integrations
                  </a>
                </li>
                <li>
                  <a href="#templates" className="text-white/60 hover:text-white text-sm transition-colors">
                    Templates
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="text-white/60 hover:text-white text-sm transition-colors">
                    Pricing
                  </a>
                </li>
              </ul>
            </div>

            <ColumnSeparator />

            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-4">
                Resources
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#documentation" className="text-white/60 hover:text-white text-sm transition-colors">
                    Documentation
                  </a>
                </li>
                <li>
                  <a href="#guides" className="text-white/60 hover:text-white text-sm transition-colors">
                    Guides
                  </a>
                </li>
                <li>
                  <a href="#blog" className="text-white/60 hover:text-white text-sm transition-colors">
                    Blog
                  </a>
                </li>
                <li>
                  <a href="#tutorials" className="text-white/60 hover:text-white text-sm transition-colors">
                    Tutorials
                  </a>
                </li>
              </ul>
            </div>

            <ColumnSeparator />

            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-4">
                Developers
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#api" className="text-white/60 hover:text-white text-sm transition-colors">
                    API Reference
                  </a>
                </li>
                <li>
                  <a href="#sdks" className="text-white/60 hover:text-white text-sm transition-colors">
                    SDKs
                  </a>
                </li>
                <li>
                  <a href="#webhooks" className="text-white/60 hover:text-white text-sm transition-colors">
                    Webhooks
                  </a>
                </li>
                <li>
                  <a href="#examples" className="text-white/60 hover:text-white text-sm transition-colors">
                    Examples
                  </a>
                </li>
              </ul>
            </div>

            <ColumnSeparator />

            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-4">
                Community
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="https://discord.gg/fynt" className="text-white/60 hover:text-white text-sm transition-colors">
                    Discord
                  </a>
                </li>
                <li>
                  <a href={GITHUB_URL} target="_blank" rel="noopener noreferrer" className="text-white/60 hover:text-white text-sm transition-colors">
                    GitHub
                  </a>
                </li>
                <li>
                  <a href="#support" className="text-white/60 hover:text-white text-sm transition-colors">
                    Support
                  </a>
                </li>
                <li>
                  <a href="#status" className="text-white/60 hover:text-white text-sm transition-colors">
                    Status
                  </a>
                </li>
              </ul>
            </div>

            <ColumnSeparator />

            
            <div className="flex-1">
              <h3 className="text-white font-semibold text-sm mb-4">
                Company
              </h3>
              <ul className="space-y-2">
                <li>
                  <a href="#about" className="text-white/60 hover:text-white text-sm transition-colors">
                    About
                  </a>
                </li>
                <li>
                  <a href="#contact" className="text-white/60 hover:text-white text-sm transition-colors">
                    Contact
                  </a>
                </li>
                <li>
                  <a href="#careers" className="text-white/60 hover:text-white text-sm transition-colors">
                    Careers
                  </a>
                </li>
              </ul>
            </div>
          </div>

          
          <FooterSectionSeparator />

          
          <div className="hidden xl:flex flex-col md:flex-row items-center justify-between pt-1 pb-6">
            <p className="text-white/60 text-sm mb-2 md:mb-0">
              © {currentYear} Fynt. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="/privacy" className="text-white/60 hover:text-white text-sm transition-colors">
                Privacy Policy
              </a>
              <a href="/terms" className="text-white/60 hover:text-white text-sm transition-colors">
                Terms of Service
              </a>
            </div>
          </div>
        </div>

        
        <div className="hidden xl:flex relative items-center justify-center translate-y-[10%] -mt-20">
          
          <svg width="100%" height="auto" viewBox="0 0 1366 494" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-6xl w-full h-auto absolute opacity-20">
            <path d="M31.605 484V120.364h240.767v63.387H108.487v86.648h147.905v63.388H108.487V484zM302.78 120.364h86.115l82.919 156.605h3.551l82.919-156.605h86.115L511.763 355.449V484h-76.349V355.449zm687.766 0V484H924.14L765.936 255.129h-2.664V484H686.39V120.364h67.472l156.96 228.693h3.196V120.364zm49.675 63.387v-63.387h298.65v63.387h-111.33V484h-76V183.751z" fill="none" stroke="#fff" strokeWidth="3"/>
          </svg>
          
          
          <svg width="100%" height="auto" viewBox="0 0 1366 494" fill="none" xmlns="http://www.w3.org/2000/svg" className="max-w-6xl w-full h-auto relative opacity-20">
            <path d="M31.605 484V120.364h240.767v63.387H108.487v86.648h147.905v63.388H108.487V484zM302.78 120.364h86.115l82.919 156.605h3.551l82.919-156.605h86.115L511.763 355.449V484h-76.349V355.449zm687.766 0V484H924.14L765.936 255.129h-2.664V484H686.39V120.364h67.472l156.96 228.693h3.196V120.364zm49.675 63.387v-63.387h298.65v63.387h-111.33V484h-76V183.751z" fill="#fff"/>
          </svg>
        </div>
      </div>
    </footer>);
}
