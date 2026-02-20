import type { ReactNode } from "react";
import { F1Integrations } from "./F1Integrations";
import { F2WorkflowRunning } from "./F2WorkflowRunning";
import { F3AIModels } from "./F3AIModels";
import { F4Templates } from "./F4Templates";
type BentoShellProps = {
    children: ReactNode;
    outerRadius: string;
    midRadius: string;
    innerRadius: string;
};
function BentoShell({ children, outerRadius, midRadius, innerRadius, }: BentoShellProps) {
    return (<div className={`bg-[#1A1A1A] p-[5px] ${outerRadius}`}>
      <div className={`border border-white/10 p-[2px] ${midRadius}`}>
        <div className={`overflow-hidden border border-white/5 ${innerRadius}`}>
          {children}
        </div>
      </div>
    </div>);
}
export function BentoGrid() {
    return (<div className="relative z-10 w-full max-w-[1200px] xl:max-w-[1240px] mx-auto px-2 sm:px-3 md:px-4 lg:px-0">
      <div className="grid items-start grid-cols-1 lg:grid-cols-[1.12fr_1fr_1.12fr] xl:grid-cols-[1.1fr_1fr_1.1fr] gap-4 md:gap-5 lg:gap-3 xl:gap-4">
        
        <BentoShell outerRadius="rounded-[32px] sm:rounded-[36px] lg:rounded-[42px] xl:rounded-[50px]" midRadius="rounded-[29px] sm:rounded-[33px] lg:rounded-[39px] xl:rounded-[47px]" innerRadius="rounded-[26px] sm:rounded-[30px] lg:rounded-[36px] xl:rounded-[44px]">
          <F1Integrations />
        </BentoShell>

        
        <div className="flex flex-col gap-4 md:gap-5 lg:gap-3 xl:gap-4">
          <BentoShell outerRadius="rounded-[32px] sm:rounded-[36px] lg:rounded-[42px] xl:rounded-[50px]" midRadius="rounded-[29px] sm:rounded-[33px] lg:rounded-[39px] xl:rounded-[47px]" innerRadius="rounded-[26px] sm:rounded-[30px] lg:rounded-[36px] xl:rounded-[44px]">
            <F2WorkflowRunning />
          </BentoShell>
          <BentoShell outerRadius="rounded-[36px] sm:rounded-[40px] lg:rounded-[48px] xl:rounded-[58px]" midRadius="rounded-[33px] sm:rounded-[37px] lg:rounded-[45px] xl:rounded-[55px]" innerRadius="rounded-[30px] sm:rounded-[34px] lg:rounded-[42px] xl:rounded-[52px]">
            <F3AIModels />
          </BentoShell>
        </div>

        
        <BentoShell outerRadius="rounded-[32px] sm:rounded-[36px] lg:rounded-[42px] xl:rounded-[50px]" midRadius="rounded-[29px] sm:rounded-[33px] lg:rounded-[39px] xl:rounded-[47px]" innerRadius="rounded-[26px] sm:rounded-[30px] lg:rounded-[36px] xl:rounded-[44px]">
          <F4Templates />
        </BentoShell>
      </div>
    </div>);
}
