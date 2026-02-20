'use client';
import React, { useState, useRef, useEffect } from 'react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator, } from '@/components/ui/breadcrumb';
import { User, Save } from 'lucide-react';
import { useRouter } from 'next/navigation';
interface TopbarProps {
    title?: string;
    children?: React.ReactNode;
    onTitleChange?: (newTitle: string) => void;
    onSave?: () => void;
    isSaving?: boolean;
}
function EditableTitle({ title, onTitleChange }: {
    title: string;
    onTitleChange?: (newTitle: string) => void;
}) {
    const [isEditing, setIsEditing] = useState(false);
    const [tempTitle, setTempTitle] = useState(title);
    const inputRef = useRef<HTMLInputElement>(null);
    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);
    const handleSave = () => {
        if (tempTitle.trim() && tempTitle !== title) {
            onTitleChange?.(tempTitle.trim());
        }
        setIsEditing(false);
    };
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            handleSave();
        }
        else if (e.key === 'Escape') {
            setTempTitle(title);
            setIsEditing(false);
        }
    };
    const handleBlur = () => {
        handleSave();
    };
    if (isEditing) {
        return (<input ref={inputRef} value={tempTitle} onChange={(e) => setTempTitle(e.target.value)} onKeyDown={handleKeyDown} onBlur={handleBlur} className="bg-transparent border-none outline-none text-white font-semibold min-w-0 flex-1" maxLength={128} style={{ color: 'white' }} name="workflowTitle" autoComplete="off"/>);
    }
    return (<span onClick={() => setIsEditing(true)} className="cursor-pointer hover:text-white/80 transition-colors font-semibold text-white" title="Click to edit workflow name">
      {title}
    </span>);
}
export function Topbar({ title, children, onTitleChange, onSave, isSaving }: TopbarProps) {
    const router = useRouter();
    return (<header className='h-14 shrink-0 border-b border-white/10 bg-[#414243] flex items-center px-4 gap-3'>
      <SidebarTrigger className='text-white/50 hover:text-white transition-colors duration-150 ease'/>

      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem className='hover:text-white group'>
            <BreadcrumbLink onClick={() => router.push('/home')} className="flex items-center gap-2 cursor-pointer">
              <div className="w-6 h-6 rounded-full bg-white/10 flex items-center justify-center">
                <User className="w-4 h-4 text-white/50 group-hover:text-white transition-colors duration-150 ease"/>
              </div>
              <span className="text-white/50 group-hover:text-white transition-colors duration-150 ease">Personal</span>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator className="text-white">/</BreadcrumbSeparator>
          <BreadcrumbItem>
            {title && (<EditableTitle title={title} onTitleChange={onTitleChange}/>)}
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>

      <div className="flex-1"/>

      {onSave && (<button onClick={onSave} disabled={isSaving} className="flex items-center gap-2 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-800 text-white rounded-md text-sm transition-colors" title="Save workflow">
          <Save className="w-4 h-4"/>
          {isSaving ? 'Saving…' : 'Save'}
        </button>)}

      {children}
    </header>);
}
