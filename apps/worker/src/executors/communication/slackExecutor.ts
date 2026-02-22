import { parseTemplateWithMetadata } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { SlackNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential, resolveSingleCredentialByPlatform } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
import { formatMessageForDelivery } from "./messageFormatting.js";
function normalizeSlackWebhookUrl(url: string | undefined): string | undefined {
    if (!url) {
        return undefined;
    }
    let normalized = String(url).trim();
    if (!normalized) {
        return undefined;
    }
    if (normalized.startsWith("<") && normalized.endsWith(">")) {
        normalized = normalized.slice(1, -1).trim();
    }
    if ((normalized.startsWith('"') && normalized.endsWith('"')) ||
        (normalized.startsWith("'") && normalized.endsWith("'"))) {
        normalized = normalized.slice(1, -1).trim();
    }
    return normalized || undefined;
}
function isSlackWebhookUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return host === "hooks.slack.com" || host === "hooks.slack-gov.com";
    }
    catch {
        return false;
    }
}
function isRecoverableCredentialResolutionError(error: unknown): boolean {
    if (!(error instanceof Error)) {
        return false;
    }
    return (error.message.includes('not found or access denied') ||
        error.message.includes('is not a Slack credential'));
}
export async function executeSlackNode(data: SlackNodeData, _nodeRunId: string, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy', ownerUserId: string): Promise<NodeExecutionOutput> {
    const { webhookUrl, message, channel, credentialId } = data;
    if (!message) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Slack node not configured - no message provided');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - no message provided',
        };
    }
    const parsedResult = parseTemplateWithMetadata(message, runMetadata as Record<string, string>);
    const parsedMessage = parsedResult.output;
    const missingVarList = parsedResult.missingVars?.join(', ') || 'unknown variables';
    if (executionMode === 'strict_template_v1' && parsedResult.missingVars?.length) {
        throw new Error(`Message template uses undefined variables: ${missingVarList}. ` +
            `Original template: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`);
    }
    if (!parsedMessage && parsedResult.hasSubstitutions) {
        const errorMsg = `Message template uses undefined variables: ${missingVarList}. Original template: "${message.slice(0, 100)}${message.length > 100 ? '...' : ''}"`;
        if (executionMode === 'strict_template_v1') {
            throw new Error(errorMsg);
        }
        return {
            success: false,
            error: errorMsg,
            skipped: false
        };
    }
    if (!parsedMessage) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Slack node not configured - message is empty');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - message is empty',
        };
    }
    const formattedMessage = formatMessageForDelivery(parsedMessage);
    if (!formattedMessage) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Slack node not configured - message is empty after formatting');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - message is empty after formatting',
        };
    }
    let resolvedWebhookUrl: string | undefined;
    let credentialResolutionError: Error | undefined;
    if (typeof credentialId === 'string' && credentialId.trim().length > 0) {
        const normalizedCredentialId = credentialId.trim();
        try {
            const { platform, keys } = await resolveCredential(normalizedCredentialId, ownerUserId);
            if (platform.toLowerCase() !== 'slack') {
                throw new Error(`Credential ${normalizedCredentialId} is not a Slack credential`);
            }
            resolvedWebhookUrl = normalizeSlackWebhookUrl(keys.webhookUrl);
        }
        catch (error) {
            if (!isRecoverableCredentialResolutionError(error)) {
                throw error;
            }
            credentialResolutionError = error instanceof Error ? error : new Error('Failed to resolve Slack credential');
            // Recover stale template credential IDs when there is only one Slack credential for the user.
            const fallbackCredential = await resolveSingleCredentialByPlatform('slack', ownerUserId);
            if (fallbackCredential) {
                resolvedWebhookUrl = normalizeSlackWebhookUrl(fallbackCredential.keys.webhookUrl);
            }
        }
    }
    if (!resolvedWebhookUrl) {
        resolvedWebhookUrl = normalizeSlackWebhookUrl(webhookUrl || process.env.SLACK_WEBHOOK_URL);
    }
    if (!resolvedWebhookUrl) {
        if (credentialResolutionError) {
            throw new Error(`${credentialResolutionError.message}. This workflow likely has a stale Slack credential. Re-select the Slack credential on the node.`);
        }
        throw new Error('Slack webhook URL not configured');
    }
    if (!isSlackWebhookUrl(resolvedWebhookUrl)) {
        throw new Error('Invalid Slack webhook URL');
    }
    try {
        await validateOutboundUrl(resolvedWebhookUrl);
    }
    catch (error) {
        if (error instanceof SsrfBlockedError) {
            throw new Error(`Blocked Slack webhook target: ${error.message}`);
        }
        throw error;
    }
    const payload: Record<string, string> = {
        text: formattedMessage,
    };
    if (channel) {
        payload.channel = channel;
    }
    const response = await fetch(resolvedWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });
    if (!response.ok) {
        const body = await response.text();
        throw new Error(`Failed to send Slack message: ${response.status} ${body}`);
    }
    return {
        success: true,
        message: 'Slack message sent',
        renderedMessage: formattedMessage,
    };
}
