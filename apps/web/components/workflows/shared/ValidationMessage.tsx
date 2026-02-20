import { motion, AnimatePresence } from "framer-motion";
interface ValidationMessageProps {
    missingFields: string[];
}
export function ValidationMessage({ missingFields }: ValidationMessageProps) {
    return (<AnimatePresence>
      {missingFields.length > 0 && (<motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.2, ease: "easeOut" }} className="overflow-hidden">
          <div className="rounded-md bg-amber-500/10 border border-amber-500/20 px-3 py-2.5">
            <div className="flex items-start gap-2">
              <svg className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="text-xs font-medium text-amber-500/90">
                  Required fields missing
                </p>
                <p className="text-xs text-amber-500/70 mt-0.5">
                  Please fill in: {missingFields.join(', ')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>)}
    </AnimatePresence>);
}
