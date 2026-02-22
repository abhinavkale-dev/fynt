import { prisma } from "@repo/prisma";
import { decryptJson } from "@repo/shared/crypto";
export interface ResolvedCredential {
    platform: string;
    keys: Record<string, string>;
}
export type CredentialPlatform = 'openai' | 'anthropic' | 'gemini' | 'slack' | 'discord' | 'github' | 'notion';
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
export async function resolveSingleCredentialByPlatform(platform: CredentialPlatform, ownerUserId: string): Promise<ResolvedCredential | null> {
    const credentials = await prisma.credentials.findMany({
        where: {
            platform,
            userId: ownerUserId,
        },
        select: {
            platform: true,
            keys: true,
        },
        orderBy: {
            updatedAt: 'desc',
        },
        take: 2,
    });
    if (credentials.length !== 1) {
        return null;
    }
    const credential = credentials[0]!;
    return {
        platform: credential.platform,
        keys: decryptJson<Record<string, string>>(credential.keys as string),
    };
}
