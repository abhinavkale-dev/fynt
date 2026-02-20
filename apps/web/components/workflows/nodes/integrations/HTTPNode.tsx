"use client";
import { Globe } from 'lucide-react';
import BaseNode from '../BaseNode';
interface HTTPNodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
    url?: string;
}
export default function HTTPNode({ data, id, selected }: {
    data: HTTPNodeData;
    id: string;
    selected?: boolean;
}) {
    const isConfigured = !!data.url;
    const subtitle = isConfigured ? (data.subtitle || 'GET request') : 'Add URL';
    return (<BaseNode id={id} selected={selected} nodeType="httpTrigger" icon={<Globe size={40} className="text-[#999]"/>} label={data.label || 'HTTP Request'} subtitle={subtitle} isConfigured={isConfigured}/>);
}
