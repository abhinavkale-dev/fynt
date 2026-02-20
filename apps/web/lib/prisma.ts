import { PrismaClient } from "@repo/prisma";
import { PrismaPg } from "@prisma/adapter-pg";

const REQUIRED_MODEL_DELEGATES = ["user", "session", "account", "verification"] as const;

const adapter = new PrismaPg({
    connectionString: process.env.DATABASE_URL!,
});

const globalForPrisma = global as unknown as {
    prisma?: PrismaClient;
};

function hasRequiredDelegates(client: PrismaClient | undefined): client is PrismaClient {
    if (!client) return false;
    const record = client as unknown as Record<string, unknown>;
    return REQUIRED_MODEL_DELEGATES.every((delegateName) => delegateName in record);
}

function createPrismaClient(): PrismaClient {
    return new PrismaClient({
        adapter,
    });
}

const existingClient = globalForPrisma.prisma;
if (existingClient && !hasRequiredDelegates(existingClient)) {
    void (existingClient as PrismaClient).$disconnect().catch(() => undefined);
    globalForPrisma.prisma = undefined;
}

const prisma = hasRequiredDelegates(globalForPrisma.prisma)
    ? globalForPrisma.prisma
    : createPrismaClient();

if (process.env.NODE_ENV !== "production") {
    globalForPrisma.prisma = prisma;
}

export default prisma;
