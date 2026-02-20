import { PrismaClient } from '../generated/prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(process.cwd(), '../../.env') });
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}
const adapter = new PrismaPg({ connectionString });
const prisma = new PrismaClient({ adapter });
async function main() {
    console.log('Seeding database...');
    await prisma.availableTrigger.createMany({
        data: [
            {
                id: 'webhook',
                name: 'Webhook',
                image: 'https://cdn-icons-png.flaticon.com/512/25/25231.png',
            },
            {
                id: 'form',
                name: 'Form',
                image: 'https://cdn-icons-png.flaticon.com/512/1828/1828817.png',
            },
            {
                id: 'manual',
                name: 'Manual Trigger',
                image: 'https://cdn-icons-png.flaticon.com/512/7268/7268807.png',
            },
        ],
        skipDuplicates: true,
    });
    await prisma.availableAction.createMany({
        data: [
            {
                id: 'slack',
                name: 'Send Slack Message',
                image: 'https://cdn-icons-png.flaticon.com/512/2111/2111615.png',
            },
            {
                id: 'telegram',
                name: 'Send Telegram Message',
                image: 'https://cdn-icons-png.flaticon.com/512/2111/2111646.png',
            },
            {
                id: 'openai',
                name: 'OpenAI',
                image: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
            },
            {
                id: 'discord',
                name: 'Send Discord Message',
                image: 'https://cdn-icons-png.flaticon.com/512/2111/2111370.png',
            },
        ],
        skipDuplicates: true,
    });
    console.log('Seeding completed successfully');
}
main()
    .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
