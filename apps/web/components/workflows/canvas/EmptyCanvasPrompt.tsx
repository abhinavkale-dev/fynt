'use client';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { DrawerTrigger } from '@/components/ui/drawer';
const TIMING = {
    textDelay: 0.2,
    floatDelay: 0.5,
};
const CARD_ANIM = {
    initialScale: 0.95,
    spring: { type: "spring" as const, stiffness: 350, damping: 25 },
};
const FLOAT = {
    amplitude: 3,
    duration: 3,
};
export function EmptyCanvasPrompt() {
    return (<div className="absolute inset-0 flex flex-col justify-center items-center gap-3 z-10 pointer-events-none">
      <DrawerTrigger asChild>
        <motion.div initial={{ opacity: 0, scale: CARD_ANIM.initialScale }} animate={{
            opacity: 1,
            scale: 1,
            y: [0, -FLOAT.amplitude, 0],
        }} transition={{
            opacity: { duration: 0.2, ease: 'easeOut' },
            scale: CARD_ANIM.spring,
            y: {
                duration: FLOAT.duration,
                repeat: Infinity,
                ease: 'easeInOut',
                delay: TIMING.floatDelay,
            },
        }} className="pointer-events-auto">
          <Card className="card hover:shadow-lg transition-shadow cursor-pointer border-2 border-dashed border-white/50 hover:border-white/80 h-[100px] w-[100px] p-4 flex flex-col justify-center items-center" style={{ backgroundColor: '#414243' }}>
            <div className="relative">
              
              <div className="absolute inset-0 rounded-full bg-white/10" style={{ animation: 'pulse-ring 2s ease-in-out infinite' }}/>
              <div className="rounded-full bg-white/10 p-2 relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="40px" height="40px" viewBox="0 0 18 18">
                  <path opacity="0.4" d="M14.7501 9.75H3.25009C2.83599 9.75 2.50009 9.4141 2.50009 9C2.50009 8.5859 2.83599 8.25 3.25009 8.25H14.7501C15.1642 8.25 15.5001 8.5859 15.5001 9C15.5001 9.4141 15.1642 9.75 14.7501 9.75Z" fill="rgba(255, 255, 255, 0.6)"/>
                  <path d="M9.00009 15.5C8.58599 15.5 8.25009 15.1641 8.25009 14.75V3.25C8.25009 2.8359 8.58599 2.5 9.00009 2.5C9.41419 2.5 9.75009 2.8359 9.75009 3.25V14.75C9.75009 15.1641 9.41419 15.5 9.00009 15.5Z" fill="rgba(255, 255, 255, 0.6)"/>
                </svg>
              </div>
            </div>
          </Card>
        </motion.div>
      </DrawerTrigger>

      <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: TIMING.textDelay, duration: 0.2, ease: 'easeOut' }} className="text-sm text-white/70 pointer-events-auto">
        Add first step&hellip;
      </motion.p>
    </div>);
}
