"use client";
import BaseNode from '../BaseNode';
import Image from 'next/image';
interface SlackNodeData {
    label?: string;
    subtitle?: string;
    isConfigured?: boolean;
    credentialId?: string;
    message?: string;
}
function getSubtitle(data: SlackNodeData, isConfigured: boolean): string {
    if (isConfigured) {
        return data.subtitle || 'Send message';
    }
    const noCredential = !data.credentialId;
    const noMessage = !data.message;
    if (noCredential && noMessage)
        return 'Add credential & message';
    if (noCredential)
        return 'Add credential';
    if (noMessage)
        return 'Add message';
    return 'Not configured';
}
export default function SlackNode({ data, id, selected }: {
    data: SlackNodeData;
    id: string;
    selected?: boolean;
}) {
    const isConfigured = !!(data.credentialId && data.message);
    return (<BaseNode id={id} selected={selected} nodeType="slackNode" icon={<Image alt="Slack" width={40} height={40} src="/logo/slack.svg" className="size-10 object-contain rounded-sm"/>} label={data.label || 'Slack'} subtitle={getSubtitle(data, isConfigured)} isConfigured={isConfigured}/>);
}
