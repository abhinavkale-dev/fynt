import type { Edge, Node } from "@xyflow/react";
import type { TemplateRequiredBinding, WorkflowTemplate } from "./types";
interface InstantiatedTemplate {
    nodes: Node[];
    edges: Edge[];
}
export interface CredentialBinding {
    bindingKey?: string;
    platform: string;
    credentialId: string;
}
export interface BindTemplateOptions {
    fillMissingOnly?: boolean;
}
interface TemplateBindingEntry {
    binding: TemplateRequiredBinding;
    index: number;
    key: string;
}
const WEBHOOK_SECRET_PLACEHOLDER = "change-this-secret";
function generateWebhookSecret(): string {
    if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
        return `wh_${crypto.randomUUID().replace(/-/g, "")}`;
    }
    return `wh_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}
function shouldAutoGenerateWebhookSecret(secret: unknown): boolean {
    if (typeof secret !== "string")
        return true;
    const trimmed = secret.trim();
    if (!trimmed)
        return true;
    return trimmed.toLowerCase() === WEBHOOK_SECRET_PLACEHOLDER;
}
function extractCredentialFields(data: unknown): Record<string, string> {
    const objectValue = data && typeof data === "object" && !Array.isArray(data)
        ? (data as Record<string, unknown>)
        : null;
    if (!objectValue) {
        return {};
    }
    const credentials: Record<string, string> = {};
    for (const [key, value] of Object.entries(objectValue)) {
        if (!/credentialid$/i.test(key))
            continue;
        if (typeof value !== "string")
            continue;
        const trimmed = value.trim();
        if (!trimmed)
            continue;
        credentials[key] = trimmed;
    }
    return credentials;
}
function getTemplateBindingEntries(template: WorkflowTemplate): TemplateBindingEntry[] {
    return template.requiredBindings.map((binding, index) => ({
        binding,
        index,
        key: getTemplateBindingKey(binding, index),
    }));
}
export function getTemplateBindingKey(binding: TemplateRequiredBinding, index: number): string {
    const bindingId = typeof binding.id === "string" ? binding.id.trim() : "";
    if (bindingId.length > 0) {
        return bindingId;
    }
    const normalizedNodeIds = [...binding.nodeIds]
        .map((nodeId) => nodeId.trim())
        .filter((nodeId) => nodeId.length > 0)
        .sort()
        .join(",");
    if (normalizedNodeIds.length > 0) {
        return `${binding.platform}:${normalizedNodeIds}`;
    }
    return `${binding.platform}:binding-${index}`;
}
export function bindCredentialsToTemplate(template: WorkflowTemplate, credentialBindings: CredentialBinding[], additionalFields?: Record<string, Record<string, string>>, options?: BindTemplateOptions): WorkflowTemplate {
    const bindingEntries = getTemplateBindingEntries(template);
    const bindingByNodeId = new Map<string, TemplateBindingEntry>();
    for (const entry of bindingEntries) {
        for (const nodeId of entry.binding.nodeIds) {
            if (!bindingByNodeId.has(nodeId)) {
                bindingByNodeId.set(nodeId, entry);
            }
        }
    }
    const platformBindingCount = new Map<string, number>();
    for (const entry of bindingEntries) {
        const count = platformBindingCount.get(entry.binding.platform) ?? 0;
        platformBindingCount.set(entry.binding.platform, count + 1);
    }
    const bindingKeyMap = new Map<string, string>();
    const platformFallbackMap = new Map<string, string>();
    for (const binding of credentialBindings) {
        const credentialId = binding.credentialId.trim();
        if (!credentialId)
            continue;
        const bindingKey = typeof binding.bindingKey === "string" ? binding.bindingKey.trim() : "";
        if (bindingKey.length > 0) {
            bindingKeyMap.set(bindingKey, credentialId);
            continue;
        }
        if (!platformFallbackMap.has(binding.platform)) {
            platformFallbackMap.set(binding.platform, credentialId);
        }
    }
    const updatedNodes = template.nodes.map(node => {
        const bindingEntry = bindingByNodeId.get(node.id);
        let resolvedCredentialId: string | undefined;
        if (bindingEntry) {
            resolvedCredentialId = bindingKeyMap.get(bindingEntry.key);
            if (!resolvedCredentialId) {
                const isPlatformUnique = (platformBindingCount.get(bindingEntry.binding.platform) ?? 0) === 1;
                if (isPlatformUnique) {
                    resolvedCredentialId = platformFallbackMap.get(bindingEntry.binding.platform);
                }
            }
        }
        const extraFields = additionalFields?.[node.id] ?? {};
        const existingData = node.data as Record<string, unknown>;
        const existingCredentialIdRaw = existingData.credentialId;
        const existingCredentialId = typeof existingCredentialIdRaw === "string" && existingCredentialIdRaw.trim().length > 0
            ? existingCredentialIdRaw.trim()
            : undefined;
        const credentialId = options?.fillMissingOnly
            ? (existingCredentialId ?? resolvedCredentialId)
            : (resolvedCredentialId ?? existingCredentialId);
        if (bindingEntry && !credentialId) {
            return {
                ...node,
                data: {
                    ...node.data,
                    ...extraFields,
                },
            };
        }
        const nodeFieldRequirements = template.fieldRequirements?.filter(req => req.nodeId === node.id && req.required) || [];
        const allRequiredFieldsFilled = nodeFieldRequirements.every(req => {
            const overrideValue = extraFields[req.field];
            if (typeof overrideValue === "string") {
                return overrideValue.trim() !== "";
            }
            const existingValue = existingData[req.field];
            if (typeof existingValue === "string") {
                return existingValue.trim() !== "";
            }
            return existingValue !== undefined && existingValue !== null;
        });
        const hasRequiredCredential = bindingEntry ? Boolean(credentialId) : true;
        const isFullyConfigured = hasRequiredCredential &&
            (nodeFieldRequirements.length === 0 || allRequiredFieldsFilled);
        const data: Record<string, unknown> = {
            ...node.data,
            ...extraFields,
            isConfigured: isFullyConfigured,
        };
        if (credentialId) {
            data.credentialId = credentialId;
        }
        return {
            ...node,
            data,
        };
    });
    return {
        ...template,
        nodes: updatedNodes,
    };
}
export function instantiateTemplateGraph(template: WorkflowTemplate, credentialBindings?: CredentialBinding[], additionalFields?: Record<string, Record<string, string>>, options?: BindTemplateOptions): InstantiatedTemplate {
    const boundTemplate = credentialBindings
        ? bindCredentialsToTemplate(template, credentialBindings, additionalFields, options)
        : template;
    const nodes: Node[] = boundTemplate.nodes.map((node) => {
        const nodeData = { ...node.data };
        if (node.type === "webhookTrigger") {
            const currentSecret = (nodeData as Record<string, unknown>).secret;
            if (shouldAutoGenerateWebhookSecret(currentSecret)) {
                (nodeData as Record<string, unknown>).secret = generateWebhookSecret();
            }
            (nodeData as Record<string, unknown>).isConfigured = true;
        }
        return {
            id: node.id,
            type: node.type,
            position: node.position,
            data: {
                ...nodeData,
                nodeType: node.type,
                label: typeof node.data.label === "string" ? node.data.label : node.type,
            },
        };
    });
    const edges: Edge[] = boundTemplate.edges.map((edge) => ({
        id: edge.id,
        source: edge.source,
        target: edge.target,
        ...(edge.sourceHandle ? { sourceHandle: edge.sourceHandle } : {}),
        ...(edge.targetHandle ? { targetHandle: edge.targetHandle } : {}),
        ...(edge.data || edge.sourceHandle
            ? {
                data: {
                    ...(edge.data ?? {}),
                    ...(edge.sourceHandle ? { route: edge.sourceHandle } : {}),
                },
            }
            : {}),
    }));
    return { nodes, edges };
}
export function instantiateTemplateGraphPreservingCredentials(template: WorkflowTemplate, currentNodes: Node[], credentialBindings?: CredentialBinding[], additionalFields?: Record<string, Record<string, string>>, options?: BindTemplateOptions): InstantiatedTemplate {
    const resetGraph = instantiateTemplateGraph(template, credentialBindings, additionalFields, options);
    const credentialByNodeId = new Map<string, Record<string, string>>();
    for (const node of currentNodes) {
        const credentialFields = extractCredentialFields(node.data);
        if (Object.keys(credentialFields).length === 0) {
            continue;
        }
        credentialByNodeId.set(node.id, credentialFields);
    }
    const nodes = resetGraph.nodes.map((node) => {
        const credentialFields = credentialByNodeId.get(node.id);
        if (!credentialFields) {
            return node;
        }
        return {
            ...node,
            data: {
                ...(node.data as Record<string, unknown>),
                ...credentialFields,
            },
        };
    });
    return {
        nodes,
        edges: resetGraph.edges,
    };
}
