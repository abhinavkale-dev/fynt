import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/lib/auth';
import { getSessionWithRetry } from '@/lib/auth-session';
import prisma from '@/lib/prisma';
import superjson from 'superjson';
export type Context = {
    session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
    prisma: typeof prisma;
    userId: string | null;
    authUnavailable: boolean;
};
export const createContext = async (opts: FetchCreateContextFnOptions) => {
    try {
        const session = await getSessionWithRetry(opts.req.headers, {
            logPrefix: '[tRPC Context]',
        });
        return {
            session,
            prisma,
            userId: session?.user?.id ?? null,
            authUnavailable: false,
        };
    }
    catch (error) {
        console.error('[tRPC Context] Error creating context:', error);
        return {
            session: null,
            prisma,
            userId: null,
            authUnavailable: true,
        };
    }
};
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter: ({ shape }) => shape
});
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.userId) {
        if (ctx.authUnavailable) {
            throw new TRPCError({
                code: 'INTERNAL_SERVER_ERROR',
                message: 'Authentication service unavailable. Please retry.',
            });
        }
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
