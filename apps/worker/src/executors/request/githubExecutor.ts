import { parseTemplate, parseTemplateWithMetadata } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { GitHubNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
const GITHUB_BASE_URL = "https://api.github.com";
const GITHUB_API_VERSION = "2022-11-28";
function getGitHubErrorHint(status: number): string {
    switch (status) {
        case 400:
            return "Invalid GitHub request payload. Check owner/repo/issue fields.";
        case 401:
            return "Invalid or expired GitHub token. Update your GitHub credential.";
        case 403:
            return "Access denied or rate-limited. Verify token scopes and repository access.";
        case 404:
            return "Repository or issue not found. Verify owner, repo, and issue number.";
        case 422:
            return "Validation failed. Check required fields and payload format.";
        case 429:
            return "GitHub API rate limit exceeded. Retry later.";
        case 500:
        case 502:
        case 503:
            return "GitHub service is temporarily unavailable. Retry later.";
        default:
            if (status >= 400 && status < 500)
                return "Client error. Verify GitHub node configuration.";
            if (status >= 500)
                return "Server error from GitHub API.";
            return "";
    }
}
function parseResponseBody(bodyText: string): NodeExecutionOutput {
    if (!bodyText)
        return {};
    try {
        return JSON.parse(bodyText) as NodeExecutionOutput;
    }
    catch {
        return bodyText as NodeExecutionOutput;
    }
}
function parseRequiredString(value: string | undefined, fieldName: string, runMetadata: Record<string, NodeExecutionOutput>): string {
    const parsed = parseTemplate(value ?? "", runMetadata as Record<string, string>).trim();
    if (!parsed) {
        throw new Error(`GitHub ${fieldName} is required.`);
    }
    return parsed;
}
function parseIssueNumber(value: string | undefined, runMetadata: Record<string, NodeExecutionOutput>): number {
    const parsed = parseRequiredString(value, "issueNumber", runMetadata);
    const issueNumber = Number.parseInt(parsed, 10);
    if (!Number.isFinite(issueNumber) || issueNumber <= 0) {
        throw new Error("GitHub issueNumber must be a positive integer.");
    }
    return issueNumber;
}
function parseLabels(labelsTemplate: string | undefined, runMetadata: Record<string, NodeExecutionOutput>): string[] | undefined {
    if (!labelsTemplate?.trim()) {
        return undefined;
    }
    const parsed = parseTemplateWithMetadata(labelsTemplate, runMetadata as Record<string, string>).output.trim();
    if (!parsed) {
        return undefined;
    }
    let value: unknown;
    try {
        value = JSON.parse(parsed) as unknown;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown parse error";
        throw new Error(`labelsTemplate must resolve to valid JSON array. ${message} ` +
            `When referencing object/array outputs, use the {json variable.path} helper.`);
    }
    if (!Array.isArray(value)) {
        throw new Error("labelsTemplate must resolve to a JSON array.");
    }
    return value.map((item) => String(item));
}
async function callGitHub(endpoint: string, init: RequestInit, operation: string): Promise<NodeExecutionOutput> {
    try {
        await validateOutboundUrl(endpoint);
    }
    catch (error) {
        if (error instanceof SsrfBlockedError) {
            throw new Error(`Blocked GitHub API URL: ${error.message}`);
        }
        throw error;
    }
    const response = await fetch(endpoint, init);
    const bodyText = await response.text();
    const parsedBody = parseResponseBody(bodyText);
    if (!response.ok) {
        const hint = getGitHubErrorHint(response.status);
        const detail = typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody);
        throw new Error(`GitHub API error during ${operation} (${response.status}): ${detail}${hint ? `\nHint: ${hint}` : ""}`);
    }
    return parsedBody;
}
function getGitHubHeaders(accessToken: string, withJsonContentType: boolean = false): HeadersInit {
    return {
        Authorization: `Bearer ${accessToken}`,
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": GITHUB_API_VERSION,
        ...(withJsonContentType ? { "Content-Type": "application/json" } : {}),
    };
}
async function executeCreateIssue(data: GitHubNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const owner = parseRequiredString(data.owner, "owner", runMetadata);
    const repo = parseRequiredString(data.repo, "repo", runMetadata);
    const title = parseRequiredString(data.title, "title", runMetadata);
    const body = parseTemplate(data.body ?? "", runMetadata as Record<string, string>).trim();
    const labels = parseLabels(data.labelsTemplate, runMetadata);
    const endpoint = `${GITHUB_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}/issues`;
    const parsedBody = await callGitHub(endpoint, {
        method: "POST",
        headers: getGitHubHeaders(accessToken, true),
        body: JSON.stringify({
            title,
            ...(body ? { body } : {}),
            ...(labels && labels.length > 0 ? { labels } : {}),
        }),
    }, "create_issue");
    const issueNumber = typeof parsedBody === "object" && parsedBody !== null && "number" in parsedBody
        ? Number((parsedBody as Record<string, unknown>).number)
        : undefined;
    const includeIssueNumber = typeof issueNumber === "number" && Number.isFinite(issueNumber);
    return {
        success: true,
        operation: "create_issue",
        owner,
        repo,
        ...(includeIssueNumber ? { issueNumber } : {}),
        data: parsedBody,
    };
}
async function executeCreateComment(data: GitHubNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const owner = parseRequiredString(data.owner, "owner", runMetadata);
    const repo = parseRequiredString(data.repo, "repo", runMetadata);
    const issueNumber = parseIssueNumber(data.issueNumber, runMetadata);
    const body = parseRequiredString(data.body, "body", runMetadata);
    const endpoint = `${GITHUB_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
        `/issues/${issueNumber}/comments`;
    const parsedBody = await callGitHub(endpoint, {
        method: "POST",
        headers: getGitHubHeaders(accessToken, true),
        body: JSON.stringify({ body }),
    }, "create_comment");
    return {
        success: true,
        operation: "create_comment",
        owner,
        repo,
        issueNumber,
        data: parsedBody,
    };
}
async function executeGetIssue(data: GitHubNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const owner = parseRequiredString(data.owner, "owner", runMetadata);
    const repo = parseRequiredString(data.repo, "repo", runMetadata);
    const issueNumber = parseIssueNumber(data.issueNumber, runMetadata);
    const endpoint = `${GITHUB_BASE_URL}/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}` +
        `/issues/${issueNumber}`;
    const parsedBody = await callGitHub(endpoint, {
        method: "GET",
        headers: getGitHubHeaders(accessToken),
    }, "get_issue");
    return {
        success: true,
        operation: "get_issue",
        owner,
        repo,
        issueNumber,
        data: parsedBody,
    };
}
export async function executeGitHubNode(data: GitHubNodeData, runMetadata: Record<string, NodeExecutionOutput>, _executionMode: ExecutionMode = "legacy", ownerUserId: string): Promise<NodeExecutionOutput> {
    if (!data.credentialId?.trim()) {
        throw new Error("GitHub node is missing credentialId.");
    }
    const credential = await resolveCredential(data.credentialId, ownerUserId);
    if (credential.platform !== "github") {
        throw new Error(`Credential platform mismatch: githubNode requires github credential, got ${credential.platform}`);
    }
    const accessToken = credential.keys.accessToken?.trim();
    if (!accessToken) {
        throw new Error("GitHub credential is missing accessToken.");
    }
    const operation = data.operation ?? "create_issue";
    if (operation === "create_issue") {
        return executeCreateIssue(data, runMetadata, accessToken);
    }
    if (operation === "create_comment") {
        return executeCreateComment(data, runMetadata, accessToken);
    }
    if (operation === "get_issue") {
        return executeGetIssue(data, runMetadata, accessToken);
    }
    throw new Error(`Unsupported GitHub operation: ${operation}`);
}
