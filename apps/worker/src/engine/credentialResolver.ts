import { prisma } from "@repo/prisma";
import { decryptJson } from "@repo/shared/crypto";
export interface ResolvedCredential {
    platform: string;
    keys: Record<string, string>;
}
export async function resolveCredential(credentialId: string, ownerUserId: string): Promise<ResolvedCredential> {
    const credential = await prisma.credentials.findFirst({
        where: {
            id: credentialId,
            userId: ownerUserId,
        },
        select: {
            platform: true,
            keys: true,
        },
    });
    if (!credential) {
        throw new Error(`Credential ${credentialId} not found or access denied`);
    }
    return {
        platform: credential.platform,
        keys: decryptJson<Record<string, string>>(credential.keys as string),
    };
}
