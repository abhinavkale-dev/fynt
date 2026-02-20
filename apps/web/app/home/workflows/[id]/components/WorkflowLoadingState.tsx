'use client';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
export function WorkflowLoadingState() {
    return (<div className="flex h-full min-h-0 flex-col overflow-hidden">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <Skeleton className="h-8 w-8 rounded-md bg-white/5"/>
        <Separator orientation="vertical" className="mr-2 h-4"/>

        <div className="flex flex-1 items-center gap-2">
          <div className="flex items-center gap-2">
            <Skeleton className="h-5 w-5 rounded-full bg-white/5"/>
            <Skeleton className="h-4 w-14 bg-white/5"/>
          </div>
          <span className="text-white/35 text-sm">/</span>
          <Skeleton className="h-4 w-36 bg-white/5"/>
        </div>

        <div className="absolute left-1/2 -translate-x-1/2">
          <Skeleton className="h-7 w-16 rounded-md bg-white/5"/>
        </div>

        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-14 rounded-md bg-white/5"/>
          <Skeleton className="h-6 w-16 rounded-md bg-white/5"/>
        </div>
      </header>

      <div className="relative flex-1 overflow-hidden rounded-br-lg bg-[#141414]">
        <div className="absolute inset-0 [background-image:radial-gradient(circle,rgba(255,255,255,0.09)_1px,transparent_1px)] [background-size:20px_20px]"/>

        <div className="absolute inset-0 flex items-center justify-center">
          <div className="relative h-[430px] w-[860px] max-w-[94%]">
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 860 430" fill="none" aria-hidden="true">
              <style>{`
                @keyframes skeletonDashFlow {
                  to { stroke-dashoffset: -16; }
                }
                .skeleton-dash {
                  stroke-dasharray: 8 8;
                  animation: skeletonDashFlow 1.1s linear infinite;
                }
              `}</style>

              <path className="skeleton-dash" d="M160 215H296" stroke="#595959" strokeWidth="2"/>
              <path className="skeleton-dash" d="M440 145C500 145 530 190 588 215" stroke="#595959" strokeWidth="2"/>
              <path className="skeleton-dash" d="M440 285C500 285 530 240 588 215" stroke="#595959" strokeWidth="2"/>
              <path className="skeleton-dash" d="M654 215H728" stroke="#595959" strokeWidth="2"/>
            </svg>

            <div className="absolute left-[24px] top-[151px] h-28 w-36 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Skeleton className="mb-2 h-4 w-16 bg-white/10"/>
              <Skeleton className="mb-1 h-2.5 w-24 bg-white/5"/>
              <Skeleton className="h-2.5 w-20 bg-white/5"/>
            </div>

            <div className="absolute left-[300px] top-[80px] h-28 w-36 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Skeleton className="mb-2 h-4 w-20 bg-white/10"/>
              <Skeleton className="mb-1 h-2.5 w-24 bg-white/5"/>
              <Skeleton className="h-2.5 w-20 bg-white/5"/>
            </div>

            <div className="absolute left-[300px] top-[220px] h-28 w-36 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Skeleton className="mb-2 h-4 w-20 bg-white/10"/>
              <Skeleton className="mb-1 h-2.5 w-24 bg-white/5"/>
              <Skeleton className="h-2.5 w-20 bg-white/5"/>
            </div>

            <div className="absolute left-[588px] top-[179px] h-20 w-16 rounded-lg border border-white/10 bg-white/[0.05] shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <div className="flex h-full items-center justify-center">
                <Skeleton className="h-3.5 w-3.5 rounded-full bg-white/20"/>
              </div>
            </div>

            <div className="absolute left-[728px] top-[151px] h-28 w-36 rounded-xl border border-white/10 bg-white/[0.04] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
              <Skeleton className="mb-2 h-4 w-16 bg-white/10"/>
              <Skeleton className="mb-1 h-2.5 w-24 bg-white/5"/>
              <Skeleton className="h-2.5 w-16 bg-white/5"/>
            </div>
          </div>
        </div>

        <div className="absolute bottom-4 left-4 flex flex-col gap-1">
          <Skeleton className="h-8 w-8 rounded bg-white/5"/>
          <Skeleton className="h-8 w-8 rounded bg-white/5"/>
          <Skeleton className="h-8 w-8 rounded bg-white/5"/>
          <Skeleton className="h-8 w-8 rounded bg-white/5"/>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <Skeleton className="h-10 w-40 rounded-lg bg-white/5"/>
        </div>

        <div className="absolute top-4 right-4">
          <Skeleton className="h-11 w-11 rounded-full bg-white/5"/>
        </div>

        <div className="absolute bottom-4 right-4">
          <Skeleton className="h-20 w-28 rounded-lg bg-white/5"/>
        </div>
      </div>
    </div>);
}
