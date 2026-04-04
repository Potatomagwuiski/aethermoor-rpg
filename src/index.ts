import { Client, GatewayIntentBits, Events } from 'discord.js';
import { CONFIG } from './config.js';
import { prisma } from './database.js';
import { redis } from './cache.js';

async function bootstrap() {
    console.log('Starting Aethermoor RPG Bot Initialization...');

    // Initialize the Discord client with necessary intents
    const client = new Client({
        intents: [
            GatewayIntentBits.Guilds,
            GatewayIntentBits.GuildMessages,
            GatewayIntentBits.MessageContent,
        ],
    });

    // Handle bot readiness
    client.once(Events.ClientReady, async (readyClient) => {
        console.log(`✅ Ready! Logged in as ${readyClient.user.tag}`);
        
        // Verify database connection
        try {
            await prisma.$connect();
            console.log('✅ Database connection established via Prisma.');
        } catch (error) {
            console.error('❌ Database connection failed:', error);
            process.exit(1);
        }

        // Verify redis connection
        try {
            await redis.ping();
            console.log('✅ Redis connection initialized.');
        } catch (error) {
            console.error('❌ Redis connection failed:', error);
        }
    });

    // Pass uncaught error handlers
    process.on('unhandledRejection', (error) => {
        console.error('Unhandled Rejection:', error);
    });

    // Login to Discord
    await client.login(CONFIG.discord.token);
}

// Start application
bootstrap().catch((error) => {
    console.error('Failed to start application:', error);
    process.exit(1);
});
