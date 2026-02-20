"use client";
import BaseNode from '../BaseNode';
interface AINodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
}
export default function AINode({ data, id, selected }: {
    data: AINodeData;
    id: string;
    selected?: boolean;
}) {
    return (<BaseNode id={id} selected={selected} nodeType="aiNode" icon={<div className="text-[#999] font-bold text-3xl tracking-tighter">AI</div>} label={data.label || 'Analyze document'} subtitle={data.isConfigured ? (data.subtitle || 'analyze: document') : 'Not configured'} isConfigured={data.isConfigured}/>);
}
