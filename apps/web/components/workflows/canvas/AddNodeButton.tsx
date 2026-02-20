'use client';
import { motion } from 'framer-motion';
import { DrawerTrigger } from '@/components/ui/drawer';
interface AddNodeButtonProps {
    showPulse?: boolean;
}
export function AddNodeButton({ showPulse }: AddNodeButtonProps) {
    return (<motion.div className="absolute top-4 right-4 z-10" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ type: 'spring', stiffness: 400, damping: 25, delay: 0.1 }}>
            <DrawerTrigger asChild>
                <button className="relative rounded-full bg-white/10 hover:bg-white/20 p-3 transition-[background-color,transform] duration-150 ease-out shadow-lg border border-white/20 active:scale-[0.93]" aria-label="Add node">
                    {showPulse && (<span className="absolute inset-0 rounded-full animate-ping bg-white/10" style={{ animationDuration: '2s' }}/>)}
                    <svg xmlns="http://www.w3.org/2000/svg" width="24px" height="24px" viewBox="0 0 18 18">
                        <path opacity="0.4" d="M14.7501 9.75H3.25009C2.83599 9.75 2.50009 9.4141 2.50009 9C2.50009 8.5859 2.83599 8.25 3.25009 8.25H14.7501C15.1642 8.25 15.5001 8.5859 15.5001 9C15.5001 9.4141 15.1642 9.75 14.7501 9.75Z" fill="currentColor" className="text-white"/>
                        <path d="M9.00009 15.5C8.58599 15.5 8.25009 15.1641 8.25009 14.75V3.25C8.25009 2.8359 8.58599 2.5 9.00009 2.5C9.41419 2.5 9.75009 2.8359 9.75009 3.25V14.75C9.75009 15.1641 9.41419 15.5 9.00009 15.5Z" fill="currentColor" className="text-white"/>
                    </svg>
                </button>
            </DrawerTrigger>
        </motion.div>);
}
