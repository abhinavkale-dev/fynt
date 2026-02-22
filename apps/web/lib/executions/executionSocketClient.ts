"use client";
export type ExecutionSocketEvent = {
    type: "connected";
    runId: string;
} | {
    type: "node";
    nodeId: string;
    status: string;
    nodeType?: string;
    output?: unknown;
    error?: string;
    timestamp?: number;
} | {
    type: "workflow";
    status: string;
    error?: string;
    timestamp?: number;
} | {
    type: "socket";
    status: "connected" | "disconnected" | "reconnecting";
    attempt?: number;
    delayMs?: number;
    code?: number;
    reason?: string;
};
export type ExecutionSocketSubscriber = (event: ExecutionSocketEvent) => void;
const RECONNECT_BASE_MS = 750;
const RECONNECT_MAX_MS = 8000;
const EXECUTION_SOCKET_PATH = "/ws/executions";
const WS_TOKEN_MAX_ATTEMPTS = 3;
const DEFAULT_REALTIME_PORT = "3101";
const TOKEN_REFRESH_BUFFER_SECONDS = 15;
const TOKEN_DEFAULT_TTL_SECONDS = 300;

interface ExecutionSocketAuthBootstrap {
    token: string;
    wsUrl?: string;
    expiresInSeconds?: number;
}
interface PrimedExecutionSocketAuth {
    token: string;
    wsUrl?: string;
    expiresAtMs: number;
}
const PRIMED_SOCKET_AUTH = new Map<string, PrimedExecutionSocketAuth>();

