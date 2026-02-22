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
function isPlaceholderSecret(value: string): boolean {
    const normalized = value.trim().toLowerCase();
    return normalized === WEBHOOK_SECRET_PLACEHOLDER
        || normalized === 'your_secret'
        || normalized === 'your-secret'
        || normalized === 'your secret';
}
function isLocalHostname(hostname: string): boolean {
    const normalized = hostname.trim().toLowerCase();
    return normalized === 'localhost' || normalized === '127.0.0.1' || normalized === '::1' || normalized === '[::1]';
}
function hasPublicWebhookBaseUrl(publicAppUrl: string | undefined): boolean {
    if (publicAppUrl && /^https?:\/\//.test(publicAppUrl)) {
        let parsedUrl: URL | null = null;
        try {
            parsedUrl = new URL(publicAppUrl);
        }
        catch {
            parsedUrl = null;
        }
        if (parsedUrl && !isLocalHostname(parsedUrl.hostname)) {
            return true;
        }
    }
    if (typeof window !== 'undefined') {
        return !isLocalHostname(window.location.hostname);
    }
    return false;
}
export function WebhookTriggerConfig({ nodeId, data, onSave }: WebhookTriggerConfigProps) {
    const [label, setLabel] = useState(data.label || 'Webhook Trigger');
    const initialSecret = typeof data.secret === 'string' ? data.secret.trim() : '';
    const [secret, setSecret] = useState(isPlaceholderSecret(initialSecret) ? '' : initialSecret);
    const [routeKey, setRouteKey] = useState(data.routeKey || 'priority');
    const isLabelMissing = !label.trim();
    const isSecretMissing = !secret.trim() || isPlaceholderSecret(secret);
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
        const hasPublicUrl = hasPublicWebhookBaseUrl(publicAppUrl);
        onSave({
            label,
            secret: secret.trim(),
            routeKey,
            isConfigured: !isLabelMissing && !isSecretMissing && hasPublicUrl,
        });
    };
    const missingFields: string[] = [];
    if (isLabelMissing)
        missingFields.push('Label');
    if (isSecretMissing)
        missingFields.push('Secret');
    return (<form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label className="text-white/80">
          Trigger Label <span className="text-red-400">*</span>
          {isLabelMissing && (<span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500/15 text-[10px] font-bold leading-none text-red-400" title="Required field missing">
              !
            </span>)}
        </Label>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Webhook Trigger" aria-invalid={isLabelMissing} className={`bg-[#2D2D2E] text-white placeholder:text-white/30 ${isLabelMissing ? "border-red-500/70 focus-visible:ring-red-500/40" : "border-[#444]"}`}/>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">
          Webhook Secret <span className="text-red-400">*</span>
          {isSecretMissing && (<span className="ml-1.5 inline-flex h-4 w-4 items-center justify-center rounded-full bg-red-500/15 text-[10px] font-bold leading-none text-red-400" title="Required field missing">
              !
            </span>)}
        </Label>
        <Input value={secret} onChange={(e) => setSecret(e.target.value)} placeholder="Set a shared secret" aria-invalid={isSecretMissing} className={`bg-[#2D2D2E] text-white placeholder:text-white/30 ${isSecretMissing ? "border-red-500/70 focus-visible:ring-red-500/40" : "border-[#444]"}`}/>
        {isSecretMissing && <p className="text-xs text-red-400">Secret is required.</p>}
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

      <Button type="submit" disabled={isLabelMissing || isSecretMissing} className="w-full bg-[#F04D26] hover:bg-[#e04420] text-white disabled:bg-[#F04D26]/50 disabled:text-white/70">
        Save
      </Button>
    </form>);
}
