import { fetchRequestHandler } from '@trpc/server/adapters/fetch';
import { appRouter } from '@/server/routers/index';
import { createContext } from '@/server/trpc';
const handler = (req: Request) => {
    return fetchRequestHandler({
        endpoint: '/api/trpc',
        req,
        router: appRouter,
        createContext,
        onError({ error, path, type }) {
            console.error('[tRPC] Request failed', {
                path: path ?? 'unknown',
                type,
                code: error.code,
                message: error.message,
            });
        },
    });
};
export { handler as GET, handler as POST };
