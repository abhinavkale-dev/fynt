export function formatMessageForDelivery(input: string): string {
    let message = input;
    const trimmed = message.trim();
    if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
        try {
            const parsed = JSON.parse(trimmed);
            if (typeof parsed === "string") {
                message = parsed;
            }
        }
        catch {
        }
    }
    message = message
        .replace(/\\r\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\\t/g, "\t")
        .replace(/\r\n?/g, "\n")
        .replace(/\u00a0/g, " ")
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n");
    message = message
        .replace(/\b([Ss]tatus)\s*=\s*(?=(at\b|$|\n))/g, "$1=unknown ")
        .replace(/\b([Ss]tatus)\s*:\s*(?=(at\b|$|\n))/g, "$1: unknown ");
    message = message.replace(/[ \t]+\n/g, "\n");
    return message.trim();
}
