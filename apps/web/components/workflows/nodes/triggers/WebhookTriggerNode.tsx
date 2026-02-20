"use client";
import { Webhook } from 'lucide-react';
import BaseNode from '../BaseNode';
interface WebhookTriggerNodeData {
    label?: string;
    isConfigured?: boolean;
}
export default function WebhookTriggerNode({ data, id, selected }: {
    data: WebhookTriggerNodeData;
    id: string;
    selected?: boolean;
}) {
    return (<BaseNode id={id} selected={selected} nodeType="webhookTrigger" icon={<Webhook size={38} className="text-orange-400"/>} label={data.label || 'Webhook Trigger'} subtitle={data.isConfigured ? 'Receives external events' : 'Not configured'} isConfigured={data.isConfigured} isTrigger={true}/>);
}
