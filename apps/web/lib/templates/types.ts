export interface TemplateNode {
    id: string;
    type: string;
    position: {
        x: number;
        y: number;
    };
    data: Record<string, unknown>;
}
export interface TemplateEdge {
    id: string;
    source: string;
    target: string;
    sourceHandle?: string;
    targetHandle?: string;
    data?: Record<string, unknown>;
}
export type TemplateCategory = "marketing" | "devops" | "data-etl" | "ai-automation" | "business" | "webhooks-apis";
export type TemplateDifficulty = "beginner" | "intermediate" | "advanced";
export type TemplateSetupMode = "credential_only" | "needs_input";
export interface TemplateRequiredBinding {
    id?: string;
    platform: "openai" | "anthropic" | "gemini" | "slack" | "discord" | "github" | "notion";
    nodeIds: string[];
    description?: string;
}
export interface TemplateInputRequirement {
    key: string;
    label: string;
    description: string;
    nodeId: string;
    fieldPath: string;
}
export interface TemplateFieldRequirement {
    nodeId: string;
    field: string;
    label: string;
    placeholder: string;
    type: 'text' | 'email' | 'select';
    required: boolean;
    options?: {
        value: string;
        label: string;
    }[];
    defaultValue?: string;
}
export interface WorkflowTemplate {
    id: string;
    name: string;
    description: string;
    category: TemplateCategory;
    difficulty: TemplateDifficulty;
    estimatedSetupMinutes: number;
    tags: string[];
    availableTriggerId: "manual" | "webhook";
    highlights: string[];
    requiredCredentials: Array<"openai" | "anthropic" | "gemini" | "slack" | "discord" | "github" | "notion">;
    nodes: TemplateNode[];
    edges: TemplateEdge[];
    setupMode: TemplateSetupMode;
    requiredBindings: TemplateRequiredBinding[];
    inputRequirements?: TemplateInputRequirement[];
    fieldRequirements?: TemplateFieldRequirement[];
    templateVersion: number;
}
export const TEMPLATE_CATEGORY_LABELS: Record<TemplateCategory, string> = {
    "marketing": "Marketing",
    "devops": "DevOps",
    "data-etl": "Data & ETL",
    "ai-automation": "AI & Automation",
    "business": "Business",
    "webhooks-apis": "Webhooks & APIs",
};
export function ensureTemplateMetadata(template: Partial<WorkflowTemplate>): WorkflowTemplate {
    const baseTemplate = template as WorkflowTemplate;
    if (!baseTemplate.setupMode) {
        baseTemplate.setupMode = "credential_only";
    }
    if (!baseTemplate.templateVersion) {
        baseTemplate.templateVersion = 1;
    }
    if (!baseTemplate.requiredBindings) {
        const bindings: TemplateRequiredBinding[] = [];
        const credentialPlatforms = baseTemplate.requiredCredentials || [];
        for (const platform of credentialPlatforms) {
            const nodeIds = (baseTemplate.nodes || [])
                .filter(node => {
                const nodeType = node.type.toLowerCase();
                return nodeType.includes(platform) ||
                    (platform === 'openai' && (nodeType.includes('ai') || nodeType.includes('openai'))) ||
                    (platform === 'anthropic' && nodeType.includes('anthropic')) ||
                    (platform === 'gemini' && nodeType.includes('gemini'));
            })
                .map(node => node.id);
            if (nodeIds.length > 0) {
                bindings.push({
                    platform,
                    nodeIds,
                    description: `${platform.charAt(0).toUpperCase() + platform.slice(1)} credential required`
                });
            }
        }
        baseTemplate.requiredBindings = bindings;
    }
    return baseTemplate;
}
