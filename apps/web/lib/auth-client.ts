import "better-auth/types";
import { createAuthClient } from "better-auth/react";

function getBaseURL() {
    if (process.env.NEXT_PUBLIC_BETTER_AUTH_URL) return process.env.NEXT_PUBLIC_BETTER_AUTH_URL;
    if (typeof window !== "undefined") return window.location.origin;
    if (process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.NEXT_PUBLIC_VERCEL_URL) return `https://${process.env.NEXT_PUBLIC_VERCEL_URL}`;
    return "http://localhost:3000";
}

export const { signIn, signUp, signOut, useSession, getSession } = createAuthClient({
    baseURL: getBaseURL(),
});
