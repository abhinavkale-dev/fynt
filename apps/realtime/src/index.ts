import http from "node:http";
import { resolve } from "node:path";
import type { Duplex } from "node:stream";
import { fileURLToPath } from "node:url";
import { config as loadEnv } from "dotenv";
import { WebSocketServer } from "ws";
import { createRedisSubscriber } from "@repo/shared/redis";
import {
  verifyExecutionStreamToken,
  type ExecutionStreamTokenPayload,
} from "@repo/shared/execution-stream-token";

const realtimeRootDir = fileURLToPath(new URL("..", import.meta.url));
const workspaceRootDir = resolve(realtimeRootDir, "../..");

for (const envPath of [
  resolve(realtimeRootDir, ".env"),
  resolve(realtimeRootDir, ".env.local"),
  resolve(realtimeRootDir, "../web/.env"),
  resolve(realtimeRootDir, "../web/.env.local"),
  resolve(workspaceRootDir, ".env"),
  resolve(workspaceRootDir, ".env.local"),
]) {
  loadEnv({ path: envPath, quiet: true });
}

const host = process.env.REALTIME_HOST?.trim() || "::";
const port = Number.parseInt(
  process.env.REALTIME_PORT || process.env.PORT || "3101",
  10
);
const signingSecrets = Array.from(
  new Set(
    [
      process.env.BETTER_AUTH_SECRET?.trim(),
      process.env.EXECUTION_STREAM_SIGNING_SECRET?.trim(),
    ].filter((value): value is string => Boolean(value && value.length > 0))
  )
);

if (signingSecrets.length === 0) {
  throw new Error(
    "Missing execution stream signing secret. Set BETTER_AUTH_SECRET or EXECUTION_STREAM_SIGNING_SECRET."
  );
}

const IDLE_TIMEOUT_MS = 2 * 60 * 1000;
const PING_INTERVAL_MS = 25_000;

interface RuntimeWebSocket {
  readonly OPEN: number;
  readonly readyState: number;
  send(data: string): void;
  close(code?: number, reason?: string): void;
  terminate(): void;
  ping(data?: Buffer | string): void;
  on(event: string, listener: (...args: unknown[]) => void): void;
}

function verifyExecutionTokenWithAnySecret(token: string): ExecutionStreamTokenPayload {
  let lastError: unknown;
  for (const secret of signingSecrets) {
    try {
      return verifyExecutionStreamToken(token, secret);
    } catch (error) {
      lastError = error;
    }
  }
  throw (lastError instanceof Error ? lastError : new Error("Invalid token."));
}

function sendJson(ws: RuntimeWebSocket, payload: Record<string, unknown>): void {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function closeHttpUpgrade(socket: Duplex, statusCode: number, reason: string): void {
  const statusText =
    statusCode === 401
      ? "Unauthorized"
      : statusCode === 404
        ? "Not Found"
        : "Bad Request";

  socket.write(
    `HTTP/1.1 ${statusCode} ${statusText}\r\n` +
      "Connection: close\r\n" +
      "Content-Type: text/plain\r\n" +
      `Content-Length: ${Buffer.byteLength(reason)}\r\n` +
      "\r\n" +
      reason
  );
  socket.destroy();
}

const server = http.createServer((req, res) => {
  const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
  if (url.pathname === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(JSON.stringify({ ok: true }));
    return;
  }

  res.writeHead(404, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ error: "Not found" }));
});

const wss = new WebSocketServer({ noServer: true });

