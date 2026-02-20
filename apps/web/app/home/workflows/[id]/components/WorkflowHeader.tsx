'use client';
import Link from 'next/link';
import type { KeyboardEvent, ReactNode, RefObject } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
interface WorkflowHeaderProps {
    isEditingTitle: boolean;
    titleInputRef: RefObject<HTMLInputElement | null>;
    tempTitle: string;
    workflowTitle: string;
    currentWorkflowId: string;
    isRunPanelOpen: boolean;
    isCreateWorkflowPending: boolean;
    usageCounter: ReactNode;
    saveStatusIndicator: ReactNode;
    onTempTitleChange: (value: string) => void;
    onTitleSave: () => void;
    onTitleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void;
    onStartTitleEdit: () => void;
    onToggleRunPanel: () => void;
    onManualSave: () => void;
}
export function WorkflowHeader({ isEditingTitle, titleInputRef, tempTitle, workflowTitle, currentWorkflowId, isRunPanelOpen, isCreateWorkflowPending, usageCounter, saveStatusIndicator, onTempTitleChange, onTitleSave, onTitleKeyDown, onStartTitleEdit, onToggleRunPanel, onManualSave, }: WorkflowHeaderProps) {
    return (<header className="relative flex h-16 shrink-0 items-center gap-2 border-b px-4">
      <SidebarTrigger className="-ml-1 text-white/50 hover:bg-white/10 hover:text-white transition-colors duration-150 ease"/>
      <Separator orientation="vertical" className="mr-2 h-4"/>

      <div className="flex items-center gap-2 flex-1">
        <Link href="/home" className="flex items-center gap-2 hover:bg-white/5 rounded-md px-2 py-1 -ml-2 transition-colors duration-150 ease group">
          <div className="w-5 h-5 rounded-full bg-white/10 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="13px" height="13px" viewBox="0 0 18 18">
              <path d="M2.60518 13.1674C3.69058 10.7157 6.14168 9 8.99999 9C11.7634 9 14.1462 10.6037 15.2822 12.9257C15.3564 13.0774 15.4289 13.2326 15.4797 13.3894C15.8649 14.5805 15.1811 15.8552 13.9874 16.2313C12.705 16.6354 11.0072 17 8.99999 17C6.99283 17 5.29503 16.6354 4.01259 16.2313C2.74425 15.8317 2.05162 14.4186 2.60518 13.1674Z" fill="rgba(247, 248, 248, 0.5)" fillOpacity="0.4" className="group-hover:fill-white transition-colors duration-150"></path>
              <path d="M9 7.50049C10.7952 7.50049 12.25 6.04543 12.25 4.25049C12.25 2.45554 10.7952 1.00049 9 1.00049C7.20482 1.00049 5.75 2.45554 5.75 4.25049C5.75 6.04543 7.20482 7.50049 9 7.50049Z" fill="rgba(247, 248, 248, 0.5)" className="group-hover:fill-white transition-colors duration-150"></path>
            </svg>
          </div>
          <span className="text-sm font-medium text-white/50 group-hover:text-white transition-colors duration-150 ease">Personal</span>
        </Link>

        <span className="text-white/50 text-sm">/</span>

        {isEditingTitle ? (<input ref={titleInputRef} value={tempTitle} onChange={(e) => onTempTitleChange(e.target.value)} onKeyDown={onTitleKeyDown} onBlur={onTitleSave} className="bg-transparent border-none outline-none text-white font-medium text-sm flex-1 min-w-0" maxLength={128} name="workflowTitle" autoComplete="off"/>) : (<span onClick={onStartTitleEdit} className="text-sm font-medium text-white cursor-pointer hover:text-white/80 transition-colors duration-150 ease" title="Click to edit workflow name">
            {workflowTitle}
          </span>)}
      </div>

      {currentWorkflowId !== 'new' && (<div className="absolute left-1/2 -translate-x-1/2">
          <button onClick={onToggleRunPanel} className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-md transition-colors duration-150 ${isRunPanelOpen
                ? 'bg-white/10 text-white'
                : 'text-white/40 hover:text-white hover:bg-white/5'}`}>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polygon points="6 3 20 12 6 21 6 3"/>
            </svg>
            Runs
          </button>
        </div>)}

      <div className="flex items-center gap-3">
        {usageCounter}

        {currentWorkflowId !== 'new' && saveStatusIndicator}

        {currentWorkflowId === 'new' && (<button onClick={onManualSave} disabled={isCreateWorkflowPending} className="flex items-center gap-2 px-3 py-1.5 bg-[#F04D26] hover:bg-[#F04D26]/90 disabled:bg-[#F04D26]/50 text-white rounded-md text-sm transition-colors duration-150 ease active:scale-[0.97]" title="Save workflow">
            <svg xmlns="http://www.w3.org/2000/svg" x="0px" y="0px" width="15px" height="15px" viewBox="0 0 18 18">
              <path fillRule="evenodd" clipRule="evenodd" d="M3.30295 3.74372C3.71678 2.69059 4.7328 1.99899 5.86299 1.99899H12.136C13.2678 1.99899 14.2823 2.69219 14.6959 3.74341L16.809 9.12278C16.8897 9.32885 17 9.77524 17 10L17.0001 13C17.0001 13.2004 16.92 13.3924 16.7775 13.5333C16.635 13.6742 16.442 13.7522 16.2417 13.75L1.73977 13.5863C1.32889 13.5817 0.998238 13.2473 0.998237 12.8363V10C0.998236 9.77474 1.10867 9.32826 1.19018 9.12212L3.30295 3.74372Z" fill="#F7F8F8" fillOpacity="0.4" data-color="color-2"></path>
              <path d="M1 10L5.75 10C6.16421 10 6.5 10.3358 6.5 10.75V11.75C6.5 11.8878 6.61221 12 6.75 12H11.25C11.3878 12 11.5 11.8878 11.5 11.75V10.75C11.5 10.3358 11.8358 10 12.25 10H17V13.25C17 14.768 15.7695 16 14.25 16H3.75C2.23054 16 1 14.768 1 13.25V10Z" fill="#F7F8F8"></path>
              <path fillRule="evenodd" clipRule="evenodd" d="M9.75 3.75C9.75 3.33579 9.41421 3 9 3C8.58579 3 8.25 3.33579 8.25 3.75V6.93934L7.03033 5.71967C6.73744 5.42678 6.26256 5.42678 5.96967 5.71967C5.67678 6.01256 5.67678 6.48744 5.96967 6.78033L8.46967 9.28033C8.76256 9.57322 9.23744 9.57322 9.53033 9.28033L12.0303 6.78033C12.3232 6.48744 12.3232 6.01256 12.0303 5.71967C11.7374 5.42678 11.2626 5.42678 10.9697 5.71967L9.75 6.93934V3.75Z" fill="#F7F8F8"></path>
            </svg>
            {isCreateWorkflowPending ? 'Saving…' : 'Save'}
          </button>)}
      </div>
    </header>);
}
