"use client";
import { FileText } from 'lucide-react';
import BaseNode from '../BaseNode';
interface LogNodeData {
    label?: string;
    isConfigured?: boolean;
    level?: string;
    message?: string;
}
export default function LogNode({ data, id, selected }: {
    data: LogNodeData;
    id: string;
    selected?: boolean;
}) {
    const isConfigured = !!data.message;
    const subtitle = isConfigured ? `Level: ${data.level || 'info'}` : 'Add log message';
    return (<BaseNode id={id} selected={selected} nodeType="logNode" icon={<FileText size={38} className="text-[#9AE6B4]"/>} label={data.label || 'Log'} subtitle={subtitle} isConfigured={isConfigured}/>);
}
