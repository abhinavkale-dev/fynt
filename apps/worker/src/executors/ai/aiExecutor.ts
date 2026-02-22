import { parseTemplate, parseTemplateWithMetadata } from "@repo/shared/parser";
import type { AINodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
type SupportedAINodeType = "aiNode" | "openaiNode" | "anthropicNode" | "geminiNode";
type AIProvider = "openai" | "anthropic" | "gemini";
type AIInputMode = "prompt" | "json";
const MAX_PROMPT_CHARS = 200_000;
const PROMPT_TRUNCATION_SUFFIX = "\n\n[Prompt truncated by Fynt to stay within model context limits]";
const AI_PROVIDER_BY_NODE_TYPE: Record<SupportedAINodeType, AIProvider> = {
    aiNode: "openai",
    openaiNode: "openai",
    anthropicNode: "anthropic",
    geminiNode: "gemini",
};
const DEFAULT_MODEL_BY_PROVIDER: Record<AIProvider, string> = {
    openai: "gpt-5-mini",
    anthropic: "claude-sonnet-4-5",
    gemini: "gemini-2.5-flash",
};
function resolveInputMode(inputMode: unknown): AIInputMode {
    return inputMode === "json" ? "json" : "prompt";
}
function isRecord(value: unknown): value is Record<string, unknown> {
    return typeof value === "object" && value !== null && !Array.isArray(value);
}
function isNonEmptyString(value: unknown): value is string {
    return typeof value === "string" && value.trim().length > 0;
}
function addSummaryAliases<T extends Record<string, unknown>>(value: T): T {
    let nextValue: Record<string, unknown> = value;
    let changed = false;
    if (nextValue.summary === undefined && nextValue.summaryPrompt !== undefined) {
        nextValue = { ...nextValue, summary: nextValue.summaryPrompt };
        changed = true;
    }
    if (nextValue.summaryPrompt === undefined && nextValue.summary !== undefined) {
        nextValue = { ...nextValue, summaryPrompt: nextValue.summary };
        changed = true;
    }
    return changed ? (nextValue as T) : value;
}
function withLegacyPromptAliases(runMetadata: Record<string, NodeExecutionOutput>): Record<string, NodeExecutionOutput> {
    const augmented: Record<string, NodeExecutionOutput> = { ...runMetadata };
    for (const [key, value] of Object.entries(runMetadata)) {
        if (!isRecord(value))
            continue;
        let nextValue: Record<string, unknown> = value;
        let changed = false;
        const aliasedRoot = addSummaryAliases(nextValue);
        if (aliasedRoot !== nextValue) {
            nextValue = aliasedRoot;
            changed = true;
        }
        const dataValue = nextValue.data;
        if (isRecord(dataValue)) {
            const aliasedData = addSummaryAliases(dataValue);
            if (aliasedData !== dataValue) {
                nextValue = {
                    ...nextValue,
                    data: aliasedData,
                };
                changed = true;
            }
        }
        if (changed) {
            augmented[key] = nextValue as NodeExecutionOutput;
        }
    }
    return augmented;
}
function ensureOpenAIJsonInput(payload: unknown, providerLabel: string): Record<string, unknown> {
    if (!isRecord(payload)) {
        throw new Error(`${providerLabel} JSON input must be an object with a "messages" array.`);
    }
    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error(`${providerLabel} JSON input requires "messages" as a non-empty array. Example: {"messages":[{"role":"user","content":"Hello"}]}`);
    }
    const allowedRoles = new Set(["system", "user", "assistant", "developer"]);
    for (let index = 0; index < messages.length; index += 1) {
        const message = messages[index];
        if (!isRecord(message)) {
            throw new Error(`${providerLabel} JSON input messages[${index}] must be an object.`);
        }
        const role = message.role;
        if (!isNonEmptyString(role) || !allowedRoles.has(role)) {
            throw new Error(`${providerLabel} JSON input messages[${index}].role must be one of: system, user, assistant, developer.`);
        }
        const content = message.content;
        const validContent = isNonEmptyString(content) || (Array.isArray(content) && content.length > 0);
        if (!validContent) {
            throw new Error(`${providerLabel} JSON input messages[${index}].content must be a non-empty string or non-empty content array.`);
        }
    }
    return payload;
}
function ensureAnthropicJsonInput(payload: unknown, providerLabel: string): Record<string, unknown> {
    if (!isRecord(payload)) {
        throw new Error(`${providerLabel} JSON input must be an object with a "messages" array.`);
    }
    const messages = payload.messages;
    if (!Array.isArray(messages) || messages.length === 0) {
        throw new Error(`${providerLabel} JSON input requires "messages" as a non-empty array. Example: {"messages":[{"role":"user","content":"Hello"}]}`);
    }
    const allowedRoles = new Set(["user", "assistant"]);
    for (let index = 0; index < messages.length; index += 1) {
        const message = messages[index];
        if (!isRecord(message)) {
            throw new Error(`${providerLabel} JSON input messages[${index}] must be an object.`);
        }
        const role = message.role;
        if (!isNonEmptyString(role) || !allowedRoles.has(role)) {
            throw new Error(`${providerLabel} JSON input messages[${index}].role must be one of: user, assistant.`);
        }
        const content = message.content;
        const validContent = isNonEmptyString(content) || (Array.isArray(content) && content.length > 0);
        if (!validContent) {
            throw new Error(`${providerLabel} JSON input messages[${index}].content must be a non-empty string or non-empty content array.`);
        }
    }
    return payload;
}
function ensureGeminiJsonInput(payload: unknown, providerLabel: string): Record<string, unknown> {
    if (!isRecord(payload)) {
        throw new Error(`${providerLabel} JSON input must be an object with a "contents" array.`);
    }
    const contents = payload.contents;
    if (!Array.isArray(contents) || contents.length === 0) {
        throw new Error(`${providerLabel} JSON input requires "contents" as a non-empty array. Example: {"contents":[{"role":"user","parts":[{"text":"Hello"}]}]}`);
    }
    for (let contentIndex = 0; contentIndex < contents.length; contentIndex += 1) {
        const content = contents[contentIndex];
        if (!isRecord(content)) {
            throw new Error(`${providerLabel} JSON input contents[${contentIndex}] must be an object.`);
        }
        const parts = content.parts;
        if (!Array.isArray(parts) || parts.length === 0) {
            throw new Error(`${providerLabel} JSON input contents[${contentIndex}].parts must be a non-empty array.`);
        }
        const hasTextPart = parts.some((part) => isRecord(part) && isNonEmptyString(part.text));
        if (!hasTextPart) {
            throw new Error(`${providerLabel} JSON input contents[${contentIndex}].parts must include at least one part with non-empty "text".`);
        }
    }
    return payload;
}
function parseProviderJsonInput(params: {
    provider: AIProvider;
    providerLabel: string;
    requestJson: string;
    runMetadata: Record<string, NodeExecutionOutput>;
    executionMode: ExecutionMode;
}): Record<string, unknown> {
    const templateResult = parseTemplateWithMetadata(params.requestJson, params.runMetadata as Record<string, string>);
    const rendered = templateResult.output.trim();
    if (params.executionMode === "strict_template_v1" && templateResult.missingVars?.length) {
        throw new Error(`${params.providerLabel} JSON input uses undefined variables: ${templateResult.missingVars.join(", ")}.`);
    }
    if (!rendered) {
        throw new Error(`${params.providerLabel} JSON input is empty after template rendering.`);
    }
    let parsed: unknown;
    try {
        parsed = JSON.parse(rendered);
    }
    catch {
        throw new Error(`${params.providerLabel} JSON input is invalid JSON. Ensure the rendered JSON is valid for this provider.`);
    }
    if (params.provider === "openai") {
        return ensureOpenAIJsonInput(parsed, params.providerLabel);
    }
    if (params.provider === "anthropic") {
        return ensureAnthropicJsonInput(parsed, params.providerLabel);
    }
    return ensureGeminiJsonInput(parsed, params.providerLabel);
}
function resolveProvider(nodeType: string): AIProvider {
    if (nodeType in AI_PROVIDER_BY_NODE_TYPE) {
        return AI_PROVIDER_BY_NODE_TYPE[nodeType as SupportedAINodeType];
    }
    throw new Error(`Unsupported AI node type: ${nodeType}`);
}
function getProviderLabel(provider: AIProvider): string {
    switch (provider) {
        case "openai":
            return "OpenAI";
        case "anthropic":
            return "Anthropic";
        case "gemini":
            return "Gemini";
    }
}
function getProviderApiKeyFromEnv(provider: AIProvider): string | undefined {
    switch (provider) {
        case "openai":
            return process.env.OPENAI_API_KEY;
        case "anthropic":
            return process.env.ANTHROPIC_API_KEY;
        case "gemini":
            return process.env.GEMINI_API_KEY;
    }
}
function normalizeUsage(usage: unknown): NodeExecutionOutput | undefined {
    if (usage === undefined || usage === null)
        return undefined;
    return usage as NodeExecutionOutput;
}
function truncatePrompt(prompt: string): {
    prompt: string;
    truncated: boolean;
    originalLength: number;
} {
    const originalLength = prompt.length;
    if (originalLength <= MAX_PROMPT_CHARS) {
        return {
            prompt,
            truncated: false,
            originalLength,
        };
    }
    const available = Math.max(0, MAX_PROMPT_CHARS - PROMPT_TRUNCATION_SUFFIX.length);
    return {
        prompt: prompt.slice(0, available) + PROMPT_TRUNCATION_SUFFIX,
        truncated: true,
        originalLength,
    };
}
async function executeOpenAIRequest(params: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const messages: Array<{
        role: string;
        content: string;
    }> = [];
    if (params.systemPrompt) {
        messages.push({ role: "system", content: params.systemPrompt });
    }
    messages.push({ role: "user", content: params.prompt });
    const isReasoningModel = /^(o[1-4])(-|$)/.test(params.model) || /^gpt-5/.test(params.model);
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify({
            model: params.model,
            messages,
            ...(params.temperature !== undefined && !isReasoningModel ? { temperature: params.temperature } : {}),
            ...(params.maxTokens ? { max_tokens: params.maxTokens } : {}),
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "";
    return {
        success: true,
        data: content,
        model: result.model,
        usage: result.usage,
    };
}
async function executeAnthropicRequest(params: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": params.apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify({
            model: params.model,
            messages: [{ role: "user", content: params.prompt }],
            ...(params.systemPrompt ? { system: params.systemPrompt } : {}),
            ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
            max_tokens: params.maxTokens ?? 1024,
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json() as {
        model?: string;
        content?: Array<{
            type?: string;
            text?: string;
        }>;
        usage?: Record<string, unknown>;
    };
    const content = Array.isArray(result.content)
        ? result.content
            .filter((item) => item?.type === "text")
            .map((item) => item.text ?? "")
            .join("\n")
        : "";
    const normalizedUsage = normalizeUsage(result.usage);
    if (normalizedUsage === undefined) {
        return {
            success: true,
            data: content,
            model: result.model ?? params.model,
        };
    }
    return {
        success: true,
        data: content,
        model: result.model ?? params.model,
        usage: normalizedUsage,
    };
}
async function executeGeminiRequest(params: {
    apiKey: string;
    model: string;
    prompt: string;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
    const generationConfig = {
        ...(params.temperature !== undefined ? { temperature: params.temperature } : {}),
        ...(params.maxTokens ? { maxOutputTokens: params.maxTokens } : {}),
    };
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            contents: [{ role: "user", parts: [{ text: params.prompt }] }],
            ...(params.systemPrompt ? { systemInstruction: { parts: [{ text: params.systemPrompt }] } } : {}),
            ...(Object.keys(generationConfig).length > 0 ? { generationConfig } : {}),
        }),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json() as {
        candidates?: Array<{
            content?: {
                parts?: Array<{
                    text?: string;
                }>;
            };
        }>;
        usageMetadata?: Record<string, unknown>;
    };
    const content = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n") ?? "";
    const normalizedUsage = normalizeUsage(result.usageMetadata);
    if (normalizedUsage === undefined) {
        return {
            success: true,
            data: content,
            model: params.model,
        };
    }
    return {
        success: true,
        data: content,
        model: params.model,
        usage: normalizedUsage,
    };
}
async function executeOpenAIJsonRequest(params: {
    apiKey: string;
    model: string;
    requestBody: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const body: Record<string, unknown> = {
        ...params.requestBody,
        model: params.model,
    };
    const isReasoningModel = /^(o[1-4])(-|$)/.test(params.model) || /^gpt-5/.test(params.model);
    const bodyHasTemperature = typeof body.temperature === "number";
    const bodyHasMaxTokens = typeof body.max_tokens === "number";
    if (isReasoningModel && bodyHasTemperature) {
        delete body.temperature;
    }
    if (!bodyHasTemperature && params.temperature !== undefined && !isReasoningModel) {
        body.temperature = params.temperature;
    }
    if (!bodyHasMaxTokens && params.maxTokens !== undefined) {
        body.max_tokens = params.maxTokens;
    }
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${params.apiKey}`,
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`OpenAI API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json();
    const content = result.choices?.[0]?.message?.content ?? "";
    return {
        success: true,
        data: content,
        model: result.model,
        usage: result.usage,
    };
}
async function executeAnthropicJsonRequest(params: {
    apiKey: string;
    model: string;
    requestBody: Record<string, unknown>;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const body: Record<string, unknown> = {
        ...params.requestBody,
        model: params.model,
    };
    if (typeof body.temperature !== "number" && params.temperature !== undefined) {
        body.temperature = params.temperature;
    }
    if (typeof body.max_tokens !== "number") {
        body.max_tokens = params.maxTokens ?? 1024;
    }
    const response = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "x-api-key": params.apiKey,
            "anthropic-version": "2023-06-01",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Anthropic API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json() as {
        model?: string;
        content?: Array<{
            type?: string;
            text?: string;
        }>;
        usage?: Record<string, unknown>;
    };
    const content = Array.isArray(result.content)
        ? result.content
            .filter((item) => item?.type === "text")
            .map((item) => item.text ?? "")
            .join("\n")
        : "";
    const normalizedUsage = normalizeUsage(result.usage);
    if (normalizedUsage === undefined) {
        return {
            success: true,
            data: content,
            model: result.model ?? params.model,
        };
    }
    return {
        success: true,
        data: content,
        model: result.model ?? params.model,
        usage: normalizedUsage,
    };
}
async function executeGeminiJsonRequest(params: {
    apiKey: string;
    model: string;
    requestBody: Record<string, unknown>;
    systemPrompt?: string;
    temperature?: number;
    maxTokens?: number;
}): Promise<NodeExecutionOutput> {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(params.model)}:generateContent?key=${encodeURIComponent(params.apiKey)}`;
    const body: Record<string, unknown> = {
        ...params.requestBody,
    };
    if (params.systemPrompt && !body.systemInstruction) {
        body.systemInstruction = { parts: [{ text: params.systemPrompt }] };
    }
    const currentGenerationConfig = isRecord(body.generationConfig)
        ? { ...body.generationConfig }
        : {};
    if (params.temperature !== undefined && typeof currentGenerationConfig.temperature !== "number") {
        currentGenerationConfig.temperature = params.temperature;
    }
    if (params.maxTokens !== undefined && typeof currentGenerationConfig.maxOutputTokens !== "number") {
        currentGenerationConfig.maxOutputTokens = params.maxTokens;
    }
    if (Object.keys(currentGenerationConfig).length > 0) {
        body.generationConfig = currentGenerationConfig;
    }
    const response = await fetch(endpoint, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
    });
    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(`Gemini API error (${response.status}): ${errorBody}`);
    }
    const result = await response.json() as {
        candidates?: Array<{
            content?: {
                parts?: Array<{
                    text?: string;
                }>;
            };
        }>;
        usageMetadata?: Record<string, unknown>;
    };
    const content = result.candidates?.[0]?.content?.parts
        ?.map((part) => part.text ?? "")
        .join("\n") ?? "";
    const normalizedUsage = normalizeUsage(result.usageMetadata);
    if (normalizedUsage === undefined) {
        return {
            success: true,
            data: content,
            model: params.model,
        };
    }
    return {
        success: true,
        data: content,
        model: params.model,
        usage: normalizedUsage,
    };
}
export async function executeAINode(nodeType: string, data: AINodeData, _nodeRunId: string, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy', ownerUserId: string): Promise<NodeExecutionOutput> {
    const provider = resolveProvider(nodeType);
    const providerLabel = getProviderLabel(provider);
    const templateMetadata = withLegacyPromptAliases(runMetadata);
    const { prompt, model, temperature, maxTokens, systemPrompt, apiKey, credentialId, requestJson, inputMode: rawInputMode, } = data;
    const inputMode = resolveInputMode(rawInputMode);
    const trimmedModel = model?.trim();
    if (!trimmedModel && executionMode === "strict_template_v1") {
        throw new Error(`${providerLabel} node not configured - no model selected`);
    }
    let resolvedApiKey = apiKey?.trim() || undefined;
    if (credentialId) {
        const credential = await resolveCredential(credentialId, ownerUserId);
        if (credential.platform !== provider) {
            throw new Error(`Credential platform mismatch: ${nodeType} requires ${provider} credential, got ${credential.platform}`);
        }
        resolvedApiKey = credential.keys.apiKey || resolvedApiKey;
    }
    if (!resolvedApiKey) {
        resolvedApiKey = getProviderApiKeyFromEnv(provider);
    }
    if (!resolvedApiKey) {
        throw new Error(`${providerLabel} API key not configured`);
    }
    const parsedSystemPrompt = systemPrompt
        ? parseTemplate(systemPrompt, templateMetadata as Record<string, string>)
        : undefined;
    const resolvedModel = trimmedModel || DEFAULT_MODEL_BY_PROVIDER[provider];
    if (inputMode === "json") {
        const trimmedRequestJson = requestJson?.trim();
        if (!trimmedRequestJson) {
            if (executionMode === "strict_template_v1") {
                throw new Error(`${providerLabel} node not configured - no JSON input provided`);
            }
            return {
                success: true,
                skipped: true,
                reason: "No JSON input configured",
            };
        }
        const parsedJsonInput = parseProviderJsonInput({
            provider,
            providerLabel,
            requestJson: trimmedRequestJson,
            runMetadata: templateMetadata,
            executionMode,
        });
        if (provider === "openai") {
            return executeOpenAIJsonRequest({
                apiKey: resolvedApiKey,
                model: resolvedModel,
                requestBody: parsedJsonInput,
                ...(temperature !== undefined ? { temperature } : {}),
                ...(maxTokens !== undefined ? { maxTokens } : {}),
            });
        }
        if (provider === "anthropic") {
            return executeAnthropicJsonRequest({
                apiKey: resolvedApiKey,
                model: resolvedModel,
                requestBody: parsedJsonInput,
                ...(temperature !== undefined ? { temperature } : {}),
                ...(maxTokens !== undefined ? { maxTokens } : {}),
            });
        }
        return executeGeminiJsonRequest({
            apiKey: resolvedApiKey,
            model: resolvedModel,
            requestBody: parsedJsonInput,
            ...(parsedSystemPrompt ? { systemPrompt: parsedSystemPrompt } : {}),
            ...(temperature !== undefined ? { temperature } : {}),
            ...(maxTokens !== undefined ? { maxTokens } : {}),
        });
    }
    if (!prompt) {
        if (executionMode === 'strict_template_v1') {
            throw new Error(`${providerLabel} node not configured - no prompt provided`);
        }
        return {
            success: true,
            skipped: true,
            reason: 'No prompt configured',
        };
    }
    const promptResult = parseTemplateWithMetadata(prompt, templateMetadata as Record<string, string>);
    const parsedPrompt = promptResult.output;
    if (!parsedPrompt && promptResult.hasSubstitutions) {
        const missingVarList = promptResult.missingVars?.join(', ') || 'unknown variables';
        const errorMsg = `Prompt template uses undefined variables: ${missingVarList}. Original template: "${prompt.slice(0, 100)}${prompt.length > 100 ? '...' : ''}"`;
        if (executionMode === 'strict_template_v1') {
            throw new Error(errorMsg);
        }
        return {
            success: false,
            error: errorMsg,
            skipped: false
        };
    }
    if (!parsedPrompt) {
        if (executionMode === 'strict_template_v1') {
            throw new Error(`${providerLabel} node not configured - prompt is empty after parsing`);
        }
        return {
            success: true,
            skipped: true,
            reason: 'Prompt is empty after parsing',
        };
    }
    const truncatedPrompt = truncatePrompt(parsedPrompt);
    const requestParams = {
        apiKey: resolvedApiKey,
        model: resolvedModel,
        prompt: truncatedPrompt.prompt,
        ...(parsedSystemPrompt ? { systemPrompt: parsedSystemPrompt } : {}),
        ...(temperature !== undefined ? { temperature } : {}),
        ...(maxTokens !== undefined ? { maxTokens } : {}),
    };
    let response: NodeExecutionOutput;
    if (provider === "openai") {
        response = await executeOpenAIRequest(requestParams);
    }
    else if (provider === "anthropic") {
        response = await executeAnthropicRequest(requestParams);
    }
    else {
        response = await executeGeminiRequest(requestParams);
    }
    if (!truncatedPrompt.truncated) {
        return response;
    }
    if (response && typeof response === "object" && !Array.isArray(response)) {
        return {
            ...response,
            _inputTruncated: true,
            _inputOriginalLength: truncatedPrompt.originalLength,
            _inputTruncatedLength: truncatedPrompt.prompt.length,
            _inputTruncationReason: "prompt_char_limit_exceeded",
        };
    }
    return {
        success: true,
        data: response,
        _inputTruncated: true,
        _inputOriginalLength: truncatedPrompt.originalLength,
        _inputTruncatedLength: truncatedPrompt.prompt.length,
        _inputTruncationReason: "prompt_char_limit_exceeded",
    };
}
