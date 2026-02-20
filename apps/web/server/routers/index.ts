import { router } from "../trpc";
import { credentialsRouter } from "./credentials";
import { executionRouter } from "./execution";
import { workflowRouter } from "./workflow";
export const appRouter = router({
    workflow: workflowRouter,
    credentials: credentialsRouter,
    execution: executionRouter,
});
export type AppRouter = typeof appRouter;
