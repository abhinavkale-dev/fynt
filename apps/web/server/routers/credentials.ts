import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../trpc";
import { Prisma } from "@repo/prisma";
import { encryptJson } from "@repo/shared/crypto";
function maskKeys(keys: Record<string, unknown>): Record<string, string> {
    const masked: Record<string, string> = {};
    for (const [key, value] of Object.entries(keys)) {
        const str = String(value);
        masked[key] = str.length > 4 ? '•'.repeat(str.length - 4) + str.slice(-4) : '••••';
    }
    return masked;
}
const getAll = protectedProcedure.query(async ({ ctx }) => {
    const credentials = await ctx.prisma.credentials.findMany({
        where: {
            userId: ctx.userId,
        },
        select: {
            id: true,
            title: true,
            platform: true,
            createdAt: true,
            updatedAt: true,
        },
    });
    return credentials;
});
const getById = protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
    const credential = await ctx.prisma.credentials.findFirst({
        where: { id: input.id, userId: ctx.userId },
    });
    if (!credential) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credential not found'
        });
    }
    return {
        id: credential.id,
        title: credential.title,
        platform: credential.platform,
        keys: maskKeys(credential.keys as Record<string, unknown>),
        createdAt: credential.createdAt,
        updatedAt: credential.updatedAt,
    };
});
const create = protectedProcedure
    .input(z.object({
    title: z.string(),
    platform: z.enum([
        "telegram",
        "slack",
        "openai",
        "discord",
        "anthropic",
        "gemini",
        "github",
        "notion",
    ]),
    keys: z.record(z.string(), z.any()),
}))
    .mutation(async ({ ctx, input }) => {
    const encryptedKeys = encryptJson(input.keys);
    try {
        const credential = await ctx.prisma.credentials.create({
            data: {
                title: input.title,
                platform: input.platform,
                keys: encryptedKeys,
                userId: ctx.userId,
            }
        });
        return { id: credential.id, title: credential.title, platform: credential.platform };
    }
    catch (error) {
        if (error instanceof Prisma.PrismaClientKnownRequestError &&
            error.message.includes('invalid input value for enum "Platform"')) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: 'Credential platform enum in database is out of sync. Run "pnpm prisma db push" from project root, then restart web/worker.',
            });
        }
        throw error;
    }
});
const update = protectedProcedure
    .input(z.object({
    id: z.string(),
    title: z.string().optional(),
    keys: z.record(z.string(), z.any()).optional(),
}))
    .mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.credentials.findFirst({
        where: { id: input.id, userId: ctx.userId }
    });
    if (!existing) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credential not found'
        });
    }
    const data: Record<string, unknown> = {};
    if (input.title)
        data.title = input.title;
    if (input.keys)
        data.keys = encryptJson(input.keys);
    const credential = await ctx.prisma.credentials.update({
        where: { id: input.id },
        data,
    });
    return { id: credential.id, title: credential.title, platform: credential.platform };
});
const deleteCredential = protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
    const existing = await ctx.prisma.credentials.findFirst({
        where: { id: input.id, userId: ctx.userId }
    });
    if (!existing) {
        throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Credential not found'
        });
    }
    await ctx.prisma.credentials.delete({
        where: { id: input.id }
    });
    return { success: true };
});
export const credentialsRouter = router({
    getAll,
    getById,
    create,
    update,
    delete: deleteCredential,
});
