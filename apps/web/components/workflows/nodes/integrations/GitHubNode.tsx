"use client";
import Image from "next/image";
import BaseNode from "../BaseNode";
interface GitHubNodeData {
    label?: string;
    subtitle?: string;
    credentialId?: string;
    operation?: "create_issue" | "create_comment" | "get_issue";
    owner?: string;
    repo?: string;
    issueNumber?: string;
    title?: string;
    body?: string;
}
function getSubtitle(data: GitHubNodeData, isConfigured: boolean): string {
    if (isConfigured) {
        if (data.subtitle)
            return data.subtitle;
        if (data.operation === "create_comment")
            return "Create issue comment";
        if (data.operation === "get_issue")
            return "Get issue";
        return "Create issue";
    }
    if (!data.credentialId)
        return "Add credential";
    return "Configure repository fields";
}
export default function GitHubNode({ data, id, selected, }: {
    data: GitHubNodeData;
    id: string;
    selected?: boolean;
}) {
    const operation = data.operation ?? "create_issue";
    const hasRepoConfig = !!(data.owner && data.repo);
    const hasOperationConfig = operation === "create_issue"
        ? !!data.title
        : operation === "create_comment"
            ? !!(data.issueNumber && data.body)
            : !!data.issueNumber;
    const isConfigured = !!(data.credentialId && hasRepoConfig && hasOperationConfig);
    return (<BaseNode id={id} selected={selected} nodeType="githubNode" icon={<Image alt="GitHub" width={40} height={40} src="/logo/github.svg" className="size-10 object-contain rounded-sm"/>} label={data.label || "GitHub"} subtitle={getSubtitle(data, isConfigured)} isConfigured={isConfigured}/>);
}
