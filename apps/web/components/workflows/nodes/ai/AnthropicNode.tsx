"use client";
import BaseNode from '../BaseNode';
import Image from 'next/image';
interface AnthropicNodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
    credentialId?: string;
    model?: string;
    prompt?: string;
    inputMode?: "prompt" | "json";
    requestJson?: string;
}
function resolveInputMode(data: AnthropicNodeData): "prompt" | "json" {
    return data.inputMode === "json" ? "json" : "prompt";
}
function getSubtitle(data: AnthropicNodeData, isConfigured: boolean): string {
    const inputMode = resolveInputMode(data);
    if (isConfigured) {
        return data.model ? `Model: ${data.model} (${inputMode})` : (data.subtitle || 'Generate response');
    }
    const missing: string[] = [];
    if (!data.credentialId?.trim())
        missing.push('credential');
    if (!data.model?.trim())
        missing.push('model');
    if (inputMode === "json") {
        if (!data.requestJson?.trim())
            missing.push('json input');
    }
    else if (!data.prompt?.trim()) {
        missing.push('prompt');
    }
    if (missing.length === 0)
        return 'Not configured';
    return `Setup needed: ${missing.join(', ')}`;
}
export default function AnthropicNode({ data, id, selected }: {
    data: AnthropicNodeData;
    id: string;
    selected?: boolean;
}) {
    const inputMode = resolveInputMode(data);
    const hasInput = inputMode === "json" ? !!data.requestJson?.trim() : !!data.prompt?.trim();
    const isConfigured = !!(data.credentialId?.trim() && data.model?.trim() && hasInput);
    return (<BaseNode id={id} selected={selected} nodeType="anthropicNode" icon={<Image alt="Anthropic" width={40} height={40} src="/logo/anthropic.svg" className="size-10 object-contain rounded-sm"/>} label={data.label || 'Anthropic'} subtitle={getSubtitle(data, isConfigured)} isConfigured={isConfigured}/>);
}
