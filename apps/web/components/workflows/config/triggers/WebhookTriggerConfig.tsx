"use client";
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { ValidationMessage } from '../../shared';
interface WebhookTriggerConfigProps {
    nodeId: string;
    data: Record<string, any>;
    onSave: (data: Record<string, any>) => void;
}
const WEBHOOK_SECRET_PLACEHOLDER = 'change-this-secret';
export function WebhookTriggerConfig({ nodeId, data, onSave }: WebhookTriggerConfigProps) {
    const [label, setLabel] = useState(data.label || 'Webhook Trigger');
    const [secret, setSecret] = useState(typeof data.secret === 'string' && data.secret.trim().toLowerCase() === WEBHOOK_SECRET_PLACEHOLDER
        ? ''
        : (data.secret || ''));
    const [routeKey, setRouteKey] = useState(data.routeKey || 'priority');
    const publicAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
    const webhookUrl = useMemo(() => {
        if (typeof window === 'undefined') {
            return `/api/webhooks/:workflowId/${nodeId}?secret=...`;
        }
        const baseUrl = publicAppUrl && /^https?:\/\//.test(publicAppUrl)
            ? publicAppUrl.replace(/\/$/, '')
            : window.location.origin;
        const parts = window.location.pathname.split('/').filter(Boolean);
        const workflowId = parts[parts.length - 1] || ':workflowId';
        return `${baseUrl}/api/webhooks/${workflowId}/${nodeId}?secret=${secret || 'YOUR_SECRET'}`;
    }, [nodeId, publicAppUrl, secret]);
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave({
            label,
            secret,
            routeKey,
        });
    };
    const missingFields: string[] = [];
    if (!label.trim())
        missingFields.push('Label');
    if (!secret.trim())
        missingFields.push('Secret');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">Trigger Label</Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Webhook Trigger" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Webhook Secret</Label>
        <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Set a shared secret" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">Requests must send this as query `secret` or header `x-fynt-secret`.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80" optional>Route Key</Label>
        <Input value={routeKey} onChange={(e) => setRouteKey(e.target.value)} placeholder="priority" className="bg-[#2D2D2E] border-[#444] text-white placeholder:text-white/30"/>
        <p className="text-xs text-white/40">Helpful when using condition routing from payload fields.</p>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Webhook URL</Label>
        <div className="rounded-md border border-[#444] bg-[#2D2D2E] px-3 py-2 text-xs text-white/80 break-all">
          {webhookUrl}
        </div>
        {typeof window !== 'undefined' && window.location.hostname === 'localhost' && !publicAppUrl && (<p className="text-xs text-white/40">
            This localhost URL works only on your machine. Set <code>NEXT_PUBLIC_APP_URL</code> for a public URL.
          </p>)}
      </div>

      <ValidationMessage missingFields={missingFields}/>

      <Button type="submit" disabled={!label.trim() || !secret.trim()} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
