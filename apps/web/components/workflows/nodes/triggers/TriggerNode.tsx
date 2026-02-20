"use client";
import { MousePointer } from 'lucide-react';
import BaseNode from '../BaseNode';
interface TriggerNodeData {
    label?: string;
    triggerType?: string;
    schedule?: string;
    manual?: boolean;
    isConfigured?: boolean;
}
export default function TriggerNode({ data, id, selected }: {
    data: TriggerNodeData;
    id: string;
    selected?: boolean;
}) {
    return (<BaseNode id={id} selected={selected} nodeType="triggerNode" icon={<MousePointer size={40} className="text-orange-400"/>} label={data.label || 'Manual Trigger'} subtitle="When clicking 'Execute workflow'" isConfigured={true} isTrigger={true}/>);
}
