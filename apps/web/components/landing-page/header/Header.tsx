'use client';
import React from 'react';
import Link from 'next/link';
import { SideLine } from './SideLine';
import { motion } from 'framer-motion';
const handleSmoothScroll = (e: React.MouseEvent<HTMLAnchorElement>, targetId: string) => {
    e.preventDefault();
    const element = document.getElementById(targetId);
    if (element) {
        const viewport = element.closest<HTMLElement>('[data-slot="scroll-area-viewport"]');
        if (viewport) {
            const viewportRect = viewport.getBoundingClientRect();
            const elementRect = element.getBoundingClientRect();
            const baseTop = viewport.scrollTop + (elementRect.top - viewportRect.top);
            const sectionOverflow = Math.max(0, elementRect.height - viewport.clientHeight);
            const overflowCompensation = sectionOverflow > 0 ? Math.min(sectionOverflow, 96) : 0;
            const top = baseTop + overflowCompensation;
            viewport.scrollTo({ top: Math.max(0, top), behavior: 'smooth' });
            return;
        }
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
};
const NodeSvg = () => (<svg width="9" height="9" viewBox="0 0 9 9" fill="none" xmlns="http://www.w3.org/2000/svg">
        <rect x="0.5" y="0.5" width="8" height="8" rx="2" fill="#F04D26"/>
    </svg>);
export default function Header() {
    return (<div className="flex flex-col items-center pt-3 md:pt-4">
            
            <div className="relative z-20 flex w-full items-center justify-center gap-6 lg:gap-8 px-4 lg:px-0">

                
                <div className="absolute inset-0 w-[80%] mx-auto pointer-events-none hidden lg:block">
                    <div className="absolute left-2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-30">
                        <NodeSvg />
                    </div>
                    <div className="absolute right-2 top-1/2 translate-x-1/2 -translate-y-1/2 z-30">
                        <NodeSvg />
                    </div>
                </div>

                
                <SideLine side="left"/>
                
                
                <header className={`
                    relative z-10 flex h-14 items-center justify-between gap-3
                    bg-[#151515]/95 backdrop-blur-md
                    border border-white/10
                    rounded-2xl md:rounded-3xl
                    px-3.5 lg:h-auto lg:p-3
                    w-full max-w-[calc(100vw-2rem)] sm:w-[90%] md:w-[85%] lg:w-auto md:shadow-lg md:shadow-black/20
                `}>

                    
                    <div className="flex items-center pl-2 lg:pl-3">
                        <Link href="/" className="focus:outline-none flex items-center gap-2">
                            <svg width="28" height="28" viewBox="0 0 65 64" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" fill="#D97757"/>
                                <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" fill="#F04D26"/>
                                <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" fill="#D97757"/>
                                <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" fill="#F04D26"/>
                                <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" fill="#D97757"/>
                                <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" fill="#F04D26"/>
                                <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" stroke="white"/>
                                <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" stroke="white"/>
                                <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" stroke="white"/>
                            </svg>
                        </Link>
                    </div>

                    
                    <nav className="hidden lg:flex items-center gap-5 mx-10">
                        <Link href="#features" onClick={(e) => handleSmoothScroll(e, 'features')} className="text-sm font-medium text-[#C1B9B9] hover:text-white transition-colors duration-150 ease motion-reduce:transition-none">
                            Features
                        </Link>
                        <Link href="#playground" onClick={(e) => handleSmoothScroll(e, 'playground')} className="text-sm font-medium text-[#C1B9B9] hover:text-white transition-colors duration-150 ease motion-reduce:transition-none">
                            Playground
                        </Link>
                        <Link href="#templates" onClick={(e) => handleSmoothScroll(e, 'templates')} className="text-sm font-medium text-[#C1B9B9] hover:text-white transition-colors duration-150 ease motion-reduce:transition-none">
                            Templates
                        </Link>
                        <Link href="#pricing" onClick={(e) => handleSmoothScroll(e, 'pricing')} className="text-sm font-medium text-[#C1B9B9] hover:text-white transition-colors duration-150 ease motion-reduce:transition-none">
                            Pricing
                        </Link>
                    </nav>

                    
                    <div className="flex items-center pr-2 lg:pr-3">
                        <motion.a href="/home" className="group bg-[#F04D26] hover:bg-[#F04D26]/90 text-white rounded-[11px] px-3.5 h-8 text-sm font-medium flex items-center gap-2 transition-[background-color,transform] duration-150 ease focus:outline-none active:scale-[0.97] motion-reduce:transition-none" initial="idle" whileHover="hover">
                            <span>Login</span>
                            <svg width="24" height="24" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="text-white/80 group-hover:text-white transition-colors w-4 h-4 sm:w-5 sm:h-5">
                                <path opacity="0.4" d="M26.2214 29.3337H14.6658C12.9506 29.3337 11.5547 27.9377 11.5547 26.2225V5.7781C11.5547 4.0629 12.9506 2.66699 14.6658 2.66699H26.2214C27.9366 2.66699 29.3325 4.0629 29.3325 5.7781V26.2225C29.3325 27.9377 27.9366 29.3337 26.2214 29.3337Z" fill="currentColor"/>
                                <path d="M19.5547 9.87893V22.1219C19.5547 23.2044 20.1033 24.1923 21.0251 24.766L27.7325 28.925C28.6829 28.392 29.3341 27.3868 29.3341 26.2218V5.77742C29.3341 4.61333 28.6834 3.60817 27.7339 3.0752L21.0251 7.23411C20.1049 7.80531 19.5547 8.79377 19.5547 9.87893Z" fill="currentColor"/>
                                <motion.path d="M12.9422 15.0579L8.05333 10.169C7.53244 9.6481 6.68798 9.6481 6.16709 10.169C5.6462 10.6899 5.6462 11.5343 6.16709 12.0552L8.78044 14.6685H1.33333C0.597333 14.6685 0 15.2659 0 16.0019C0 16.7379 0.597333 17.3352 1.33333 17.3352H8.78044L6.16709 19.9486C5.6462 20.4694 5.6462 21.3139 6.16709 21.8348C6.42665 22.0943 6.76798 22.2259 7.10932 22.2259C7.45065 22.2259 7.79198 22.0961 8.05154 21.8348L12.9404 16.9459C13.4613 16.425 13.4613 15.5805 12.9404 15.0597L12.9422 15.0579Z" fill="currentColor" variants={{
            idle: { x: 0, opacity: 0.8 },
            hover: { x: 3, opacity: 1 }
        }} transition={{
            duration: 0.2,
            ease: [0.23, 1, 0.32, 1]
        }}/>
                            </svg>
                        </motion.a>
                    </div>
                </header>

                
                <SideLine side="right"/>
            </div>
        </div>);
}
