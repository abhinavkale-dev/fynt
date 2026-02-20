"use client";
import { motion } from "framer-motion";
import { HeroIllustration } from "../hero-illustrations/Hero-svg-fynt";
import { HeroMiddleIllustration } from "../hero-illustrations/Hero-svg-middle";
import { HeroBottomIllustration } from "../hero-illustrations/Hero-svg-bottom";
const EXPLOSION = {
    duration: 0.85,
    stagger: 0.12,
    initialDelay: 0.6,
} as const;
const FINAL_Y = {
    top: -108,
    middle: 0,
    bottom: 108,
} as const;
const EASE_OUT: [
    number,
    number,
    number,
    number
] = [0.23, 1, 0.32, 1];
interface HeroAnimationProps {
    className?: string;
}
const CORNERS = {
    topToMiddle: [
        { x: 331, y: 188 },
        { x: -161.7, y: 188 },
    ],
    middleToBottom: [
        { x: 332.9, y: 345 },
        { x: -160.5, y: 345 },
    ],
} as const;
function ConnectingLine({ x, topOffset, height, delay, direction, }: {
    x: number;
    topOffset: number;
    height: number;
    delay: number;
    direction: 'up' | 'down';
}) {
    return (<motion.div className="absolute pointer-events-none" style={{
            left: `calc(50% + ${x}px)`,
            top: topOffset,
            transformOrigin: direction === 'up' ? 'bottom center' : 'top center',
        }} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }} transition={{
            duration: EXPLOSION.duration,
            ease: EASE_OUT,
            delay,
        }}>
            <svg width="2" height={height} viewBox={`0 0 2 ${height}`} fill="none" xmlns="http://www.w3.org/2000/svg">
                <line x1="1" y1="0" x2="1" y2={height} stroke="#FFFFFF" strokeDasharray="8 8" strokeWidth="1"/>
            </svg>
        </motion.div>);
}
export function HeroAnimation({ className = "" }: HeroAnimationProps) {
    const lineHeight = Math.abs(FINAL_Y.top);
    return (<div className={`relative ${className}`}>
            <div className="flex flex-col items-center mt-24">
                
                <motion.div className="relative z-30 flex justify-center" initial={{ y: 0 }} animate={{ y: FINAL_Y.top }} transition={{
            duration: EXPLOSION.duration,
            ease: EASE_OUT,
            delay: EXPLOSION.initialDelay,
        }}>
                    <HeroIllustration />
                </motion.div>

                
                <div className="absolute inset-0 z-25 pointer-events-none">
                    {CORNERS.topToMiddle.map((corner, index) => (<ConnectingLine key={`top-middle-${index}`} x={corner.x} topOffset={corner.y} height={lineHeight} delay={EXPLOSION.initialDelay} direction="up"/>))}
                </div>

                
                <div className="relative z-20 flex justify-center -mt-72 ml-43">
                    <HeroMiddleIllustration />
                </div>

                
                <div className="absolute inset-0 z-15 pointer-events-none">
                    {CORNERS.middleToBottom.map((corner, index) => (<ConnectingLine key={`middle-bottom-${index}`} x={corner.x} topOffset={corner.y} height={lineHeight} delay={EXPLOSION.initialDelay} direction="down"/>))}
                </div>

                
                <motion.div className="relative z-10 flex justify-center -mt-79 ml-2.5" initial={{ y: 0 }} animate={{ y: FINAL_Y.bottom }} transition={{
            duration: EXPLOSION.duration,
            ease: EASE_OUT,
            delay: EXPLOSION.initialDelay,
        }}>
                    <HeroBottomIllustration />
                </motion.div>
            </div>
        </div>);
}
