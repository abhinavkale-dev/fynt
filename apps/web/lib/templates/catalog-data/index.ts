import type { WorkflowTemplate } from "../types";
import { AI_AUTOMATION_TEMPLATES } from "./aiAutomation";
import { BUSINESS_TEMPLATES } from "./business";
import { DATA_ETL_TEMPLATES } from "./dataEtl";
import { DEVOPS_TEMPLATES } from "./devops";
import { MARKETING_TEMPLATES } from "./marketing";
import { WEBHOOKS_APIS_TEMPLATES } from "./webhooksApis";
const ALL_TEMPLATE_DEFINITIONS: Partial<WorkflowTemplate>[] = [
    ...WEBHOOKS_APIS_TEMPLATES,
    ...AI_AUTOMATION_TEMPLATES,
    ...DEVOPS_TEMPLATES,
    ...BUSINESS_TEMPLATES,
    ...DATA_ETL_TEMPLATES,
    ...MARKETING_TEMPLATES,
];
const TEMPLATE_MAP = new Map<string, Partial<WorkflowTemplate>>();
for (const template of ALL_TEMPLATE_DEFINITIONS) {
    if (typeof template.id !== "string") {
        continue;
    }
    TEMPLATE_MAP.set(template.id, template);
}
const TEMPLATE_ORDER = [
    "webhook-github-issue-alert-lite",
    "daily-ai-digest-notion-archive",
    "github-release-notes-notion-publisher",
    "incident-response-command-center",
    "gemini-social-post-sprint-lite",
    "meeting-notes-notion-sync-lite",
    "openai-quick-research-share-lite",
    "github-bug-triage-router",
    "weekly-campaign-briefing-discord",
    "notion-page-fetch-to-slack-lite",
    "discord-announcement-generator-lite",
    "notion-backlog-priority-sync",
    "cron-api-health-watch-lite",
    "openai-content-brief-notion-handoff",
    "multi-source-ai-research-agent",
    "dual-model-governance-review",
    "webhook-discord-alert-router",
    "openai-webhook-summary-discord",
    "cron-openai-health-summary",
    "github-issue-comment-assistant",
    "anthropic-standup-digest-discord",
    "policy-review-router",
    "weekly-trend-brief-discord",
    "content-repurpose-openai-discord",
    "release-risk-review-center",
] as const;
function getTemplateDefinition(templateId: string): Partial<WorkflowTemplate> {
    const template = TEMPLATE_MAP.get(templateId);
    if (!template) {
        throw new Error(`Missing template definition for "${templateId}"`);
    }
    return template;
}
export const TEMPLATES_RAW: Partial<WorkflowTemplate>[] = TEMPLATE_ORDER.map(getTemplateDefinition);
