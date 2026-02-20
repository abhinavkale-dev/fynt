import { betterAuth } from "better-auth";
import { prismaAdapter } from "better-auth/adapters/prisma";
import prisma from "@/lib/prisma";
import { isWebOnlyRuntimeMode } from "@repo/shared/automation-flags";
if (!process.env.BETTER_AUTH_SECRET) {
    throw new Error("BETTER_AUTH_SECRET environment variable is required");
}

function getServerBaseURL() {
    if (process.env.BETTER_AUTH_URL) return process.env.BETTER_AUTH_URL;
    if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
    if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
    return "http://localhost:3000";
}

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const isProduction = process.env.NODE_ENV === "production";
const hasRedisConfig = Boolean(process.env.REDIS_URL?.trim() || process.env.UPSTASH_REDIS_URL?.trim() || process.env.REDIS_HOST?.trim());
const useRedisSecondaryStorage = !isWebOnlyRuntimeMode() && hasRedisConfig;

const socialProviders: {
    google?: {
        clientId: string;
        clientSecret: string;
        prompt?: "select_account" | "consent" | "login" | "none" | "select_account consent";
    };
} = {};

if (googleClientId && googleClientSecret) {
    socialProviders.google = {
        clientId: googleClientId,
        clientSecret: googleClientSecret,
        prompt: "select_account",
    };
}
export const auth = betterAuth({
    database: prismaAdapter(prisma, {
        provider: "postgresql",
    }),
    emailAndPassword: {
        enabled: true,
        minPasswordLength: 8,
        maxPasswordLength: 128,
        sendResetPassword: async ({ user }) => {
            if (process.env.NODE_ENV !== "production") {
                console.info(`Password reset requested for ${user.email}`);
            }
        },
    },
    emailVerification: {
        sendVerificationEmail: async ({ user }) => {
            if (process.env.NODE_ENV !== "production") {
                console.info(`Email verification requested for ${user.email}`);
            }
        },
        sendOnSignUp: true,
        autoSignInAfterVerification: true,
    },
    session: {
        expiresIn: 60 * 60 * 24 * 7,
        updateAge: 60 * 60 * 24,
        cookieCache: {
            enabled: false,
        },
    },
    user: {
        changeEmail: {
            enabled: true,
            sendChangeEmailVerification: async ({ user, newEmail }) => {
                if (process.env.NODE_ENV !== "production") {
                    console.info(`Email change verification requested for ${user.email} -> ${newEmail}`);
                }
            },
        },
        deleteUser: {
            enabled: true,
        },
    },
    rateLimit: {
        enabled: true,
        window: 60,
        max: 100,
        storage: useRedisSecondaryStorage ? "secondary-storage" : "memory",
    },
    secondaryStorage: useRedisSecondaryStorage
        ? {
            get: async (key: string) => {
                const { redis, withRedisFallback } = await import("@repo/shared/redis");
                return withRedisFallback("auth:secondary-storage:get", async () => redis.get(key), async () => null);
            },
            set: async (key: string, value: string, ttl?: number) => {
                const { redis, withRedisFallback } = await import("@repo/shared/redis");
                await withRedisFallback("auth:secondary-storage:set", async () => {
                    if (ttl) {
                        await redis.set(key, value, "EX", ttl);
                    }
                    else {
                        await redis.set(key, value);
                    }
                }, async () => undefined);
            },
            delete: async (key: string) => {
                const { redis, withRedisFallback } = await import("@repo/shared/redis");
                await withRedisFallback("auth:secondary-storage:delete", async () => {
                    await redis.del(key);
                }, async () => undefined);
            },
        }
        : undefined,
    advanced: {
        useSecureCookies: isProduction,
        crossSubDomainCookies: {
            enabled: false,
        },
    },
    socialProviders,
    trustedOrigins: [
        getServerBaseURL(),
        process.env.BETTER_AUTH_URL || "",
        process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "",
        process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "",
        process.env.NODE_ENV === "development" ? "http://localhost:3000" : "",
        process.env.NGROK_URL || "",
    ].filter(Boolean) as string[],
    secret: process.env.BETTER_AUTH_SECRET,
    baseURL: getServerBaseURL(),
});
