import { createAuthClient } from "better-auth/react";
export const { signIn, signUp, signOut, useSession, getSession } = createAuthClient({
    baseURL: process.env.NEXT_PUBLIC_BETTER_AUTH_URL || "http://localhost:3000",
});
