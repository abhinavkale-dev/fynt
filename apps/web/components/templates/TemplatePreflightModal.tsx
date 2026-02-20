"use client";
import { useState, useMemo, useEffect, useCallback } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { WorkflowTemplate } from "@/lib/templates/types";
import { getTemplateBindingKey, type CredentialBinding } from "@/lib/templates/instantiate";
import { trpc } from "@/lib/trpc/client";
interface TemplatePreflightModalProps {
    template: WorkflowTemplate | null;
    open: boolean;
    onClose: () => void;
    onConfirm: (bindings: CredentialBinding[], additionalFields?: Record<string, Record<string, string>>) => Promise<void>;
}
function isClearlyInvalidNotionId(value: string): boolean {
    const trimmed = value.trim();
    if (!trimmed)
        return true;
    if (/^0{8}-0{4}-0{4}-0{4}-0{12}$/i.test(trimmed))
        return true;
    if (/^x{16,}$/i.test(trimmed))
        return true;
    if (/^0{16,}$/i.test(trimmed))
        return true;
    if (trimmed === "change-this-secret")
        return true;
    return false;
}
function hyphenateNotionId(compactId: string): string {
    return `${compactId.slice(0, 8)}-${compactId.slice(8, 12)}-${compactId.slice(12, 16)}-${compactId.slice(16, 20)}-${compactId.slice(20, 32)}`;
}
function parseNotionUrl(value: string): URL | null {
    try {
        return new URL(value);
    }
    catch {
        if (!/^https?:\/\//i.test(value) && /notion\.so/i.test(value)) {
            try {
                return new URL(`https://${value}`);
            }
            catch {
                return null;
            }
        }
        return null;
    }
}
function normalizeNotionIdentifier(value: string): string | undefined {
    const trimmed = value.trim();
    if (!trimmed)
        return undefined;
    const parsedUrl = parseNotionUrl(trimmed);
    if (parsedUrl) {
        const path = parsedUrl.pathname;
        const pathUuidMatches = path.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/ig);
        if (pathUuidMatches && pathUuidMatches.length > 0) {
            return pathUuidMatches[pathUuidMatches.length - 1]!.toLowerCase();
        }
        const pathCompactMatches = path.match(/[0-9a-f]{32}/ig);
        if (pathCompactMatches && pathCompactMatches.length > 0) {
            const last = pathCompactMatches[pathCompactMatches.length - 1]!;
            return hyphenateNotionId(last.toLowerCase());
        }
    }
    const uuidMatch = trimmed.match(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i);
    if (uuidMatch?.[0])
        return uuidMatch[0].toLowerCase();
    const compactMatches = trimmed.match(/[0-9a-f]{32}/ig);
    if (compactMatches && compactMatches.length > 0) {
        const first = compactMatches[0]!;
        return hyphenateNotionId(first.toLowerCase());
    }
    return undefined;
}
function looksLikeTemplateExpression(value: string): boolean {
    return /\{[^{}]+\}/.test(value);
}
export function TemplatePreflightModal({ template, open, onClose, onConfirm }: TemplatePreflightModalProps) {
    const router = useRouter();
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { data: credentials = [], isLoading } = trpc.credentials.getAll.useQuery();
    const [selectedBindings, setSelectedBindings] = useState<Record<string, string>>({});
    const [additionalFields, setAdditionalFields] = useState<Record<string, Record<string, string>>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [submitError, setSubmitError] = useState<string | null>(null);
    const platformBindingCounts = useMemo(() => {
        if (!template) {
            return new Map<string, number>();
        }
        const counts = new Map<string, number>();
        for (const binding of template.requiredBindings) {
            counts.set(binding.platform, (counts.get(binding.platform) ?? 0) + 1);
        }
        return counts;
    }, [template]);
    const templateNodeDataById = useMemo(() => {
        if (!template) {
            return new Map<string, Record<string, unknown>>();
        }
        const byId = new Map<string, Record<string, unknown>>();
        for (const node of template.nodes) {
            if (node.data && typeof node.data === "object") {
                byId.set(node.id, node.data as Record<string, unknown>);
            }
        }
        return byId;
    }, [template]);
    const unboundFieldRequirements = useMemo(() => {
        if (!template?.fieldRequirements)
            return [];
        return template.fieldRequirements.filter((fieldReq) => {
            return !template.requiredBindings.some((binding) => binding.nodeIds.includes(fieldReq.nodeId));
        });
    }, [template]);
    const getEffectiveFieldValue = useCallback((fieldReq: NonNullable<WorkflowTemplate["fieldRequirements"]>[number]) => {
        const explicitValue = additionalFields[fieldReq.nodeId]?.[fieldReq.field];
        if (explicitValue !== undefined) {
            return explicitValue;
        }
        if (fieldReq.defaultValue !== undefined) {
            return fieldReq.defaultValue;
        }
        const nodeData = templateNodeDataById.get(fieldReq.nodeId);
        return nodeData?.[fieldReq.field];
    }, [additionalFields, templateNodeDataById]);
    const handleFieldChange = useCallback((nodeId: string, field: string, value: string) => {
        setAdditionalFields(prev => ({
            ...prev,
            [nodeId]: {
                ...prev[nodeId],
                [field]: value,
            }
        }));
    }, []);
    useEffect(() => {
        if (!template?.fieldRequirements)
            return;
        const defaultFields: Record<string, Record<string, string>> = {};
        template.fieldRequirements.forEach(fieldReq => {
            const defaultValue = fieldReq.defaultValue;
            if (!defaultValue)
                return;
            const nodeFields = defaultFields[fieldReq.nodeId] ?? {};
            nodeFields[fieldReq.field] = defaultValue;
            defaultFields[fieldReq.nodeId] = nodeFields;
        });
        setAdditionalFields(defaultFields);
    }, [template]);
    useEffect(() => {
        if (!open) {
            setSubmitError(null);
            setIsSubmitting(false);
        }
    }, [open]);
    useEffect(() => {
        if (!template)
            return;
        setSelectedBindings((prev) => {
            const nextBindings: Record<string, string> = {};
            for (const [index, binding] of template.requiredBindings.entries()) {
                const bindingKey = getTemplateBindingKey(binding, index);
                const platform = binding.platform;
                const platformCredentials = credentials.filter((credential) => credential.platform.toLowerCase() === platform);
                const previousSelection = prev[bindingKey];
                if (previousSelection &&
                    platformCredentials.some((credential) => credential.id === previousSelection)) {
                    nextBindings[bindingKey] = previousSelection;
                    continue;
                }
                if (platformCredentials.length === 1) {
                    nextBindings[bindingKey] = platformCredentials[0]!.id;
                }
            }
            const prevEntries = Object.entries(prev).sort();
            const nextEntries = Object.entries(nextBindings).sort();
            if (JSON.stringify(prevEntries) === JSON.stringify(nextEntries)) {
                return prev;
            }
            return nextBindings;
        });
    }, [template, credentials]);
    const missingPlatforms = useMemo(() => {
        if (!template)
            return [];
        const availablePlatforms = new Set(credentials.map(c => c.platform.toLowerCase()));
        return template.requiredBindings
            .map(b => b.platform)
            .filter(p => !availablePlatforms.has(p));
    }, [template, credentials]);
    const handleGoToCredentials = (platform: string) => {
        const params = new URLSearchParams();
        params.set("platform", platform);
        params.set("openCreate", "1");
        const currentRoute = searchParams.toString()
            ? `${pathname}?${searchParams.toString()}`
            : pathname;
        params.set("returnTo", currentRoute);
        router.push(`/home/credentials?${params.toString()}`);
    };
    const canProceed = useMemo(() => {
        if (!template)
            return false;
        const allCredentialsSelected = template.requiredBindings.every((binding, index) => selectedBindings[getTemplateBindingKey(binding, index)]);
        const allRequiredFieldsFilled = !template.fieldRequirements ||
            template.fieldRequirements.every(fieldReq => {
                if (!fieldReq.required)
                    return true;
                const rawValue = getEffectiveFieldValue(fieldReq);
                if (typeof rawValue === "string") {
                    if (!rawValue.trim())
                        return false;
                }
                else if (rawValue === undefined || rawValue === null) {
                    return false;
                }
                const isNotionIdField = fieldReq.field === "databaseId" ||
                    fieldReq.field === "dataSourceId" ||
                    fieldReq.field === "pageId";
                if (isNotionIdField) {
                    const value = String(rawValue);
                    if (looksLikeTemplateExpression(value)) {
                        return true;
                    }
                    const normalized = normalizeNotionIdentifier(value);
                    if (!normalized || isClearlyInvalidNotionId(normalized)) {
                        return false;
                    }
                }
                return true;
            });
        return allCredentialsSelected && allRequiredFieldsFilled;
    }, [template, selectedBindings, getEffectiveFieldValue]);
    const renderFieldControl = useCallback((fieldReq: NonNullable<WorkflowTemplate["fieldRequirements"]>[number]) => {
        const currentValueRaw = getEffectiveFieldValue(fieldReq);
        const currentValue = typeof currentValueRaw === "string"
            ? currentValueRaw
            : currentValueRaw === undefined || currentValueRaw === null
                ? ""
                : String(currentValueRaw);
        if (fieldReq.type === 'select') {
            return (<select className="w-full px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-white" value={currentValue} onChange={(e) => handleFieldChange(fieldReq.nodeId, fieldReq.field, e.target.value)}>
          {!fieldReq.defaultValue && <option value="">-- Select {fieldReq.label} --</option>}
          {fieldReq.options?.map((opt) => (<option key={opt.value} value={opt.value}>
              {opt.label}
            </option>))}
        </select>);
        }
        const isNotionIdField = fieldReq.field === "databaseId" ||
            fieldReq.field === "dataSourceId" ||
            fieldReq.field === "pageId";
        const normalizedNotionId = isNotionIdField
            ? normalizeNotionIdentifier(currentValue)
            : undefined;
        const notionFieldIsTemplate = isNotionIdField && looksLikeTemplateExpression(currentValue);
        const isInvalidNotionId = isNotionIdField &&
            currentValue.trim().length > 0 &&
            !notionFieldIsTemplate &&
            (!normalizedNotionId || isClearlyInvalidNotionId(normalizedNotionId));
        return (<>
        <input type={fieldReq.type} placeholder={fieldReq.placeholder} className="w-full px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-white placeholder:text-white/30" value={currentValue} onChange={(e) => handleFieldChange(fieldReq.nodeId, fieldReq.field, e.target.value)}/>
        {isInvalidNotionId && (<div className="text-xs text-amber-300 mt-1">
            Enter a valid Notion URL or ID. Placeholder/all-zero IDs are not allowed.
          </div>)}
        {isNotionIdField && (<div className="text-xs text-white/40 mt-1">
            {fieldReq.field === "pageId"
                    ? "Tip: You can paste a full Notion page link. Fynt will extract the page ID."
                    : "Tip: Paste a Notion database/data source link (not a regular page link). Fynt will extract the ID."}
          </div>)}
        {fieldReq.placeholder.includes('{') && (<div className="text-xs text-white/40 mt-1">
            Tip: You can use template variables like {fieldReq.placeholder.match(/\{[^}]+\}/)?.[0] || "{webhook.payload.field}"}
          </div>)}
        {!fieldReq.required && (<div className="text-xs text-white/40 mt-1">
            Optional — you can configure this later in the node settings.
          </div>)}
      </>);
    }, [getEffectiveFieldValue, handleFieldChange]);
    const handleConfirm = async () => {
        if (!template || !canProceed)
            return;
        const bindings: CredentialBinding[] = template.requiredBindings.map((binding, index) => {
            const bindingKey = getTemplateBindingKey(binding, index);
            const credentialId = selectedBindings[bindingKey];
            if (!credentialId) {
                throw new Error(`Missing credential binding for ${binding.platform} (${bindingKey})`);
            }
            return {
                bindingKey,
                platform: binding.platform,
                credentialId,
            };
        });
        try {
            setSubmitError(null);
            setIsSubmitting(true);
            const sanitizedFields: Record<string, Record<string, string>> = {};
            for (const [nodeId, fields] of Object.entries(additionalFields)) {
                const nextNodeFields: Record<string, string> = { ...fields };
                for (const [field, rawValue] of Object.entries(fields)) {
                    const isNotionIdField = field === "databaseId" ||
                        field === "dataSourceId" ||
                        field === "pageId";
                    if (!isNotionIdField)
                        continue;
                    if (looksLikeTemplateExpression(rawValue))
                        continue;
                    const normalized = normalizeNotionIdentifier(rawValue);
                    if (normalized) {
                        nextNodeFields[field] = normalized;
                    }
                }
                sanitizedFields[nodeId] = nextNodeFields;
            }
            await onConfirm(bindings, sanitizedFields);
            onClose();
        }
        catch (error) {
            setSubmitError(error instanceof Error ? error.message : "Failed to apply template setup.");
        }
        finally {
            setIsSubmitting(false);
        }
    };
    const handleCredentialSelect = (bindingKey: string, credentialId: string) => {
        setSelectedBindings(prev => ({
            ...prev,
            [bindingKey]: credentialId,
        }));
    };
    if (!template)
        return null;
    return (<Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Setup Template: {template.name}</DialogTitle>
          <DialogDescription>
            Select credentials for this template to work properly.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {template.requiredBindings.map((binding, index) => {
            const bindingKey = getTemplateBindingKey(binding, index);
            const platformCredentials = credentials.filter(c => c.platform.toLowerCase() === binding.platform);
            const selected = selectedBindings[bindingKey];
            const hasMissing = missingPlatforms.includes(binding.platform);
            const hasDuplicatePlatform = (platformBindingCounts.get(binding.platform) ?? 0) > 1;
            const bindingHint = hasDuplicatePlatform ? (binding.nodeIds[0] ?? `binding ${index + 1}`) : null;
            return (<div key={bindingKey} className="space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-sm capitalize text-white">
                      {binding.platform}
                      {bindingHint ? ` (${bindingHint})` : ""}
                    </div>
                    {binding.description && (<div className="text-xs text-muted-foreground">
                        {binding.description}
                      </div>)}
                    <div className="text-xs text-muted-foreground mt-1">
                      Required for: {binding.nodeIds.join(", ")}
                    </div>
                  </div>
                  {hasMissing && (<Button size="sm" variant="outline" onClick={() => handleGoToCredentials(binding.platform)}>
                      Set Up in Credentials
                    </Button>)}
                </div>

                {platformCredentials.length > 0 ? (<select className="w-full px-3 py-2 rounded-md border border-white/10 bg-white/5 text-sm text-white" value={selected || ""} onChange={(e) => handleCredentialSelect(bindingKey, e.target.value)}>
                    <option value="">-- Select {binding.platform} credential --</option>
                    {platformCredentials.map((cred) => (<option key={cred.id} value={cred.id}>
                        {cred.title}
                      </option>))}
                  </select>) : (<div className="px-3 py-2 rounded-md border border-amber-500/30 bg-amber-500/10 text-xs text-amber-200 flex items-center justify-between">
                    <span>No {binding.platform} credentials found. Create one in Credentials.</span>
                    <Button size="sm" variant="outline" className="h-7 text-[11px] bg-black text-white border-black hover:bg-neutral-900 hover:text-white" onClick={() => handleGoToCredentials(binding.platform)}>
                      Go
                    </Button>
                  </div>)}

                
                {selected && template.fieldRequirements
                    ?.filter(fieldReq => binding.nodeIds.includes(fieldReq.nodeId))
                    .map((fieldReq) => (<div key={`${fieldReq.nodeId}-${fieldReq.field}`} className="space-y-2 mt-3 pl-3 border-l-2 border-white/10">
                      <div>
                        <label className="text-xs text-white/70 mb-1 block">
                          {fieldReq.label} {fieldReq.required && <span className="text-red-400">*</span>}
                        </label>
                        {renderFieldControl(fieldReq)}
                      </div>
                    </div>))}
              </div>);
        })}

          {unboundFieldRequirements.length > 0 && (<div className="space-y-2">
              <div className="font-medium text-sm text-white">Template fields</div>
              <div className="text-xs text-muted-foreground">
                These fields are required but not tied to a credential.
              </div>
              {unboundFieldRequirements.map((fieldReq) => (<div key={`unbound-${fieldReq.nodeId}-${fieldReq.field}`} className="space-y-2 pl-3 border-l-2 border-white/10">
                  <div>
                    <label className="text-xs text-white/70 mb-1 block">
                      {fieldReq.label} {fieldReq.required && <span className="text-red-400">*</span>}
                    </label>
                    {renderFieldControl(fieldReq)}
                  </div>
                </div>))}
            </div>)}

          {template.setupMode === "needs_input" && template.inputRequirements && template.inputRequirements.length > 0 && (<div className="mt-4 p-3 rounded-md border border-blue-500/30 bg-blue-500/10">
              <div className="text-sm font-medium text-blue-200 mb-2">
                Additional Setup Required
              </div>
              <div className="text-xs text-blue-200/80 space-y-1">
                {template.inputRequirements.map((req, idx) => (<div key={idx}>
                    • {req.label}: {req.description}
                  </div>))}
              </div>
            </div>)}

          {submitError && (<div className="rounded-md border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-200">
              {submitError}
            </div>)}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isSubmitting} className="bg-red-500 hover:bg-red-600 text-white border-red-500 hover:border-red-600">
            Cancel
          </Button>
          <Button onClick={() => void handleConfirm()} disabled={!canProceed || isLoading || isSubmitting} className="bg-white hover:bg-gray-100 text-black disabled:bg-white/50 disabled:text-black/50">
            {isSubmitting ? "Applying..." : "Create Workflow"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>);
}
