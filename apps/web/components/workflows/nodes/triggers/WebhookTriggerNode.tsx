"use client";
import { Webhook } from 'lucide-react';
import BaseNode from '../BaseNode';
interface WebhookTriggerNodeData {
    label?: string;
    isConfigured?: boolean;
    secret?: string;
}
const WEBHOOK_SECRET_PLACEHOLDER = 'change-this-secret';
function isPlaceholderSecret(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === WEBHOOK_SECRET_PLACEHOLDER
        || normalized === 'your_secret'
        || normalized === 'your-secret'
        || normalized === 'your secret';
}
export default function WebhookTriggerNode({ data, id, selected }: {
    data: WebhookTriggerNodeData;
    id: string;
    selected?: boolean;
}) {
    const hasLabel = typeof data.label === 'string' && data.label.trim().length > 0;
    const rawSecret = typeof data.secret === 'string' ? data.secret.trim() : '';
    const hasSecret = rawSecret.length > 0 && !isPlaceholderSecret(rawSecret);
    const configuredByData = data.isConfigured !== false;
    const isConfigured = configuredByData && hasLabel && hasSecret;
    const subtitle = isConfigured ? 'Receives external events' : 'Setup needed: label, secret, and public URL';
    return (<BaseNode id={id} selected={selected} nodeType="webhookTrigger" icon={<Webhook size={38} className="text-orange-400"/>} label={data.label || 'Webhook Trigger'} subtitle={subtitle} isConfigured={isConfigured} isTrigger={true}/>);
}
