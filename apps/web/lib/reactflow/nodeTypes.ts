import { AINode, AnthropicNode, ConditionNode, CronTriggerNode, DelayNode, DiscordNode, FilterNode, GeminiNode, GitHubNode, HTTPNode, LogNode, NotionNode, OpenAINode, SlackNode, TransformNode, TriggerNode, WebhookTriggerNode, } from '@/components/workflows/nodes';
export const nodeTypes = {
    aiNode: AINode,
    triggerNode: TriggerNode,
    httpTrigger: HTTPNode,
    githubNode: GitHubNode,
    notionNode: NotionNode,
    openaiNode: OpenAINode,
    geminiNode: GeminiNode,
    anthropicNode: AnthropicNode,
    slackNode: SlackNode,
    discordNode: DiscordNode,
    manualTrigger: TriggerNode,
    webhookTrigger: WebhookTriggerNode,
    cronTrigger: CronTriggerNode,
    conditionNode: ConditionNode,
    delayNode: DelayNode,
    logNode: LogNode,
    transformNode: TransformNode,
    filterNode: FilterNode,
} as const;
export type NodeType = keyof typeof nodeTypes;
