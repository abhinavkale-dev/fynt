import { parseTemplateWithMetadata } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { SlackNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
import { formatMessageForDelivery } from "./messageFormatting.js";
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
    if (credentialId) {
        const { keys } = await resolveCredential(credentialId, ownerUserId);
        resolvedWebhookUrl = keys.webhookUrl;
    }
    if (!resolvedWebhookUrl) {
        resolvedWebhookUrl = webhookUrl || process.env.SLACK_WEBHOOK_URL;
    }
    if (!resolvedWebhookUrl) {
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