interface ExecutionSocketUrlPayload {
    socketUrls: string[];
    expiresAtMs: number;
}
function delay(ms: number): Promise<void> {
    return new Promise((resolve) => {
        window.setTimeout(resolve, ms);
    });
}
function normalizeWsProtocol(protocol: string): "ws:" | "wss:" {
    if (protocol === "ws:" || protocol === "wss:") {
        return protocol;
    }
    if (protocol === "http:") {
        return "ws:";
    }
    if (protocol === "https:") {
        return "wss:";
    }
    throw new Error(`Unsupported websocket protocol: ${protocol}`);
}
function defaultWsBaseUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
}
function defaultRealtimeWsBaseUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const realtimePort = process.env.NEXT_PUBLIC_REALTIME_PORT?.trim() || DEFAULT_REALTIME_PORT;
    return `${protocol}//${window.location.hostname}:${realtimePort}`;
}
function parseSocketBaseUrl(input: string): URL {
    const trimmed = input.trim();
    if (!trimmed) {
        throw new Error("Socket base URL is empty.");
    }
    try {
        return new URL(trimmed);
    }
    catch {
        if (trimmed.startsWith("/")) {
            return new URL(trimmed, window.location.origin);
        }
        const protocol = window.location.protocol === "https:" ? "wss" : "ws";
        return new URL(`${protocol}://${trimmed.replace(/^\/+/, "")}`);
    }
}
function buildExecutionSocketUrl(baseUrl: string, token: string): string {
    const url = parseSocketBaseUrl(baseUrl);
    url.protocol = normalizeWsProtocol(url.protocol);
    const normalizedPath = url.pathname.replace(/\/+$/, "");
    if (!normalizedPath) {
        url.pathname = EXECUTION_SOCKET_PATH;
    }
    else if (!normalizedPath.endsWith(EXECUTION_SOCKET_PATH)) {
        url.pathname = `${normalizedPath}${EXECUTION_SOCKET_PATH}`;
    }
    else {
        url.pathname = normalizedPath;
    }
    url.search = "";
    url.searchParams.set("token", token);
    return url.toString();
}
function expandSocketBaseCandidate(candidate: string): string[] {
    const expanded = [candidate];
    try {
        const parsed = parseSocketBaseUrl(candidate);
        const hostname = parsed.hostname.toLowerCase();
        if (hostname === "localhost" || hostname === "::1") {
            const ipv4Variant = new URL(parsed.toString());
            ipv4Variant.hostname = "127.0.0.1";
            expanded.push(ipv4Variant.toString());
        }
        else if (hostname === "127.0.0.1") {
            const localhostVariant = new URL(parsed.toString());
            localhostVariant.hostname = "localhost";
            expanded.push(localhostVariant.toString());
        }
    }
    catch {
        return expanded;
    }
    return expanded;
}
function resolveSocketBaseCandidates(wsUrlFromServer: string | undefined): string[] {
    const rawCandidates = [
        wsUrlFromServer?.trim(),
        process.env.NEXT_PUBLIC_EXECUTION_WS_URL?.trim(),
        defaultRealtimeWsBaseUrl(),
        defaultWsBaseUrl(),
    ];
    const unique = new Set<string>();
    for (const candidate of rawCandidates) {
        if (!candidate) {
            continue;
        }
        const expandedCandidates = expandSocketBaseCandidate(candidate);
        for (const expandedCandidate of expandedCandidates) {
            if (unique.has(expandedCandidate)) {
                continue;
            }
            unique.add(expandedCandidate);
        }
    }
    return Array.from(unique);
}
function resolveSocketUrlPayloadFromToken(token: string, wsUrlFromServer: string | undefined, expiresInSeconds: number): ExecutionSocketUrlPayload {
    const safeTtlSeconds = Math.max(1, Math.floor(expiresInSeconds));
    const baseCandidates = resolveSocketBaseCandidates(wsUrlFromServer);
    const socketUrls: string[] = [];
    let lastBuildError: Error | null = null;
    for (const candidate of baseCandidates) {
        try {
            const builtUrl = buildExecutionSocketUrl(candidate, token);
            if (!socketUrls.includes(builtUrl)) {
                socketUrls.push(builtUrl);
            }
        }
        catch (error) {
            lastBuildError = error instanceof Error ? error : new Error("Failed to build websocket URL.");
        }
    }
    if (socketUrls.length === 0) {
        throw new Error(lastBuildError?.message || "Unable to resolve a valid websocket URL.");
    }
    return {
        socketUrls,
        expiresAtMs: Date.now() + safeTtlSeconds * 1000,
    };
}
function getPrimedSocketAuthPayload(runId: string): ExecutionSocketUrlPayload | null {
    const primed = PRIMED_SOCKET_AUTH.get(runId);
    if (!primed) {
        return null;
    }
    if (Date.now() >= primed.expiresAtMs) {
        PRIMED_SOCKET_AUTH.delete(runId);
        return null;
    }
    try {
        return resolveSocketUrlPayloadFromToken(primed.token, primed.wsUrl, Math.max(1, Math.floor((primed.expiresAtMs - Date.now()) / 1000)));
    }
    catch {
        PRIMED_SOCKET_AUTH.delete(runId);
        return null;
    }
}
export function primeExecutionSocketAuth(runId: string, bootstrap: ExecutionSocketAuthBootstrap): void {
    const normalizedRunId = runId.trim();
    if (!normalizedRunId) {
        return;
    }
    const token = bootstrap.token?.trim();
    if (!token) {
        return;
    }
    const configuredExpiresInSeconds = typeof bootstrap.expiresInSeconds === "number" && Number.isFinite(bootstrap.expiresInSeconds)
        ? Math.max(1, Math.floor(bootstrap.expiresInSeconds))
        : TOKEN_DEFAULT_TTL_SECONDS;
    const safeTtlSeconds = Math.max(1, configuredExpiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS);
    PRIMED_SOCKET_AUTH.set(normalizedRunId, {
        token,
        wsUrl: bootstrap.wsUrl?.trim() || undefined,
        expiresAtMs: Date.now() + safeTtlSeconds * 1000,
    });
}
function shouldRetryTokenFetch(statusCode: number): boolean {
    return statusCode === 429 || statusCode >= 500;
}
async function fetchSocketUrl(runId: string): Promise<ExecutionSocketUrlPayload> {
    let response: Response | null = null;
    let failureDetail = "Failed to fetch websocket token.";
    for (let attempt = 1; attempt <= WS_TOKEN_MAX_ATTEMPTS; attempt += 1) {
        response = await fetch(`/api/executions/${encodeURIComponent(runId)}/ws-token`, {
            method: "GET",
            cache: "no-store",
            credentials: "include",
        });
        if (response.ok) {
            break;
        }
        failureDetail = await response.text().catch(() => "Failed to fetch websocket token.");
        if (!shouldRetryTokenFetch(response.status) || attempt >= WS_TOKEN_MAX_ATTEMPTS) {
            throw new Error(failureDetail || `Failed to fetch websocket token (${response.status}).`);
        }
        await delay(150 * attempt);
    }
    if (!response || !response.ok) {
        throw new Error(failureDetail);
    }
    const payload = (await response.json()) as {
        token?: string;
        wsUrl?: string;
        expiresInSeconds?: number;
    };
    if (!payload.token || payload.token.trim().length === 0) {
        throw new Error("Execution websocket token response is missing token.");
    }
    const expiresInSeconds = typeof payload.expiresInSeconds === "number" && Number.isFinite(payload.expiresInSeconds)
        ? Math.max(1, Math.floor(payload.expiresInSeconds))
        : TOKEN_DEFAULT_TTL_SECONDS;
    const safeTtlSeconds = Math.max(1, expiresInSeconds - TOKEN_REFRESH_BUFFER_SECONDS);
    return resolveSocketUrlPayloadFromToken(payload.token, payload.wsUrl, safeTtlSeconds);
}
class RunSocketConnection {
    private readonly runId: string;
    private readonly subscribers = new Set<ExecutionSocketSubscriber>();
    private socket: WebSocket | null = null;
    private reconnectTimer: number | null = null;
    private reconnectAttempt = 0;
    private connecting = false;
    private manualClose = false;
    private terminal = false;
    private cachedSocketUrls: string[] = [];
    private cachedSocketUrlIndex = 0;
    private cachedSocketUrlExpiresAtMs = 0;
    constructor(runId: string) {
        this.runId = runId;
    }
    subscribe(subscriber: ExecutionSocketSubscriber): () => void {
        this.subscribers.add(subscriber);
        if (this.socket && this.socket.readyState === WebSocket.OPEN) {
            subscriber({ type: "socket", status: "connected" });
        }
        if (!this.manualClose) {
            this.ensureConnected();
        }
        return () => this.unsubscribe(subscriber);
    }
    isIdle(): boolean {
        return this.subscribers.size === 0 && this.socket === null && this.reconnectTimer === null;
    }
    dispose(): void {
        this.manualClose = true;
        this.terminal = false;
        this.clearReconnectTimer();
        this.cachedSocketUrls = [];
        this.cachedSocketUrlIndex = 0;
        this.cachedSocketUrlExpiresAtMs = 0;
        if (this.socket) {
            const socket = this.socket;
            this.socket = null;
            // Avoid closing while still CONNECTING; browsers frequently surface this as
            // "WebSocket is closed before the connection is established."
            if (socket.readyState === WebSocket.CONNECTING) {
                socket.onopen = () => {
                    try {
                        socket.close();
                    }
                    catch {
                        void 0;
                    }
                };
                socket.onmessage = null;
                socket.onerror = null;
                socket.onclose = null;
                return;
            }
            socket.close();
        }
    }
    private unsubscribe(subscriber: ExecutionSocketSubscriber): void {
        this.subscribers.delete(subscriber);
        if (this.subscribers.size > 0)
            return;
        this.dispose();
    }
    private emit(event: ExecutionSocketEvent): void {
        for (const subscriber of this.subscribers) {
            subscriber(event);
        }
    }
    private clearReconnectTimer(): void {
        if (this.reconnectTimer !== null) {
            window.clearTimeout(this.reconnectTimer);
            this.reconnectTimer = null;
        }
    }
    private scheduleReconnect(): void {
        if (this.manualClose || this.terminal || this.subscribers.size === 0)
            return;
        if (this.reconnectTimer !== null)
            return;
        const attempt = this.reconnectAttempt + 1;
        const baseDelay = Math.min(RECONNECT_MAX_MS, RECONNECT_BASE_MS * 2 ** (attempt - 1));
        const jitter = Math.floor(Math.random() * 300);
        const delayMs = baseDelay + jitter;
        this.reconnectAttempt = attempt;
        this.emit({ type: "socket", status: "reconnecting", attempt, delayMs });
        this.reconnectTimer = window.setTimeout(() => {
            this.reconnectTimer = null;
            void this.ensureConnected();
        }, delayMs);
    }
    private async ensureConnected(): Promise<void> {
        if (this.connecting || this.socket || this.manualClose || this.subscribers.size === 0) {
            return;
        }
        this.connecting = true;
        try {
            let socketUrl = this.cachedSocketUrls[this.cachedSocketUrlIndex] ?? null;
            if (!socketUrl || Date.now() >= this.cachedSocketUrlExpiresAtMs) {
                const payload = getPrimedSocketAuthPayload(this.runId) ?? await fetchSocketUrl(this.runId);
                this.cachedSocketUrls = payload.socketUrls;
                this.cachedSocketUrlIndex = 0;
                socketUrl = this.cachedSocketUrls[0] ?? null;
                this.cachedSocketUrlExpiresAtMs = payload.expiresAtMs;
            }
            if (!socketUrl) {
                throw new Error("No websocket endpoint candidates are available.");
            }
            if (this.manualClose || this.subscribers.size === 0)
                return;
            const attemptedSocketUrlIndex = this.cachedSocketUrlIndex;
            const ws = new WebSocket(socketUrl);
            this.socket = ws;
            ws.onopen = () => {
                this.reconnectAttempt = 0;
                this.emit({ type: "socket", status: "connected" });
            };
            ws.onmessage = (event) => {
                try {
                    const parsed = JSON.parse(String(event.data)) as ExecutionSocketEvent;
                    this.emit(parsed);
                    if (parsed.type === "workflow" &&
                        (parsed.status === "Success" || parsed.status === "Failure")) {
                        this.terminal = true;
                    }
                }
                catch {
                    return;
                }
            };
            ws.onclose = (event) => {
                this.socket = null;
                if (event.code === 1008 || event.code === 4001) {
                    this.cachedSocketUrls = [];
                    this.cachedSocketUrlIndex = 0;
                    this.cachedSocketUrlExpiresAtMs = 0;
                }
                else if (!this.manualClose && this.cachedSocketUrls.length > 1) {
                    this.cachedSocketUrlIndex = (attemptedSocketUrlIndex + 1) % this.cachedSocketUrls.length;
                }
                this.emit({
                    type: "socket",
                    status: "disconnected",
                    code: event.code,
                    reason: event.reason || undefined,
                });
                if (!this.manualClose) {
                    this.scheduleReconnect();
                }
            };
            ws.onerror = () => {
            };
        }
        catch (error) {
            this.emit({
                type: "socket",
                status: "disconnected",
                reason: error instanceof Error ? error.message : "Socket setup failed",
            });
            this.scheduleReconnect();
        }
        finally {
            this.connecting = false;
        }
    }
}
const CONNECTIONS = new Map<string, RunSocketConnection>();
export function subscribeToExecutionRun(runId: string, subscriber: ExecutionSocketSubscriber): () => void {
    const normalizedRunId = runId.trim();
    if (!normalizedRunId) {
        throw new Error("runId is required for execution socket subscription.");
    }
    let connection = CONNECTIONS.get(normalizedRunId);
    if (!connection) {
        connection = new RunSocketConnection(normalizedRunId);
        CONNECTIONS.set(normalizedRunId, connection);
    }
    const unsubscribe = connection.subscribe(subscriber);
    return () => {
        unsubscribe();
        if (connection && connection.isIdle()) {
            CONNECTIONS.delete(normalizedRunId);
        }
    };
}
