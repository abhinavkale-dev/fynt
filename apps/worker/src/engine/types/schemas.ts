import { z } from 'zod';
const optionalUrlField = z.preprocess((value) => {
    if (typeof value === 'string' && value.trim() === '')
        return undefined;
    return value;
}, z.string().url().optional());
const positionSchema = z.object({
    x: z.number(),
    y: z.number(),
});
const webhookTriggerNodeDataSchema = z.object({
    secret: z.string().optional(),
    routeKey: z.string().optional(),
    responseName: z.string().optional(),
}).passthrough();
const cronTriggerNodeDataSchema = z.object({
    schedule: z.enum(['every_5_minutes', 'hourly', 'daily', 'weekly']).optional(),
    hour: z.number().min(0).max(23).optional(),
    minute: z.number().min(0).max(59).optional(),
    dayOfWeek: z.number().min(0).max(6).optional(),
    timezone: z.string().optional(),
    responseName: z.string().optional(),
}).passthrough();
const conditionNodeDataSchema = z.object({
    expression: z.string().optional(),
    defaultRoute: z.string().optional(),
    routes: z.array(z.string()).optional(),
    rulesJson: z.string().optional(),
    rules: z.array(z.object({
        route: z.string(),
        operator: z.enum(['equals', 'contains', 'not_equals']),
        value: z.string(),
    })).optional(),
    responseName: z.string().optional(),
}).passthrough();
const delayNodeDataSchema = z.object({
    durationMs: z.number().positive().optional(),
    responseName: z.string().optional(),
}).passthrough();
const logNodeDataSchema = z.object({
    message: z.string().optional(),
    level: z.enum(['debug', 'info', 'warn', 'error']).optional(),
    responseName: z.string().optional(),
}).passthrough();
const discordNodeDataSchema = z.object({
    webhookUrl: optionalUrlField,
    content: z.string().optional(),
    message: z.string().optional(),
    username: z.string().optional(),
    responseName: z.string().optional(),
    credentialId: z.string().optional(),
}).passthrough();
const slackNodeDataSchema = z.object({
    webhookUrl: optionalUrlField,
    message: z.string().optional(),
    channel: z.string().optional(),
    username: z.string().optional(),
    iconEmoji: z.string().optional(),
    responseName: z.string().optional(),
    credentialId: z.string().optional(),
}).passthrough();
const telegramNodeDataSchema = z.object({
    botToken: z.string(),
    chatId: z.string(),
    message: z.string(),
});
const httpNodeDataSchema = z.object({
    url: optionalUrlField,
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).optional(),
    headers: z.union([
        z.record(z.string()),
        z.array(z.object({ key: z.string(), value: z.string() }))
    ]).optional(),
    body: z.unknown().optional(),
    timeout: z.number().optional(),
    responseName: z.string().optional(),
}).passthrough();
const githubNodeDataSchema = z.object({
    responseName: z.string().optional(),
    credentialId: z.string().optional(),
    operation: z.enum(['create_issue', 'create_comment', 'get_issue']).optional(),
    owner: z.string().optional(),
    repo: z.string().optional(),
    issueNumber: z.string().optional(),
    title: z.string().optional(),
    body: z.string().optional(),
    labelsTemplate: z.string().optional(),
}).passthrough();
const notionNodeDataSchema = z.object({
    responseName: z.string().optional(),
    credentialId: z.string().optional(),
    operation: z.enum(['create', 'get', 'get_many', 'update']).optional(),
    dataSourceId: z.string().optional(),
    databaseId: z.string().optional(),
    pageId: z.string().optional(),
    propertiesTemplate: z.string().optional(),
    childrenTemplate: z.string().optional(),
    filterTemplate: z.string().optional(),
    sortsTemplate: z.string().optional(),
    pageSize: z.number().int().min(1).max(100).optional(),
    startCursor: z.string().optional(),
    archived: z.boolean().optional(),
}).passthrough();
const aiNodeDataSchema = z.object({
    prompt: z.string().optional(),
    model: z.string().optional(),
    temperature: z.number().min(0).max(2).optional(),
    maxTokens: z.number().positive().optional(),
    systemPrompt: z.string().optional(),
    inputMode: z.enum(['prompt', 'json']).optional(),
    requestJson: z.string().optional(),
    credentialId: z.string().optional(),
    responseName: z.string().optional(),
}).passthrough();
const manualTriggerNodeDataSchema = z.object({
    payload: z.record(z.unknown()).optional(),
}).passthrough();
const transformNodeDataSchema = z.object({
    expression: z.string().optional(),
    responseName: z.string().optional(),
}).passthrough();
const filterNodeDataSchema = z.object({
    expression: z.string().optional(),
    operator: z.enum(['equals', 'contains', 'not_equals', 'exists']).optional(),
    value: z.string().optional(),
    responseName: z.string().optional(),
}).passthrough();
const workflowNodeSchema = z.discriminatedUnion('type', [
    z.object({
        id: z.string(),
        type: z.literal('discordNode'),
        data: discordNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('slackNode'),
        data: slackNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('telegram'),
        data: telegramNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('httpTrigger'),
        data: httpNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('githubNode'),
        data: githubNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('notionNode'),
        data: notionNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('aiNode'),
        data: aiNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('openaiNode'),
        data: aiNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('geminiNode'),
        data: aiNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('anthropicNode'),
        data: aiNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('triggerNode'),
        data: manualTriggerNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('manualTrigger'),
        data: manualTriggerNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('webhookTrigger'),
        data: webhookTriggerNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('cronTrigger'),
        data: cronTriggerNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('conditionNode'),
        data: conditionNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('delayNode'),
        data: delayNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('logNode'),
        data: logNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('transformNode'),
        data: transformNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough(),
    z.object({
        id: z.string(),
        type: z.literal('filterNode'),
        data: filterNodeDataSchema,
        position: positionSchema.optional(),
    }).passthrough()
]);
const workflowEdgeSchema = z.object({
    id: z.string(),
    source: z.string(),
    target: z.string(),
    sourceHandle: z.string().optional(),
    targetHandle: z.string().optional(),
    data: z.record(z.unknown()).optional(),
}).passthrough();
export const workflowNodeArraySchema = z.array(workflowNodeSchema);
export const workflowEdgeArraySchema = z.array(workflowEdgeSchema);
