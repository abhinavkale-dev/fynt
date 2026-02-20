"use client";
import BaseNode from '../BaseNode';
import Image from 'next/image';
interface GeminiNodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
    credentialId?: string;
    model?: string;
    prompt?: string;
    inputMode?: "prompt" | "json";
    requestJson?: string;
}
function resolveInputMode(data: GeminiNodeData): "prompt" | "json" {
    return data.inputMode === "json" ? "json" : "prompt";
}
function getSubtitle(data: GeminiNodeData, isConfigured: boolean): string {
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
export default function GeminiNode({ data, id, selected }: {
    data: GeminiNodeData;
    id: string;
    selected?: boolean;
}) {
    const inputMode = resolveInputMode(data);
    const hasInput = inputMode === "json" ? !!data.requestJson?.trim() : !!data.prompt?.trim();
    const isConfigured = !!(data.credentialId?.trim() && data.model?.trim() && hasInput);
    return (<BaseNode id={id} selected={selected} nodeType="geminiNode" icon={<Image alt="Gemini" width={40} height={40} src="/logo/gemini.svg" className="size-10 object-contain rounded-sm"/>} label={data.label || 'Gemini'} subtitle={getSubtitle(data, isConfigured)} isConfigured={isConfigured}/>);
}
