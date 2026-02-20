'use client';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
interface UsageCounterProps {
    runCount: number;
    monthlyRunLimit: number;
}
export function UsageCounter({ runCount, monthlyRunLimit, }: UsageCounterProps) {
    if (monthlyRunLimit === -1) {
        return null;
    }
    const pct = runCount / monthlyRunLimit;
    return (<Tooltip>
      <TooltipTrigger asChild>
        <div className={`text-xs font-medium px-2 py-1 rounded cursor-default ${pct > 0.8 ? 'text-yellow-400 bg-yellow-500/10' : 'text-white/40'}`}>
          {runCount.toLocaleString()}/{monthlyRunLimit.toLocaleString()}
        </div>
      </TooltipTrigger>
      <TooltipContent>
        Workflow executions this month.
      </TooltipContent>
    </Tooltip>);
}
