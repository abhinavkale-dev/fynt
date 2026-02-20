import type { NodeStatus } from '@repo/prisma';
export interface WorkflowEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data?: Record<string, unknown>;
}
export interface Position {
    x: number;
    y: number;
}
export interface DiscordNodeData {
    webhookUrl?: string;
    message?: string;
    content?: string;
    username?: string;
    credentialId?: string;
}
export interface SlackNodeData {
    webhookUrl?: string;
    message?: string;
    channel?: string;
    credentialId?: string;
}
export interface TelegramNodeData {
    botToken: string;
    chatId: string;
    message: string;
}
export interface HTTPNodeData {
    url?: string;
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: unknown;
    timeout?: number;
    responseName?: string;
}
export interface GitHubNodeData {
    responseName?: string;
    credentialId?: string;
    operation?: 'create_issue' | 'create_comment' | 'get_issue';
    owner?: string;
    repo?: string;
    issueNumber?: string;
    title?: string;
    body?: string;
    labelsTemplate?: string;
}
export interface NotionNodeData {
    responseName?: string;
    credentialId?: string;
    operation?: 'create' | 'get' | 'get_many' | 'update';
    dataSourceId?: string;
    databaseId?: string;
    pageId?: string;
    propertiesTemplate?: string;
    childrenTemplate?: string;
    filterTemplate?: string;
    sortsTemplate?: string;
    pageSize?: number;
    startCursor?: string;
    archived?: boolean;
}
export interface AINodeData {
    prompt?: string;
    model?: string;
    temperature?: number;
    maxTokens?: number;
    systemPrompt?: string;
    inputMode?: 'prompt' | 'json';
    requestJson?: string;
    apiKey?: string;
    credentialId?: string;
    responseName?: string;
}
export interface ManualTriggerNodeData {
    payload?: Record<string, unknown>;
}
export interface WebhookTriggerNodeData {
    secret?: string;
    routeKey?: string;
    responseName?: string;
}
export interface CronTriggerNodeData {
    schedule?: 'every_5_minutes' | 'hourly' | 'daily' | 'weekly';
    hour?: number;
    minute?: number;
    dayOfWeek?: number;
    timezone?: string;
    responseName?: string;
}
export interface ConditionRule {
    route: string;
    operator: 'equals' | 'contains' | 'not_equals';
    value: string;
}
export interface ConditionNodeData {
    expression?: string;
    defaultRoute?: string;
    routes?: string[];
    rulesJson?: string;
    rules?: ConditionRule[];
    responseName?: string;
}
export interface DelayNodeData {
    durationMs?: number;
    responseName?: string;
}
export interface LogNodeData {
    message?: string;
    level?: 'debug' | 'info' | 'warn' | 'error';
    responseName?: string;
}
export interface TransformNodeData {
    expression?: string;
    responseName?: string;
}
export interface FilterNodeData {
    expression?: string;
    operator?: 'equals' | 'contains' | 'not_equals' | 'exists';
    value?: string;
    responseName?: string;
}
export type WorkflowNode = {
    id: string;
    type: 'discordNode';
    data: DiscordNodeData;
    position?: Position;
} | {
    id: string;
    type: 'slackNode';
    data: SlackNodeData;
    position?: Position;
} | {
    id: string;
    type: 'telegram';
    data: TelegramNodeData;
    position?: Position;
} | {
    id: string;
    type: 'httpTrigger';
    data: HTTPNodeData;
    position?: Position;
} | {
    id: string;
    type: 'githubNode';
    data: GitHubNodeData;
    position?: Position;
} | {
    id: string;
    type: 'notionNode';
    data: NotionNodeData;
    position?: Position;
} | {
    id: string;
    type: 'aiNode';
    data: AINodeData;
    position?: Position;
} | {
    id: string;
    type: 'openaiNode';
    data: AINodeData;
    position?: Position;
} | {
    id: string;
    type: 'geminiNode';
    data: AINodeData;
    position?: Position;
} | {
    id: string;
    type: 'anthropicNode';
    data: AINodeData;
    position?: Position;
} | {
    id: string;
    type: 'triggerNode';
    data: ManualTriggerNodeData;
    position?: Position;
} | {
    id: string;
    type: 'manualTrigger';
    data: ManualTriggerNodeData;
    position?: Position;
} | {
    id: string;
    type: 'webhookTrigger';
    data: WebhookTriggerNodeData;
    position?: Position;
} | {
    id: string;
    type: 'cronTrigger';
    data: CronTriggerNodeData;
    position?: Position;
} | {
    id: string;
    type: 'conditionNode';
    data: ConditionNodeData;
    position?: Position;
} | {
    id: string;
    type: 'delayNode';
    data: DelayNodeData;
    position?: Position;
} | {
    id: string;
    type: 'logNode';
    data: LogNodeData;
    position?: Position;
} | {
    id: string;
    type: 'transformNode';
    data: TransformNodeData;
    position?: Position;
} | {
    id: string;
    type: 'filterNode';
    data: FilterNodeData;
    position?: Position;
};
export type NodeExecutionOutput = string | number | boolean | null | {
    [key: string]: NodeExecutionOutput;
} | NodeExecutionOutput[];
export interface NodeRun {
    id: string;
    nodeId: string;
    status: NodeStatus;
    retryCount: number;
    output?: NodeExecutionOutput | null;
}
