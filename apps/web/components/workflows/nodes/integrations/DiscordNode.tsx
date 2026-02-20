"use client";
import BaseNode from '../BaseNode';
import Image from 'next/image';
interface DiscordNodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
    credentialId?: string;
    content?: string;
    message?: string;
}
function getSubtitle(data: DiscordNodeData, isConfigured: boolean): string {
    if (isConfigured) {
        return data.subtitle || 'Send message';
    }
    const noCredential = !data.credentialId;
    const noContent = !data.content && !data.message;
    if (noCredential && noContent)
        return 'Add credential & message';
    if (noCredential)
        return 'Add credential';
    if (noContent)
        return 'Add message content';
    return 'Not configured';
}
export default function DiscordNode({ data, id, selected }: {
    data: DiscordNodeData;
    id: string;
    selected?: boolean;
}) {
    const isConfigured = !!(data.credentialId && (data.content || data.message));
    return (<BaseNode id={id} selected={selected} nodeType="discordNode" icon={<Image alt="Discord" width={40} height={40} src="/logo/discord.svg" className="size-10 object-contain rounded-sm"/>} label={data.label || 'Discord'} subtitle={getSubtitle(data, isConfigured)} isConfigured={isConfigured}/>);
}
