import type { WorkflowTemplate } from "./types";
import { ensureTemplateMetadata } from "./types";
import { TEMPLATES_RAW } from "./catalog-data";
export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = TEMPLATES_RAW.map(ensureTemplateMetadata);
export function getWorkflowTemplateById(templateId: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find((template) => template.id === templateId);
}
