import { parseTemplate, parseTemplateWithMetadata } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { NotionNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { resolveCredential } from "../../engine/credentialResolver.js";
import type { ExecutionMode } from "../../engine/executor.js";
const NOTION_BASE_URL = "https://api.notion.com/v1";
const NOTION_VERSION = "2025-09-03";
const NOTION_LEGACY_VERSION = "2022-06-28";
class NotionRequestError extends Error {
    status: number;
    detail: string;
    hint: string;
    operation: string;
    constructor(operation: string, status: number, detail: string, hint: string) {
        super(`Notion API error during ${operation} (${status}): ${detail}${hint ? `\nHint: ${hint}` : ""}`);
        this.name = "NotionRequestError";
        this.status = status;
        this.detail = detail;
        this.hint = hint;
        this.operation = operation;
    }
}
function getNotionErrorHint(status: number): string {
    switch (status) {
        case 400:
            return "Invalid Notion request payload. Check IDs and properties JSON.";
        case 401:
            return "Invalid or expired Notion token. Update your Notion credential.";
        case 403:
            return "Access denied. Verify integration access to this workspace/database/page.";
        case 404:
            return "Resource not found. Verify dataSourceId/databaseId/pageId and sharing permissions.";
        case 409:
            return "Notion conflict error. Retry after resolving conflicting edits.";
        case 429:
            return "Notion API rate limit exceeded. Retry later or reduce request frequency.";
        case 500:
        case 502:
        case 503:
            return "Notion service is temporarily unavailable. Retry later.";
        default:
            if (status >= 400 && status < 500)
                return "Client error. Verify request configuration.";
            if (status >= 500)
                return "Server error from Notion API.";
            return "";
    }
}
function parseResponseBody(bodyText: string): NodeExecutionOutput {
    if (!bodyText)
        return {};
    try {
        return JSON.parse(bodyText) as NodeExecutionOutput;
    }
    catch {
        return bodyText as NodeExecutionOutput;
    }
}
function parseJsonTemplate(template: string, label: string, runMetadata: Record<string, NodeExecutionOutput>, expected: "object" | "array" | "object_or_array" = "object"): Record<string, unknown> | unknown[] {
    const parsed = parseTemplateWithMetadata(template, runMetadata as Record<string, string>).output.trim();
    if (!parsed) {
        throw new Error(`${label} resolved to an empty value.`);
    }
    let value: unknown;
    try {
        value = JSON.parse(parsed) as unknown;
    }
    catch (error) {
        const message = error instanceof Error ? error.message : "Unknown parse error";
        throw new Error(`${label} must resolve to valid JSON. ${message} ` +
            `When referencing object/array outputs, use the {json variable.path} helper.`);
    }
    const isArray = Array.isArray(value);
    const isObject = typeof value === "object" && value !== null && !isArray;
    if (expected === "object" && !isObject) {
        throw new Error(`${label} must resolve to a JSON object.`);
    }
    if (expected === "array" && !isArray) {
        throw new Error(`${label} must resolve to a JSON array.`);
    }
    if (expected === "object_or_array" && !isObject && !isArray) {
        throw new Error(`${label} must resolve to a JSON object or array.`);
    }
    return value as Record<string, unknown> | unknown[];
}
function parseNotionId(value: string | undefined, fieldName: string, runMetadata: Record<string, NodeExecutionOutput>): string {
    const parsed = parseTemplate(value ?? "", runMetadata as Record<string, string>).trim();
    if (!parsed) {
        throw new Error(`Notion ${fieldName} is required.`);
    }
    const normalized = normalizeNotionIdentifier(parsed);
    if (!normalized) {
        throw new Error(`Notion ${fieldName} must be a valid Notion ID or Notion URL.`);
    }
    if (isClearlyInvalidNotionId(normalized)) {
        throw new Error(`Notion ${fieldName} is invalid (${parsed}). Use a real Notion page/data-source/database ID or URL and ensure the integration is shared to that resource.`);
    }
    return normalized;
}
function parseNotionTargetId(dataSourceIdValue: string | undefined, databaseIdValue: string | undefined, runMetadata: Record<string, NodeExecutionOutput>, operation: "create" | "get_many"): {
    id: string;
    source: "dataSourceId" | "databaseId";
} {
    const dataSourceId = normalizeNotionIdentifier(parseOptionalTemplate(dataSourceIdValue, runMetadata));
    if (dataSourceId) {
        if (isClearlyInvalidNotionId(dataSourceId)) {
            throw new Error(`Notion ${operation} dataSourceId is invalid (${dataSourceId}). Provide a real Notion data source ID/URL and share it with your integration.`);
        }
        return { id: dataSourceId, source: "dataSourceId" };
    }
    const databaseId = normalizeNotionIdentifier(parseOptionalTemplate(databaseIdValue, runMetadata));
    if (databaseId) {
        if (isClearlyInvalidNotionId(databaseId)) {
            throw new Error(`Notion ${operation} databaseId is invalid (${databaseId}). Provide a real Notion database ID/URL and share it with your integration.`);
        }
        return { id: databaseId, source: "databaseId" };
    }
    throw new Error(`Notion ${operation} operation requires dataSourceId (recommended) or databaseId (legacy). You can paste either an ID or a Notion URL.`);
}
function parseOptionalTemplate(value: string | undefined, runMetadata: Record<string, NodeExecutionOutput>): string | undefined {
    if (!value?.trim()) {
        return undefined;
    }
    const parsed = parseTemplate(value, runMetadata as Record<string, string>).trim();
    return parsed || undefined;
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
function normalizeNotionIdentifier(value: string | undefined): string | undefined {
    if (!value)
        return undefined;
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
    if (uuidMatch?.[0]) {
        return uuidMatch[0].toLowerCase();
    }
    const compactMatches = trimmed.match(/[0-9a-f]{32}/ig);
    if (compactMatches && compactMatches.length > 0) {
        const first = compactMatches[0]!;
        return hyphenateNotionId(first.toLowerCase());
    }
    return undefined;
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
function getNotionHeaders(accessToken: string, version: string = NOTION_VERSION): HeadersInit {
    return {
        Authorization: `Bearer ${accessToken}`,
        "Notion-Version": version,
        "Content-Type": "application/json",
    };
}
async function looksLikeNotionPageIdTarget(targetId: string, accessToken: string): Promise<boolean> {
    const endpoint = `${NOTION_BASE_URL}/pages/${encodeURIComponent(targetId)}`;
    try {
        await validateOutboundUrl(endpoint);
    }
    catch {
        return false;
    }
    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: getNotionHeaders(accessToken),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
async function looksLikeLegacyDatabaseTarget(targetId: string, accessToken: string): Promise<boolean> {
    const endpoint = `${NOTION_BASE_URL}/databases/${encodeURIComponent(targetId)}`;
    try {
        await validateOutboundUrl(endpoint);
    }
    catch {
        return false;
    }
    try {
        const response = await fetch(endpoint, {
            method: "GET",
            headers: getNotionHeaders(accessToken, NOTION_LEGACY_VERSION),
        });
        return response.ok;
    }
    catch {
        return false;
    }
}
async function maybeRewriteTargetNotFoundError(error: unknown, targetId: string, accessToken: string): Promise<unknown> {
    if (!(error instanceof NotionRequestError)) {
        return error;
    }
    if (error.status !== 404 || !error.detail.toLowerCase().includes("object_not_found")) {
        return error;
    }
    const isPageId = await looksLikeNotionPageIdTarget(targetId, accessToken);
    if (!isPageId) {
        return error;
    }
    const hint = "The provided target ID resolves to a page, not a database/data source. " +
        "For create/get_many, open the target database as a full page, copy that URL/ID, and share the database with your integration.";
    return new NotionRequestError(error.operation, error.status, error.detail, hint);
}
async function callNotion(endpoint: string, init: RequestInit, operation: string): Promise<NodeExecutionOutput> {
    try {
        await validateOutboundUrl(endpoint);
    }
    catch (error) {
        if (error instanceof SsrfBlockedError) {
            throw new Error(`Blocked Notion API URL: ${error.message}`);
        }
        throw error;
    }
    const response = await fetch(endpoint, init);
    const bodyText = await response.text();
    const parsedBody = parseResponseBody(bodyText);
    if (!response.ok) {
        const hint = getNotionErrorHint(response.status);
        const detail = typeof parsedBody === "string" ? parsedBody : JSON.stringify(parsedBody);
        throw new NotionRequestError(operation, response.status, detail, hint);
    }
    return parsedBody;
}
function shouldTryLegacyCreateFallback(_idSource: "dataSourceId" | "databaseId", error: unknown): boolean {
    if (!(error instanceof NotionRequestError)) {
        return false;
    }
    if (error.status !== 400) {
        return false;
    }
    const detail = error.detail.toLowerCase();
    return (detail.includes("data_source_id") ||
        detail.includes("data source") ||
        detail.includes("data_source") ||
        detail.includes("parent") ||
        detail.includes("parent type"));
}
function shouldTryLegacyQueryFallback(_idSource: "dataSourceId" | "databaseId", error: unknown): boolean {
    if (!(error instanceof NotionRequestError)) {
        return false;
    }
    if (error.status !== 400 && error.status !== 404) {
        return false;
    }
    const detail = error.detail.toLowerCase();
    return (detail.includes("data_sources") ||
        detail.includes("data source") ||
        detail.includes("data_source") ||
        detail.includes("parent"));
}
async function executeCreate(data: NotionNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const target = parseNotionTargetId(data.dataSourceId, data.databaseId, runMetadata, "create");
    if (!data.propertiesTemplate?.trim()) {
        throw new Error("Notion create operation requires propertiesTemplate.");
    }
    const properties = parseJsonTemplate(data.propertiesTemplate, "propertiesTemplate", runMetadata, "object") as Record<string, unknown>;
    const children = data.childrenTemplate?.trim()
        ? (parseJsonTemplate(data.childrenTemplate, "childrenTemplate", runMetadata, "array") as unknown[])
        : undefined;
    const endpoint = `${NOTION_BASE_URL}/pages`;
    const requestBody: Record<string, unknown> = {
        parent: { data_source_id: target.id },
        properties,
    };
    if (children && children.length > 0) {
        requestBody.children = children;
    }
    let parsedBody: NodeExecutionOutput;
    try {
        parsedBody = await callNotion(endpoint, {
            method: "POST",
            headers: getNotionHeaders(accessToken),
            body: JSON.stringify(requestBody),
        }, "create");
    }
    catch (error) {
        let shouldUseLegacyFallback = shouldTryLegacyCreateFallback(target.source, error);
        if (!shouldUseLegacyFallback) {
            const isLegacyDatabase = await looksLikeLegacyDatabaseTarget(target.id, accessToken);
            shouldUseLegacyFallback = isLegacyDatabase;
        }
        if (!shouldUseLegacyFallback) {
            throw await maybeRewriteTargetNotFoundError(error, target.id, accessToken);
        }
        const legacyRequestBody: Record<string, unknown> = {
            parent: { database_id: target.id },
            properties,
        };
        if (children && children.length > 0) {
            legacyRequestBody.children = children;
        }
        try {
            parsedBody = await callNotion(endpoint, {
                method: "POST",
                headers: getNotionHeaders(accessToken, NOTION_LEGACY_VERSION),
                body: JSON.stringify(legacyRequestBody),
            }, "create_legacy_fallback");
        }
        catch (legacyError) {
            throw await maybeRewriteTargetNotFoundError(legacyError, target.id, accessToken);
        }
    }
    const pageId = typeof parsedBody === "object" && parsedBody !== null && "id" in parsedBody
        ? String((parsedBody as Record<string, unknown>).id)
        : undefined;
    return {
        success: true,
        operation: "create",
        dataSourceId: target.id,
        databaseId: target.id,
        ...(pageId ? { pageId } : {}),
        data: parsedBody,
    };
}
async function executeGet(data: NotionNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const pageId = parseNotionId(data.pageId, "pageId", runMetadata);
    const endpoint = `${NOTION_BASE_URL}/pages/${encodeURIComponent(pageId)}`;
    const parsedBody = await callNotion(endpoint, {
        method: "GET",
        headers: getNotionHeaders(accessToken),
    }, "get");
    return {
        success: true,
        operation: "get",
        pageId,
        data: parsedBody,
    };
}
async function executeGetMany(data: NotionNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const target = parseNotionTargetId(data.dataSourceId, data.databaseId, runMetadata, "get_many");
    const pageSize = Math.min(100, Math.max(1, data.pageSize ?? 25));
    const startCursor = parseOptionalTemplate(data.startCursor, runMetadata);
    const body: Record<string, unknown> = {
        page_size: pageSize,
    };
    if (startCursor) {
        body.start_cursor = startCursor;
    }
    if (data.filterTemplate?.trim()) {
        body.filter = parseJsonTemplate(data.filterTemplate, "filterTemplate", runMetadata, "object");
    }
    if (data.sortsTemplate?.trim()) {
        body.sorts = parseJsonTemplate(data.sortsTemplate, "sortsTemplate", runMetadata, "array");
    }
    const dataSourceEndpoint = `${NOTION_BASE_URL}/data_sources/${encodeURIComponent(target.id)}/query`;
    let parsedBody: NodeExecutionOutput;
    try {
        parsedBody = await callNotion(dataSourceEndpoint, {
            method: "POST",
            headers: getNotionHeaders(accessToken),
            body: JSON.stringify(body),
        }, "get_many");
    }
    catch (error) {
        let shouldUseLegacyFallback = shouldTryLegacyQueryFallback(target.source, error);
        if (!shouldUseLegacyFallback) {
            const isLegacyDatabase = await looksLikeLegacyDatabaseTarget(target.id, accessToken);
            shouldUseLegacyFallback = isLegacyDatabase;
        }
        if (!shouldUseLegacyFallback) {
            throw await maybeRewriteTargetNotFoundError(error, target.id, accessToken);
        }
        const legacyEndpoint = `${NOTION_BASE_URL}/databases/${encodeURIComponent(target.id)}/query`;
        try {
            parsedBody = await callNotion(legacyEndpoint, {
                method: "POST",
                headers: getNotionHeaders(accessToken, NOTION_LEGACY_VERSION),
                body: JSON.stringify(body),
            }, "get_many_legacy_fallback");
        }
        catch (legacyError) {
            throw await maybeRewriteTargetNotFoundError(legacyError, target.id, accessToken);
        }
    }
    const payload = typeof parsedBody === "object" && parsedBody !== null
        ? (parsedBody as Record<string, unknown>)
        : {};
    const nextCursor = typeof payload.next_cursor === "string" && payload.next_cursor.length > 0
        ? payload.next_cursor
        : undefined;
    const hasMore = typeof payload.has_more === "boolean" ? payload.has_more : undefined;
    return {
        success: true,
        operation: "get_many",
        dataSourceId: target.id,
        databaseId: target.id,
        data: parsedBody,
        ...(nextCursor ? { nextCursor } : {}),
        ...(typeof hasMore === "boolean" ? { hasMore } : {}),
    };
}
async function executeUpdate(data: NotionNodeData, runMetadata: Record<string, NodeExecutionOutput>, accessToken: string): Promise<NodeExecutionOutput> {
    const pageId = parseNotionId(data.pageId, "pageId", runMetadata);
    const body: Record<string, unknown> = {};
    if (data.propertiesTemplate?.trim()) {
        body.properties = parseJsonTemplate(data.propertiesTemplate, "propertiesTemplate", runMetadata, "object");
    }
    if (typeof data.archived === "boolean") {
        body.archived = data.archived;
    }
    if (!("properties" in body) && !("archived" in body)) {
        throw new Error("Notion update requires propertiesTemplate or archived.");
    }
    const endpoint = `${NOTION_BASE_URL}/pages/${encodeURIComponent(pageId)}`;
    const parsedBody = await callNotion(endpoint, {
        method: "PATCH",
        headers: getNotionHeaders(accessToken),
        body: JSON.stringify(body),
    }, "update");
    return {
        success: true,
        operation: "update",
        pageId,
        data: parsedBody,
    };
}
export async function executeNotionNode(data: NotionNodeData, runMetadata: Record<string, NodeExecutionOutput>, _executionMode: ExecutionMode = "legacy", ownerUserId: string): Promise<NodeExecutionOutput> {
    if (!data.credentialId?.trim()) {
        throw new Error("Notion node is missing credentialId.");
    }
    const credential = await resolveCredential(data.credentialId, ownerUserId);
    if (credential.platform !== "notion") {
        throw new Error(`Credential platform mismatch: notionNode requires notion credential, got ${credential.platform}`);
    }
    const accessToken = credential.keys.accessToken?.trim();
    if (!accessToken) {
        throw new Error("Notion credential is missing accessToken.");
    }
    const operation = data.operation ?? "create";
    if (operation === "create") {
        return executeCreate(data, runMetadata, accessToken);
    }
    if (operation === "get") {
        return executeGet(data, runMetadata, accessToken);
    }
    if (operation === "get_many") {
        return executeGetMany(data, runMetadata, accessToken);
    }
    if (operation === "update") {
        return executeUpdate(data, runMetadata, accessToken);
    }
    throw new Error(`Unsupported Notion operation: ${operation}`);
}
