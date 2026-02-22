import type { HTTPNodeData, NodeExecutionOutput } from "../../engine/types/index.js";
import { parseTemplate } from "@repo/shared/parser";
import { SsrfBlockedError, validateOutboundUrl } from "@repo/shared/ssrf";
import type { ExecutionMode } from "../../engine/executor.js";
const MAX_TEXT_RESPONSE_CHARS = 100_000;
const TEXT_TRUNCATION_SUFFIX = "\n...[response truncated by Fynt]";
function isLikelyTextResponse(contentType: string | null): boolean {
    if (!contentType) {
        return true;
    }
    const normalized = contentType.toLowerCase().split(";")[0]?.trim() ?? "";
    if (normalized.startsWith("text/")) {
        return true;
    }
    return normalized === "application/xml" ||
        normalized === "application/xhtml+xml" ||
        normalized === "application/javascript";
}
function truncateText(value: string, maxChars: number, suffix: string): {
    text: string;
    truncated: boolean;
    originalLength: number;
} {
    const originalLength = value.length;
    if (originalLength <= maxChars) {
        return {
            text: value,
            truncated: false,
            originalLength,
        };
    }
    const suffixLength = suffix.length;
    const available = Math.max(0, maxChars - suffixLength);
    return {
        text: value.slice(0, available) + suffix,
        truncated: true,
        originalLength,
    };
}
function getHttpErrorHint(status: number, method: string): string {
    switch (status) {
        case 400: return 'Check the request body format and required fields';
        case 401: return 'Check authentication — the endpoint may require an API key or token in headers';
        case 403: return 'Access denied — verify your API key permissions or token scope';
        case 404: return 'Verify the URL path is correct';
        case 405: return `This endpoint does not accept ${method} requests — try a different HTTP method`;
        case 408: return 'The server timed out — try increasing the timeout value';
        case 413: return 'Request body is too large — reduce the payload size';
        case 429: return 'Rate limited — wait and retry, or reduce request frequency';
        case 500: return 'The remote server encountered an internal error';
        case 502: return 'Bad gateway — the remote server\'s upstream is unavailable';
        case 503: return 'The remote service is temporarily unavailable — retry later';
        default:
            if (status >= 400 && status < 500)
                return 'Client error — check your request configuration';
            if (status >= 500)
                return 'Server error — the remote service may be experiencing issues';
            return '';
    }
}
export async function executeHTTPNode(data: HTTPNodeData & {
    timeout?: number;
    headers?: Array<{
        key: string;
        value: string;
    }> | Record<string, string>;
}, _nodeRunId: string, runMetadata: Record<string, NodeExecutionOutput>, executionMode: ExecutionMode = 'legacy'): Promise<NodeExecutionOutput> {
    const { url, method, headers, body, timeout } = data;
    if (!url) {
        if (executionMode === 'strict_template_v1') {
            throw new Error('HTTP node not configured - URL is missing');
        }
        return {
            success: true,
            skipped: true,
            reason: 'HTTP node is not configured - URL is missing',
        };
    }
    const resolvedMethod = method ?? 'GET';
    const parsedUrl = parseTemplate(url, runMetadata as Record<string, string>);
    await validateOutboundUrl(parsedUrl);
    let headersObj: Record<string, string> = {};
    if (Array.isArray(headers)) {
        headers.forEach((h) => {
            if (h.key && h.value) {
                headersObj[h.key] = parseTemplate(h.value, runMetadata as Record<string, string>);
            }
        });
    }
    else if (headers) {
        headersObj = headers;
    }
    let parsedBody;
    if (body && typeof body === 'string') {
        parsedBody = parseTemplate(body, runMetadata as Record<string, string>);
    }
    else {
        parsedBody = body;
    }
    const requestOptions: RequestInit = {
        method: resolvedMethod,
        headers: headersObj,
    };
    const controller = new AbortController();
    const timeoutId = timeout ? setTimeout(() => controller.abort(), timeout) : null;
    requestOptions.signal = controller.signal;
    if (resolvedMethod !== 'GET' && parsedBody !== undefined) {
        requestOptions.body = JSON.stringify(parsedBody);
    }
    try {
        const response = await fetch(parsedUrl, requestOptions);
        if (timeoutId)
            clearTimeout(timeoutId);
        if (!response.ok) {
            const hint = getHttpErrorHint(response.status, resolvedMethod);
            const message = `HTTP request failed: ${response.status} ${response.statusText}`;
            throw new Error(hint ? `${message}\nHint: ${hint}` : message);
        }
        const responseHeaders = Object.fromEntries(response.headers.entries());
        const responseMeta = {
            httpStatusCode: response.status,
            httpStatusText: response.statusText,
            httpHeaders: responseHeaders,
            statusCode: response.status,
            status: response.status,
            statusText: response.statusText,
            headers: responseHeaders,
        };
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
            const jsonPayload = await response.json();
            if (jsonPayload && typeof jsonPayload === 'object' && !Array.isArray(jsonPayload)) {
                const objectPayload = jsonPayload as Record<string, unknown>;
                return {
                    ...objectPayload,
                    ...(!('data' in objectPayload) ? { data: jsonPayload } : {}),
                    ...(!('body' in objectPayload) ? { body: jsonPayload } : {}),
                    httpStatusCode: responseMeta.httpStatusCode,
                    httpStatusText: responseMeta.httpStatusText,
                    httpHeaders: responseMeta.httpHeaders,
                    ...(!('statusCode' in objectPayload) ? { statusCode: responseMeta.statusCode } : {}),
                    ...(!('status' in objectPayload) ? { status: responseMeta.status } : {}),
                    ...(!('statusText' in objectPayload) ? { statusText: responseMeta.statusText } : {}),
                    ...(!('headers' in objectPayload) ? { headers: responseMeta.headers } : {}),
                };
            }
            return {
                ...responseMeta,
                body: jsonPayload,
                data: jsonPayload,
            };
        }
        else {
            const text = await response.text();
            const shouldTruncate = isLikelyTextResponse(contentType);
            const truncatedText = shouldTruncate
                ? truncateText(text, MAX_TEXT_RESPONSE_CHARS, TEXT_TRUNCATION_SUFFIX)
                : {
                    text,
                    truncated: false,
                    originalLength: text.length,
                };
            return {
                ...responseMeta,
                body: truncatedText.text,
                data: truncatedText.text,
                ...(truncatedText.truncated
                    ? {
                        _truncated: true,
                        _originalLength: truncatedText.originalLength,
                        _truncatedLength: truncatedText.text.length,
                        _truncationReason: "text_response_char_limit_exceeded",
                    }
                    : {}),
            };
        }
    }
    catch (error) {
        if (timeoutId)
            clearTimeout(timeoutId);
        if (error instanceof SsrfBlockedError) {
            throw new Error(`Blocked outbound HTTP target: ${error.message}`);
        }
        if (error instanceof Error && error.name === 'AbortError') {
            throw new Error(`HTTP request timed out after ${timeout}ms\nHint: Try increasing the timeout value or check if the server is responding`);
        }
        if (error instanceof TypeError && error.message.includes('fetch')) {
            throw new Error(`Could not reach ${parsedUrl}\nHint: Check the URL spelling and ensure the server is accessible`);
        }
        throw error;
    }
}
