"use client";
import React from "react";
import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { EASE_OUT_QUAD } from "@/lib/animation/variants";
const authContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } },
};
const authItem = {
    hidden: { opacity: 0, y: 8 },
    show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: EASE_OUT_QUAD } },
};
const marketingContainer = {
    hidden: {},
    show: { transition: { staggerChildren: 0.08, delayChildren: 0.25 } },
};
const marketingItem = {
    hidden: { opacity: 0, x: 12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.25, ease: EASE_OUT_QUAD } },
};
const marketingSvgItem = {
    hidden: { opacity: 0, x: 12 },
    show: { opacity: 1, x: 0, transition: { duration: 0.35, ease: EASE_OUT_QUAD } },
};
function Logo() {
    return (<svg width="50" height="50" viewBox="0 0 65 64" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" fill="#F04D26"/>
      <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" fill="#F04D26"/>
      <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" fill="#F04D26"/>
      <path d="M4.52268 63.5L7.72607 46.0593H25.8786L22.3193 63.5H4.52268Z" stroke="white" strokeOpacity="0.3"/>
      <path d="M26.5905 46.0593L30.5057 27.5508H48.3023L44.0312 46.0593H26.5905Z" stroke="white" strokeOpacity="0.3"/>
      <path d="M19.4718 36.8051L23.3871 18.6525H60.0481L63.6074 0.5H7.72607L0.607422 36.8051H19.4718Z" stroke="white" strokeOpacity="0.3"/>
    </svg>);
}
function FyntSvg() {
    return (<svg width="280" height="280" viewBox="0 0 114 88" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M105.951 6.012q-5.37-3.105-12.96-3.12c-5.05-.01-9.36 1.01-12.93 3.07q-4.425 2.55-5.19 6c-.1.44-.15.86-.16 1.29v.13q0 2.655 2.28 5.07l-2.28 1.32-7.86 4.53-28.29-.05c-.44-.82-1.05-1.61-1.82-2.38s-1.72-1.47-2.83-2.11q-5.385-3.105-12.96-3.12c-5.06-.01-9.37 1.01-12.93 3.07s-5.34 4.54-5.32 7.46c.01 2.92 1.81 5.42 5.4 7.49 2.04 1.18 4.32 2.02 6.83 2.53 1.9.39 3.95.58 6.13.59 2.14 0 4.15-.18 6.02-.55 2.55-.5 4.86-1.34 6.91-2.53 1.11-.64 2.04-1.34 2.81-2.1.76-.76 1.36-1.55 1.79-2.37l25.33.04.08 14.02v.61c-1.41.25-2.78.59-4.11 1.03-1.32.45-2.53.99-3.64 1.63-1.43.83-2.58 1.72-3.43 2.69-1.27 1.43-1.9 3.03-1.89 4.77.01 2.92 1.81 5.41 5.4 7.48 2.06 1.19 4.37 2.04 6.92 2.54 1.88.38 3.9.57 6.04.58 2.08 0 4.03-.17 5.86-.52 2.62-.48 4.97-1.34 7.07-2.55 3.54-2.05 5.32-4.52 5.32-7.41v-.05c-.01-2.92-1.81-5.42-5.4-7.49-1.07-.61-2.23-1.14-3.47-1.56-.05-.02-.1-.03-.15-.05-1.29-.43-2.65-.77-4.07-1.02l-.06-5.02-.12-11.37.44-.25 9.7-5.6c.87.28 1.75.51 2.65.69 2.73.58 5.59.76 8.59.53 1.2-.09 2.35-.24 3.46-.47 2.56-.49 4.87-1.34 6.92-2.53 3.56-2.04 5.33-4.53 5.33-7.44v-.02c-.02-2.92-1.82-5.41-5.41-7.48Zm-79.38 24.41c-1.54.89-3.38 1.33-5.54 1.32-2.16 0-4.01-.45-5.56-1.34-1.54-.89-2.32-1.96-2.32-3.21-.01-1.24.75-2.31 2.29-3.2 1.54-.88 3.38-1.33 5.54-1.32 2.16 0 4.01.45 5.55 1.34 1.55.9 2.33 1.96 2.33 3.21.01 1.25-.75 2.31-2.29 3.2Zm47.73 21.2c.16.07.32.15.47.24 1.54.89 2.32 1.96 2.32 3.21 0 1.24-.75 2.31-2.29 3.2-.14.08-.28.15-.42.22-1.45.73-3.15 1.1-5.12 1.1s-3.8-.4-5.3-1.2c-.09-.04-.17-.09-.26-.14-1.54-.9-2.32-1.97-2.32-3.21-.01-1.25.75-2.31 2.29-3.2.08-.05.17-.1.26-.14 1.48-.8 3.24-1.19 5.28-1.19 1.95.01 3.64.38 5.09 1.11Zm24.31-34.95c-1.53.89-3.38 1.33-5.54 1.32-2.15 0-4.01-.45-5.55-1.34-1.55-.89-2.32-1.96-2.33-3.21-.01-1.24.76-2.31 2.29-3.2 1.54-.88 3.39-1.32 5.54-1.32s4.01.45 5.56 1.34c1.55.9 2.32 1.97 2.33 3.21 0 1.25-.76 2.31-2.3 3.2Z" stroke="#ff8c69"/>
      <path d="M100.911 13.472c0 1.25-.76 2.31-2.3 3.2-1.53.89-3.38 1.33-5.54 1.32-2.15 0-4.01-.45-5.55-1.34-1.55-.89-2.32-1.96-2.33-3.21-.01-1.24.76-2.31 2.29-3.2 1.54-.88 3.39-1.32 5.54-1.32s4.01.45 5.56 1.34c1.55.9 2.32 1.97 2.33 3.21Zm-23.82 41.6c0 1.24-.75 2.31-2.29 3.2-.14.08-.28.15-.42.22-1.45.73-3.15 1.1-5.12 1.1s-3.8-.4-5.3-1.2c-.09-.04-.17-.09-.26-.14-1.54-.9-2.32-1.97-2.32-3.21-.01-1.25.75-2.31 2.29-3.2.08-.05.17-.1.26-.14 1.48-.8 3.24-1.19 5.28-1.19 1.95.01 3.64.38 5.09 1.11.16.07.32.15.47.24 1.54.89 2.32 1.96 2.32 3.21Zm-48.23-27.85c.01 1.25-.75 2.31-2.29 3.2s-3.38 1.33-5.54 1.32c-2.16 0-4.01-.45-5.56-1.34-1.54-.89-2.32-1.96-2.32-3.21-.01-1.24.75-2.31 2.29-3.2 1.54-.88 3.38-1.33 5.54-1.32 2.16 0 4.01.45 5.55 1.34 1.55.9 2.33 1.96 2.33 3.21Zm82.5-13.71v19.98c.01 2.92-1.76 5.41-5.33 7.46-2.94 1.71-6.41 2.71-10.38 3-3.98.3-7.72-.11-11.24-1.22v-20c.87.28 1.75.51 2.65.69 2.73.58 5.59.76 8.59.53 1.2-.09 2.35-.24 3.46-.47 2.56-.49 4.87-1.34 6.92-2.53 3.56-2.04 5.33-4.53 5.33-7.44Zm-26.95 9.219v20l-5.74 3.31s-.1-.03-.15-.05c-1.29-.43-2.65-.77-4.07-1.02l-.06-5.02-.12-11.37.44-.25zm-7.419-4.279-2.28 1.32v-6.39q0 2.655 2.28 5.07Z" stroke="#F04D26"/>
      <path d="M87.541 55.142v19.95c.02 2.91-1.76 5.4-5.32 7.46s-7.87 3.08-12.93 3.07q-7.575-.015-12.96-3.12c-3.59-2.07-5.39-4.56-5.4-7.48v-20c.01 2.92 1.81 5.41 5.4 7.48 2.06 1.19 4.37 2.04 6.92 2.54 1.88.38 3.9.57 6.04.58 2.08 0 4.03-.17 5.86-.52 2.62-.48 4.97-1.34 7.07-2.55 3.54-2.05 5.32-4.52 5.32-7.41Zm-23.54-10.851v.61c-1.41.25-2.78.59-4.11 1.03-1.32.45-2.53.99-3.64 1.63-1.43.83-2.58 1.72-3.43 2.69l-14.23-.02v-20l25.33.04zm-25.41-14.059v20c-.43.82-1.03 1.61-1.79 2.37-.77.76-1.7 1.46-2.81 2.1-3.56 2.06-7.87 3.09-12.93 3.08q-7.575-.015-12.96-3.12c-3.59-2.07-5.39-4.57-5.4-7.49v-20c.01 2.92 1.81 5.42 5.4 7.49 2.04 1.18 4.32 2.02 6.83 2.53 1.9.39 3.95.58 6.13.59 2.14 0 4.15-.18 6.02-.55 2.55-.5 4.86-1.34 6.91-2.53 1.11-.64 2.04-1.34 2.81-2.1.76-.76 1.36-1.55 1.79-2.37Z" stroke="#F04D26"/>
    </svg>);
}
function LeftRulerTicks() {
    return (<div className="ruler-ticks absolute -left-3 top-0 flex flex-col gap-10 text-xs font-mono origin-left">
      <div className="flex items-center gap-2 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">0</span></div>
      <div className="flex items-center gap-1 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">50</span></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">100</span></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">150</span></div>
        <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">200</span></div>
        <div className="flex items-center gap-0.5 text-white/30"><span className="w-1 h-px bg-white/30"/><span className="rotate-90">250</span></div>
      <div className="flex items-center gap-0.5 text-white/25"><span className="w-1 h-px bg-white/25"/><span className="rotate-90">300</span></div>
      <div className="flex items-center gap-0.5 text-white/20"><span className="w-1 h-px bg-white/20"/><span className="rotate-90">350</span></div>
      <div className="flex items-center gap-0.5 text-white/15"><span className="w-1 h-px bg-white/15"/><span className="rotate-90">400</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">450</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">500</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">550</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">600</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">650</span></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="w-1 h-px bg-white/10"/><span className="rotate-90">700</span></div>
    </div>);
}
function RightRulerTicks() {
    return (<div className="ruler-ticks absolute -right-3 top-0 flex flex-col gap-10 text-xs font-mono origin-right">
      <div className="flex items-center gap-2 text-white/30" style={{ transform: 'translateX(7px)' }}><span className="-rotate-90">0</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-1 text-white/30" style={{ transform: 'translateX(5px)' }}><span className="-rotate-90">50</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">100</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">150</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">200</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-0.5 text-white/30"><span className="-rotate-90">250</span><span className="w-1 h-px bg-white/30"/></div>
      <div className="flex items-center gap-0.5 text-white/25"><span className="-rotate-90">300</span><span className="w-1 h-px bg-white/25"/></div>
      <div className="flex items-center gap-0.5 text-white/20"><span className="-rotate-90">350</span><span className="w-1 h-px bg-white/20"/></div>
      <div className="flex items-center gap-0.5 text-white/15"><span className="rotate-90">400</span><span className="w-1 h-px bg-white/15"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">450</span><span className="w-1 h-px bg-white/10"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">500</span><span className="w-1 h-px bg-white/10"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">550</span><span className="w-1 h-px bg-white/10"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">600</span><span className="w-1 h-px bg-white/10"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">650</span><span className="w-1 h-px bg-white/10"/></div>
      <div className="flex items-center gap-0.5 text-white/10"><span className="-rotate-90">700</span><span className="w-1 h-px bg-white/10"/></div>
    </div>);
}
interface AuthLayoutProps {
    children: React.ReactNode;
    title: string | React.ReactNode;
    subtitle?: string;
    marketingTitle: string | React.ReactNode;
    marketingDescription: string[];
}
export function AuthLayout({ children, title, subtitle, marketingTitle, marketingDescription, }: AuthLayoutProps) {
    const prefersReducedMotion = useReducedMotion();
    return (<div className="min-h-screen bg-[#151515] overflow-hidden">
      
      <div className="absolute inset-4 md:inset-8 border border-white/10 rounded-2xl pointer-events-none hidden md:block"/>

      
      <div className="relative min-h-screen flex items-center justify-center p-4 md:p-8">

        
        <motion.div className="absolute top-4 md:top-8 left-[calc(50%-320px)] md:left-[calc(50%-400px)] w-px h-[calc(50%-200px)] bg-white/20 hidden lg:block" initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute top-4 md:top-8 right-[calc(50%-320px)] md:right-[calc(50%-400px)] w-px h-[calc(50%-200px)] bg-white/20 hidden lg:block" initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute bottom-4 md:bottom-8 left-[calc(50%-320px)] md:left-[calc(50%-400px)] w-px h-[calc(50%-200px)] bg-white/20 hidden lg:block" initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute bottom-4 md:bottom-8 right-[calc(50%-320px)] md:right-[calc(50%-400px)] w-px h-[calc(50%-200px)] bg-white/20 hidden lg:block" initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4, ease: "easeOut" }}/>

        
        <motion.div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-[calc(50%-400px)] h-px bg-white/20 hidden lg:block" style={{ marginTop: '-200px' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-[calc(50%-400px)] h-px bg-white/20 hidden lg:block" style={{ marginTop: '-200px' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute left-4 md:left-8 top-1/2 -translate-y-1/2 w-[calc(50%-400px)] h-px bg-white/20 hidden lg:block" style={{ marginTop: '200px' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6, duration: 0.4, ease: "easeOut" }}/>
        <motion.div className="absolute right-4 md:right-8 top-1/2 -translate-y-1/2 w-[calc(50%-400px)] h-px bg-white/20 hidden lg:block" style={{ marginTop: '200px' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.65, duration: 0.4, ease: "easeOut" }}/>

        
        <motion.div className="absolute left-12 top-1/2 pointer-events-none hidden lg:block" style={{ transform: 'translateY(calc(-50% - 400px))' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4, ease: "easeOut" }}>
          <LeftRulerTicks />
        </motion.div>
        <motion.div className="absolute right-12 top-1/2 pointer-events-none hidden lg:block" style={{ transform: 'translateY(calc(-50% - 400px))' }} initial={prefersReducedMotion ? false : { opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7, duration: 0.4, ease: "easeOut" }}>
          <RightRulerTicks />
        </motion.div>

        
        <motion.div className="relative w-full max-w-5xl bg-[#151515] md:bg-[#151515]/80 md:backdrop-blur-xl border border-white/10 rounded-3xl md:rounded-[40px] md:shadow-2xl md:shadow-black/50 overflow-visible z-10" initial={prefersReducedMotion ? false : { opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3, ease: EASE_OUT_QUAD }}>

          
          <div className="relative flex items-center justify-center gap-3 pt-8 pb-4 md:pt-10 md:pb-6 border-b border-white/5">
            <Link href="/" className="absolute left-6 md:left-8 hover:opacity-80 transition-opacity">
              <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="40px" height="40px" viewBox="0 0 40 40">
                <circle cx="20" cy="20" r="19" fill="none" stroke="#F7F8F8" strokeWidth="1" opacity="0.2"/>
                <path d="M24.5 28C24.308 28 24.116 27.9271 23.97 27.7801L17.72 21.5301C17.427 21.2371 17.427 20.762 17.72 20.469L23.97 14.22C24.263 13.927 24.738 13.927 25.031 14.22C25.324 14.513 25.324 14.988 25.031 15.281L19.311 21.001L25.031 26.721C25.324 27.014 25.324 27.489 25.031 27.782C24.885 27.928 24.693 28.002 24.501 28.002L24.5 28Z" fill="#F7F8F8" transform="translate(-2, -2)"></path>
              </svg>
            </Link>
            <div className="flex items-center gap-3">
              <Logo />
              <span className="text-white text-xl font-medium tracking-tight">Fynt</span>
            </div>
          </div>

          
          <div className="grid lg:grid-cols-2">

            
            <div className="px-6 py-8 md:px-12 md:py-10 lg:border-r lg:border-white/5">
              <motion.div className="max-w-sm mx-auto lg:mx-0" variants={prefersReducedMotion ? undefined : authContainer} initial="hidden" animate="show">
                <motion.div className="mb-2" variants={prefersReducedMotion ? undefined : authItem}>
                  {typeof title === 'string' ? (<h1 className="font-serif text-3xl md:text-4xl text-white">
                      {title}
                    </h1>) : (title)}
                </motion.div>
                {subtitle && (<motion.p className="text-[#7D7D87] text-sm mb-8" variants={prefersReducedMotion ? undefined : authItem}>
                    {subtitle}
                  </motion.p>)}

                <motion.div variants={prefersReducedMotion ? undefined : authItem}>
                  {children}
                </motion.div>
              </motion.div>
            </div>

            
            <div className="hidden lg:block relative px-12 py-10 bg-[#1e1e1e]/50 rounded-br-3xl md:rounded-br-[40px]">
              <motion.div className="relative z-10" variants={prefersReducedMotion ? undefined : marketingContainer} initial="hidden" animate="show">
                <motion.div className="mb-6 leading-tight" variants={prefersReducedMotion ? undefined : marketingItem}>
                  {typeof marketingTitle === 'string' ? (<h2 className="font-serif text-3xl text-white">
                      {marketingTitle}
                    </h2>) : (marketingTitle)}
                </motion.div>

                <motion.div className="space-y-4" variants={prefersReducedMotion ? undefined : marketingItem}>
                  {marketingDescription.map((paragraph, index) => (<p key={index} className="text-[#9CA3AF] text-sm leading-relaxed">
                      {paragraph}
                    </p>))}
                </motion.div>

                
                <motion.div className="mt-8 flex justify-center" variants={prefersReducedMotion ? undefined : marketingSvgItem}>
                  <FyntSvg />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </div>);
}
interface OAuthButtonProps {
    provider: "google" | "microsoft";
    onClick?: () => void;
}
export function OAuthButton({ provider, onClick }: OAuthButtonProps) {
    const config = {
        google: {
            label: "Continue with Google",
            icon: (<svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
        </svg>),
        },
        microsoft: {
            label: "Continue with Microsoft",
            icon: (<svg className="w-5 h-5" viewBox="0 0 24 24">
          <path fill="#F25022" d="M1 1h10v10H1z"/>
          <path fill="#00A4EF" d="M1 13h10v10H1z"/>
          <path fill="#7FBA00" d="M13 1h10v10H13z"/>
          <path fill="#FFB900" d="M13 13h10v10H13z"/>
        </svg>),
        },
    };
    const { label, icon } = config[provider];
    return (<button type="button" onClick={onClick} className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[#252525] hover:bg-[#2d2d2d] border border-white/10 hover:border-white/20 rounded-xl text-white text-sm font-medium transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-[#F04D26]/50 focus:ring-offset-2 focus:ring-offset-[#151515]">
      {icon}
      {label}
    </button>);
}
export function Divider() {
    return (<div className="relative my-6">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-white/10"/>
      </div>
      <div className="relative flex justify-center text-xs uppercase">
        <span className="bg-[#151515] px-3 text-[#6B7280]">or</span>
      </div>
    </div>);
}
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label: string;
    icon?: React.ReactNode;
}
export function AuthInput({ label, icon, ...props }: InputProps) {
    return (<div className="space-y-2">
      <label className="block text-sm font-medium text-[#9CA3AF]">
        {label}
        {props.required && <span className="text-[#F04D26]">*</span>}
      </label>
      <div className="relative">
        {icon && (<div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#6B7280]">
            {icon}
          </div>)}
        <input {...props} className={`
            w-full px-4 py-3
            ${icon ? "pl-11" : ""}
            bg-[#252525] border border-white/10
            rounded-xl text-white placeholder-[#6B7280]
            focus:outline-none focus:border-[#F04D26]/50 focus:ring-2 focus:ring-[#F04D26]/20
            transition-all duration-150
          `}/>
      </div>
    </div>);
}
interface PrimaryButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    children: React.ReactNode;
    isLoading?: boolean;
}
export function PrimaryButton({ children, isLoading, ...props }: PrimaryButtonProps) {
    return (<button {...props} disabled={isLoading || props.disabled} className={`
        w-full py-3.5 px-4
        bg-gradient-to-r from-[#F04D26] to-[#E63D00]
        hover:from-[#E63D00] hover:to-[#CC3600]
        text-white font-medium rounded-xl
        shadow-lg shadow-[#F04D26]/25
        transition-all duration-150
        focus:outline-none focus:ring-2 focus:ring-[#F04D26]/50 focus:ring-offset-2 focus:ring-offset-[#1a1a1a]
        active:scale-[0.98]
        disabled:opacity-50 disabled:cursor-not-allowed disabled:active:scale-100
      `}>
      {isLoading ? (<div className="flex items-center justify-center gap-2">
          <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"/>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/>
          </svg>
          <span>Please wait...</span>
        </div>) : (children)}
    </button>);
}
export function FooterDisclaimer() {
    return (<p className="mt-8 text-xs text-[#6B7280] text-center leading-relaxed">
      By continuing, you agree to our{" "}
      <a href="#" className="text-[#F04D26] underline hover:no-underline">
        Terms of Service
      </a>{" "}
      and{" "}
      <a href="#" className="text-[#F04D26] underline hover:no-underline">
        Privacy Policy
      </a>
      .
    </p>);
}
