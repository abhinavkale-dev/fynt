import { initTRPC, TRPCError } from '@trpc/server';
import { FetchCreateContextFnOptions } from '@trpc/server/adapters/fetch';
import { auth } from '@/lib/auth';
import prisma from '@/lib/prisma';
import superjson from 'superjson';
export type Context = {
    session: Awaited<ReturnType<typeof auth.api.getSession>> | null;
    prisma: typeof prisma;
    userId: string | null;
};
export const createContext = async (opts: FetchCreateContextFnOptions) => {
    try {
        const session = await auth.api.getSession({
            headers: opts.req.headers,
        });
        return {
            session,
            prisma,
            userId: session?.user?.id ?? null,
        };
    }
    catch (error) {
        console.error('[tRPC Context] Error creating context:', error);
        return {
            session: null,
            prisma,
            userId: null,
        };
    }
};
const t = initTRPC.context<Context>().create({
    transformer: superjson,
    errorFormatter: ({ shape }) => shape
});
const isAuthenticated = t.middleware(async ({ ctx, next }) => {
    if (!ctx.userId) {
        throw new TRPCError({ code: 'UNAUTHORIZED' });
    }
    return next();
});
export const router = t.router;
export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthenticated);
