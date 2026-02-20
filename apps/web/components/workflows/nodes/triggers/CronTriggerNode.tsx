"use client";
import { Clock3 } from 'lucide-react';
import BaseNode from '../BaseNode';
interface CronTriggerNodeData {
    label?: string;
    isConfigured?: boolean;
    schedule?: string;
}
export default function CronTriggerNode({ data, id, selected }: {
    data: CronTriggerNodeData;
    id: string;
    selected?: boolean;
}) {
    const scheduleLabel = data.schedule ? `Schedule: ${data.schedule}` : 'Not configured';
    return (<BaseNode id={id} selected={selected} nodeType="cronTrigger" icon={<Clock3 size={38} className="text-orange-400"/>} label={data.label || 'Cron Trigger'} subtitle={data.isConfigured ? scheduleLabel : 'Not configured'} isConfigured={data.isConfigured} isTrigger={true}/>);
}
