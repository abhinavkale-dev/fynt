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
function normalizeWsBaseUrl(baseUrl: string): string {
    return baseUrl.replace(/\/$/, "");
}
function defaultWsBaseUrl(): string {
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    return `${protocol}//${window.location.host}`;
}
async function fetchSocketUrl(runId: string): Promise<string> {
    const response = await fetch(`/api/executions/${encodeURIComponent(runId)}/ws-token`, {
        method: "GET",
        cache: "no-store",
        credentials: "include",
    });
    if (!response.ok) {
        const detail = await response.text().catch(() => "Failed to fetch websocket token.");
        throw new Error(detail || "Failed to fetch websocket token.");
    }
    const payload = (await response.json()) as {
        token?: string;
        wsUrl?: string;
    };
    if (!payload.token || payload.token.trim().length === 0) {
        throw new Error("Execution websocket token response is missing token.");
    }
    const configured = payload.wsUrl?.trim() || process.env.NEXT_PUBLIC_EXECUTION_WS_URL || defaultWsBaseUrl();
    const base = normalizeWsBaseUrl(configured);
    return `${base}/ws/executions?token=${encodeURIComponent(payload.token)}`;
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
    constructor(runId: string) {
        this.runId = runId;
    }
    subscribe(subscriber: ExecutionSocketSubscriber): () => void {
        this.subscribers.add(subscriber);
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
        if (this.socket) {
            this.socket.close();
            this.socket = null;
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
            const socketUrl = await fetchSocketUrl(this.runId);
            if (this.manualClose || this.subscribers.size === 0)
                return;
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