server.on("upgrade", (req, socket, head) => {
  try {
    const url = new URL(req.url || "/", `http://${req.headers.host || "localhost"}`);
    if (url.pathname !== "/ws/executions") {
      console.warn("[realtime] Rejected websocket upgrade: unknown route", url.pathname);
      closeHttpUpgrade(socket, 404, "Unknown websocket route.");
      return;
    }

    const token = url.searchParams.get("token");
    if (!token) {
      console.warn("[realtime] Rejected websocket upgrade: missing token.");
      closeHttpUpgrade(socket, 401, "Missing token.");
      return;
    }

    let payload: ExecutionStreamTokenPayload;
    try {
      payload = verifyExecutionTokenWithAnySecret(token);
    } catch (error) {
      const reason = error instanceof Error ? error.message : "Invalid token.";
      console.warn("[realtime] Rejected websocket upgrade: invalid token.", reason);
      closeHttpUpgrade(socket, 401, reason);
      return;
    }

    wss.handleUpgrade(req, socket, head, (ws: RuntimeWebSocket) => {
      console.log("[realtime] Accepted websocket connection for run", payload.runId);
      wss.emit("connection", ws, payload);
    });
  } catch {
    console.warn("[realtime] Rejected websocket upgrade: malformed request.");
    closeHttpUpgrade(socket, 400, "Malformed websocket upgrade request.");
  }
});

wss.on("connection", (ws: RuntimeWebSocket, payload: ExecutionStreamTokenPayload) => {
  const channel = `workflow-run:${payload.runId}`;
  const subscriber = createRedisSubscriber();
  let closed = false;
  let pingTimer: ReturnType<typeof setInterval> | null = null;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;
  let tokenExpiryTimer: ReturnType<typeof setTimeout> | null = null;
  let isAlive = true;

  const clearTimers = () => {
    if (pingTimer) clearInterval(pingTimer);
    if (idleTimer) clearTimeout(idleTimer);
    if (tokenExpiryTimer) clearTimeout(tokenExpiryTimer);
    pingTimer = null;
    idleTimer = null;
    tokenExpiryTimer = null;
  };

  const cleanup = () => {
    if (closed) return;
    closed = true;
    clearTimers();
    subscriber.unsubscribe(channel).catch(() => undefined);
    subscriber.quit().catch(() => undefined);
  };

  const refreshIdleTimer = () => {
    if (idleTimer) clearTimeout(idleTimer);
    idleTimer = setTimeout(() => {
      sendJson(ws, { type: "socket", status: "idle_timeout" });
      ws.close(1000, "Idle timeout");
    }, IDLE_TIMEOUT_MS);
  };

  sendJson(ws, { type: "connected", runId: payload.runId });
  refreshIdleTimer();

  subscriber.subscribe(channel).catch((error) => {
    sendJson(ws, {
      type: "socket",
      status: "subscription_error",
      error: error instanceof Error ? error.message : "Unknown subscription error",
    });
    ws.close(1011, "Redis subscription failed");
  });

  subscriber.on("message", (incomingChannel, message) => {
    if (incomingChannel !== channel || ws.readyState !== ws.OPEN) return;
    refreshIdleTimer();
    ws.send(message);
    try {
      const parsed = JSON.parse(message) as Record<string, unknown>;
      const type = typeof parsed.type === "string" ? parsed.type : "";
      const status = typeof parsed.status === "string" ? parsed.status : "";
      if (type === "workflow" && (status === "Success" || status === "Failure")) {
        setTimeout(() => {
          if (ws.readyState === ws.OPEN) ws.close(1000, "Run finished");
        }, 500);
      }
    } catch {
    }
  });

  pingTimer = setInterval(() => {
    if (ws.readyState !== ws.OPEN) return;
    if (!isAlive) {
      ws.terminate();
      return;
    }
    isAlive = false;
    ws.ping();
  }, PING_INTERVAL_MS);

  const tokenExpiresInMs = Math.max(1_000, payload.exp * 1_000 - Date.now());
  tokenExpiryTimer = setTimeout(() => {
    sendJson(ws, { type: "socket", status: "token_expired" });
    ws.close(4001, "Token expired");
  }, tokenExpiresInMs);

  ws.on("pong", () => {
    isAlive = true;
    refreshIdleTimer();
  });

  ws.on("message", () => {
    refreshIdleTimer();
  });

  ws.on("close", cleanup);
  ws.on("error", cleanup);
});

server.listen({ port, host, ipv6Only: false }, () => {
  console.log(`[realtime] Listening on ws://${host}:${port}/ws/executions`);
});
