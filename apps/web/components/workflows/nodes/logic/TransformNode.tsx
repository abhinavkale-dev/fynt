"use client";
import { Shuffle } from 'lucide-react';
import BaseNode from '../BaseNode';
interface TransformNodeData {
    label?: string;
    isConfigured?: boolean;
    expression?: string;
}
export default function TransformNode({ data, id, selected }: {
    data: TransformNodeData;
    id: string;
    selected?: boolean;
}) {
    return (<BaseNode id={id} selected={selected} nodeType="transformNode" icon={<Shuffle size={38} className="text-[#67E8F9]"/>} label={data.label || 'Transform'} subtitle={data.isConfigured ? 'Configured' : 'Configure transform'} isConfigured={data.isConfigured}/>);
}
