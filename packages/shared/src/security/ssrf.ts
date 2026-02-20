import { promises as dns } from "node:dns";
import { isIP } from "node:net";
const BLOCKED_HOSTNAMES = new Set([
    "localhost",
    "metadata.google.internal",
]);
const BLOCKED_HOSTNAME_SUFFIXES = [".internal"];
export class SsrfBlockedError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SsrfBlockedError";
    }
}
function isBlockedHostname(hostname: string): boolean {
    const normalized = hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(normalized)) {
        return true;
    }
    return BLOCKED_HOSTNAME_SUFFIXES.some((suffix) => normalized.endsWith(suffix));
}
function isPrivateIpv4(ip: string): boolean {
    const parts = ip.split(".").map((part) => Number.parseInt(part, 10));
    if (parts.length !== 4 || parts.some((part) => !Number.isInteger(part) || part < 0 || part > 255)) {
        return false;
    }
    const a = parts[0] ?? -1;
    const b = parts[1] ?? -1;
    if (a === 10)
        return true;
    if (a === 127)
        return true;
    if (a === 0)
        return true;
    if (a === 169 && b === 254)
        return true;
    if (a === 192 && b === 168)
        return true;
    if (a === 172 && b >= 16 && b <= 31)
        return true;
    return false;
}
function isPrivateIpv6(ip: string): boolean {
    const normalized = ip.toLowerCase();
    if (normalized === "::1" || normalized === "::") {
        return true;
    }
    if (normalized.startsWith("fe8") || normalized.startsWith("fe9") || normalized.startsWith("fea") || normalized.startsWith("feb")) {
        return true;
    }
    if (normalized.startsWith("fc") || normalized.startsWith("fd")) {
        return true;
    }
    return false;
}
function isPrivateIp(ip: string): boolean {
    const version = isIP(ip);
    if (version === 4) {
        return isPrivateIpv4(ip);
    }
    if (version === 6) {
        return isPrivateIpv6(ip);
    }
    return false;
}
export async function validateOutboundUrl(url: string): Promise<void> {
    let parsed: URL;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new SsrfBlockedError("Invalid URL");
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new SsrfBlockedError(`Blocked outbound protocol: ${parsed.protocol}`);
    }
    const hostname = parsed.hostname.toLowerCase();
    if (!hostname) {
        throw new SsrfBlockedError("Missing hostname");
    }
    if (isBlockedHostname(hostname)) {
        throw new SsrfBlockedError(`Blocked outbound hostname: ${hostname}`);
    }
    if (isPrivateIp(hostname)) {
        throw new SsrfBlockedError(`Blocked outbound private IP: ${hostname}`);
    }
    let resolved: Array<{
        address: string;
    }> = [];
    try {
        resolved = await dns.lookup(hostname, { all: true, verbatim: true });
    }
    catch {
        throw new SsrfBlockedError(`Unable to resolve hostname: ${hostname}`);
    }
    for (const entry of resolved) {
        if (isPrivateIp(entry.address)) {
            throw new SsrfBlockedError(`Blocked outbound private address resolution: ${hostname} -> ${entry.address}`);
        }
    }
}
