export interface NodeDefinitionCore {
    type: string;
    label: string;
    description: string;
    category: 'triggers' | 'integrations' | 'logic' | 'utilities';
    isTrigger: boolean;
    maxPerWorkflow?: number;
    configMeta: {
        title: string;
        subtitle: string;
    };
}
export type NodeCategory = NodeDefinitionCore['category'];
export const CATEGORY_LABELS: Record<NodeCategory, string> = {
    triggers: 'Triggers',
    integrations: 'Integrations',
    logic: 'Logic & Control',
    utilities: 'Utilities',
};
export const CATEGORY_ORDER: NodeCategory[] = ['triggers', 'integrations', 'logic', 'utilities'];
export const NODE_REGISTRY: NodeDefinitionCore[] = [
    {
        type: 'manualTrigger',
        label: 'Manual Trigger',
        description: 'Start the workflow manually',
        category: 'triggers',
        isTrigger: true,
        maxPerWorkflow: 1,
        configMeta: { title: 'Trigger Configuration', subtitle: 'Configure the manual trigger' },
    },
    {
        type: 'webhookTrigger',
        label: 'Webhook Trigger',
        description: 'Runs workflow from external HTTP events',
        category: 'triggers',
        isTrigger: true,
        configMeta: { title: 'Webhook Trigger Configuration', subtitle: 'Configure inbound webhook settings' },
    },
    {
        type: 'cronTrigger',
        label: 'Cron Trigger',
        description: 'Runs workflow on a recurring schedule',
        category: 'triggers',
        isTrigger: true,
        configMeta: { title: 'Cron Trigger Configuration', subtitle: 'Configure recurring schedule' },
    },
    {
        type: 'httpTrigger',
        label: 'HTTP Request',
        description: 'Make an HTTP request',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'HTTP Configuration', subtitle: 'Configure the HTTP request' },
    },
    {
        type: 'githubNode',
        label: 'GitHub',
        description: 'Create and manage GitHub issues',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'GitHub Configuration', subtitle: 'Configure GitHub issue operations' },
    },
    {
        type: 'notionNode',
        label: 'Notion',
        description: 'Create and query Notion database pages',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'Notion Configuration', subtitle: 'Configure Notion database page operations' },
    },
    {
        type: 'openaiNode',
        label: 'OpenAI',
        description: 'Make a request to the OpenAI API',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'OpenAI Configuration', subtitle: 'Configure the AI Model to use' },
    },
    {
        type: 'geminiNode',
        label: 'Gemini',
        description: 'Make a request to the Gemini API',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'Gemini Configuration', subtitle: 'Configure the AI Model to use' },
    },
    {
        type: 'anthropicNode',
        label: 'Anthropic',
        description: 'Make a request to the Anthropic API',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'Anthropic Configuration', subtitle: 'Configure the AI Model to use' },
    },
    {
        type: 'discordNode',
        label: 'Discord',
        description: 'Make a request to the Discord API',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'Discord Configuration', subtitle: 'Configure the Discord webhook to use' },
    },
    {
        type: 'slackNode',
        label: 'Slack',
        description: 'Make a request to the Slack API',
        category: 'integrations',
        isTrigger: false,
        configMeta: { title: 'Slack Configuration', subtitle: 'Configure the Slack webhook to use' },
    },
    {
        type: 'conditionNode',
        label: 'Condition',
        description: 'Branch workflow based on expression rules',
        category: 'logic',
        isTrigger: false,
        configMeta: { title: 'Condition Configuration', subtitle: 'Configure routing logic and routes' },
    },
    {
        type: 'filterNode',
        label: 'Filter',
        description: 'Pass or block data based on a condition',
        category: 'logic',
        isTrigger: false,
        configMeta: { title: 'Filter Configuration', subtitle: 'Configure filter expression and operator' },
    },
    {
        type: 'delayNode',
        label: 'Delay',
        description: 'Pause execution for a configured duration',
        category: 'utilities',
        isTrigger: false,
        configMeta: { title: 'Delay Configuration', subtitle: 'Configure wait duration before continuing' },
    },
    {
        type: 'logNode',
        label: 'Log',
        description: 'Write structured logs from workflow data',
        category: 'utilities',
        isTrigger: false,
        configMeta: { title: 'Log Configuration', subtitle: 'Configure structured log output' },
    },
    {
        type: 'transformNode',
        label: 'Transform',
        description: 'Reshape data using template expressions',
        category: 'utilities',
        isTrigger: false,
        configMeta: { title: 'Transform Configuration', subtitle: 'Configure data transformation template' },
    },
];
const registryMap = new Map<string, NodeDefinitionCore>(NODE_REGISTRY.map((def) => [def.type, def]));
export function getNodeDef(type: string): NodeDefinitionCore | undefined {
    return registryMap.get(type);
}
export function getNodesByCategory(): Record<NodeCategory, NodeDefinitionCore[]> {
    const grouped: Record<NodeCategory, NodeDefinitionCore[]> = {
        triggers: [],
        integrations: [],
        logic: [],
        utilities: [],
    };
    for (const def of NODE_REGISTRY) {
        grouped[def.category].push(def);
    }
    return grouped;
}
