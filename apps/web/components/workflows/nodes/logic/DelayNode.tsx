"use client";
import { Hourglass } from 'lucide-react';
import BaseNode from '../BaseNode';
interface DelayNodeData {
    label?: string;
    isConfigured?: boolean;
    durationMs?: number;
}
function formatDuration(durationMs?: number): string {
    if (!durationMs || durationMs <= 0) {
        return 'No delay configured';
    }
    const minutes = Math.floor(durationMs / 60000);
    if (minutes >= 60) {
        const hours = Math.floor(minutes / 60);
        const remMinutes = minutes % 60;
        return remMinutes > 0 ? `Wait ${hours}h ${remMinutes}m` : `Wait ${hours}h`;
    }
    return `Wait ${minutes}m`;
}
export default function DelayNode({ data, id, selected }: {
    data: DelayNodeData;
    id: string;
    selected?: boolean;
}) {
    const isConfigured = !!(data.durationMs && data.durationMs > 0);
    return (<BaseNode id={id} selected={selected} nodeType="delayNode" icon={<Hourglass size={36} className="text-[#F3D086]"/>} label={data.label || 'Delay'} subtitle={isConfigured ? formatDuration(data.durationMs) : 'Set delay duration'} isConfigured={isConfigured}/>);
}
