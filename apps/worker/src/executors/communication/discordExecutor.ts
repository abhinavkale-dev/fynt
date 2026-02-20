import { parseTemplate, parseTemplateWithMetadata } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { DiscordNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
import { formatMessageForDelivery } from "./messageFormatting.js";
function redactWebhookUrl(url: string): string {
    try {
        const parsed = new URL(url);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length >= 4) {
            const webhookId = parts[2];
            return `${parsed.origin}/api/webhooks/${webhookId}/***`;
        }
        return `${parsed.origin}/***`;
    }
    catch {
        return 'invalid-url';
    }
}
function isDiscordWebhookUrl(url: string): boolean {
    try {
        const parsed = new URL(url);
        const host = parsed.hostname.toLowerCase();
        return (host === 'discord.com' ||
            host === 'discordapp.com' ||
            host === 'ptb.discord.com' ||
            host === 'canary.discord.com');
    }
    catch {
        return false;
    }
}
function withWaitTrue(url: string): string {
    const parsed = new URL(url);
    parsed.searchParams.set('wait', 'true');
    return parsed.toString();
}
function buildDiscordMessageLink(guildId: string | undefined, channelId: string | undefined, messageId: string | undefined): string | undefined {
    if (!channelId || !messageId)
        return undefined;
    if (!guildId)
        return undefined;
    return `https://discord.com/channels/${guildId}/${channelId}/${messageId}`;
}
function parseWebhookIdentity(webhookUrl: string): {
    origin: string;
    webhookId: string;
    webhookToken: string;
} | null {
    try {
        const parsed = new URL(webhookUrl);
        const parts = parsed.pathname.split('/').filter(Boolean);
        if (parts.length < 4)
            return null;
        if (parts[0] !== 'api' || parts[1] !== 'webhooks')
            return null;
        const webhookId = parts[2];
        const webhookToken = parts[3];
        if (!webhookId || !webhookToken)
            return null;
        return { origin: parsed.origin, webhookId, webhookToken };
    }
    catch {
        return null;
    }
}
export async function executeDiscordNode(data: DiscordNodeData, _nodeRunId: string, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy', ownerUserId: string): Promise<NodeExecutionOutput> {
    const { webhookUrl, username, credentialId } = data;
    const message = data.content || data.message;
    if (!message) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Discord node not configured - no message provided');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - no message provided'
        };
    }
    const parsedResult = parseTemplateWithMetadata(message, runMetadata as Record<string, string>);
    const parsedMessage = parsedResult.output;
    const parsedUsername = parseTemplate(username || 'Fynt Bot', runMetadata as Record<string, string>);
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
            throw new Error('Discord node not configured - message is empty');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - message is empty'
        };
    }
    const formattedMessage = formatMessageForDelivery(parsedMessage);
    if (!formattedMessage) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('Discord node not configured - message is empty after formatting');
        }
        return {
            success: true,
            skipped: true,
            reason: 'Node not configured - message is empty after formatting'
        };
    }
    let discordWebhook: string | undefined;
    if (credentialId) {
        const { keys } = await resolveCredential(credentialId, ownerUserId);
        discordWebhook = keys.webhookUrl;
    }
    if (!discordWebhook) {
        discordWebhook = webhookUrl || process.env.DISCORD_WEBHOOK_URL;
    }
    if (!discordWebhook) {
        throw new Error('Discord webhook URL not configured');
    }
    if (!isDiscordWebhookUrl(discordWebhook)) {
        throw new Error(`Invalid Discord webhook URL in credential: ${redactWebhookUrl(discordWebhook)}`);
    }
    try {
        await validateOutboundUrl(discordWebhook);
    }
    catch (error) {
        if (error instanceof SsrfBlockedError) {
            throw new Error(`Blocked Discord webhook target: ${error.message}`);
        }
        throw error;
    }
    const DISCORD_MAX_LENGTH = 2000;
    const truncated = formattedMessage.length > DISCORD_MAX_LENGTH;
    const finalMessage = truncated
        ? formattedMessage.slice(0, DISCORD_MAX_LENGTH - 4) + '...'
        : formattedMessage;
    const requestWebhookUrl = withWaitTrue(discordWebhook);
    const response = await fetch(requestWebhookUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: finalMessage, username: parsedUsername }),
    });
    const responseText = await response.text();
    if (!response.ok) {
        throw new Error(`Failed to send Discord message: ${response.status} ${response.statusText}. ` +
            `Webhook=${redactWebhookUrl(discordWebhook)} Body=${responseText.slice(0, 300)}`);
    }
    let responseJson: Record<string, unknown> | null = null;
    if (responseText) {
        try {
            responseJson = JSON.parse(responseText) as Record<string, unknown>;
        }
        catch {
        }
    }
    const discordMessageId = typeof responseJson?.id === 'string' ? responseJson.id : undefined;
    const discordChannelId = typeof responseJson?.channel_id === 'string' ? responseJson.channel_id : undefined;
    const discordGuildId = typeof responseJson?.guild_id === 'string' ? responseJson.guild_id : undefined;
    const deliveredContent = typeof responseJson?.content === 'string' ? responseJson.content : undefined;
    const webhookIdentity = parseWebhookIdentity(discordWebhook);
    let webhookResolvedChannelId: string | undefined;
    let webhookResolvedGuildId: string | undefined;
    let verifiedByFetch = false;
    if (webhookIdentity) {
        try {
            const webhookInfoRes = await fetch(`${webhookIdentity.origin}/api/webhooks/${webhookIdentity.webhookId}/${webhookIdentity.webhookToken}`);
            if (webhookInfoRes.ok) {
                const webhookInfo = await webhookInfoRes.json() as Record<string, unknown>;
                webhookResolvedChannelId = typeof webhookInfo.channel_id === 'string' ? webhookInfo.channel_id : undefined;
                webhookResolvedGuildId = typeof webhookInfo.guild_id === 'string' ? webhookInfo.guild_id : undefined;
            }
        }
        catch {
        }
        if (discordMessageId) {
            try {
                const verifyMessageRes = await fetch(`${webhookIdentity.origin}/api/webhooks/${webhookIdentity.webhookId}/${webhookIdentity.webhookToken}/messages/${discordMessageId}`);
                verifiedByFetch = verifyMessageRes.ok;
            }
            catch {
            }
        }
    }
    const effectiveGuildId = discordGuildId ?? webhookResolvedGuildId;
    const effectiveChannelId = discordChannelId ?? webhookResolvedChannelId;
    const messageLink = buildDiscordMessageLink(effectiveGuildId, effectiveChannelId, discordMessageId);
    const postedToDifferentChannel = !!(webhookResolvedChannelId && discordChannelId && webhookResolvedChannelId !== discordChannelId);
    return {
        success: true,
        message: 'Discord message sent',
        renderedMessage: finalMessage,
        webhook: redactWebhookUrl(discordWebhook),
        ...(discordMessageId ? { discordMessageId } : {}),
        ...(discordChannelId ? { discordChannelId } : {}),
        ...(discordGuildId ? { discordGuildId } : {}),
        ...(effectiveChannelId ? { effectiveChannelId } : {}),
        ...(effectiveGuildId ? { effectiveGuildId } : {}),
        ...(deliveredContent ? { deliveredContent } : {}),
        ...(messageLink ? { messageLink } : {}),
        ...(webhookResolvedChannelId ? { webhookResolvedChannelId } : {}),
        ...(webhookResolvedGuildId ? { webhookResolvedGuildId } : {}),
        verifiedByFetch,
        postedToDifferentChannel,
        ...(truncated ? { truncated: true, originalLength: formattedMessage.length } : {}),
    };
}
