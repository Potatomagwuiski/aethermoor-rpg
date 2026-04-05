import { Client, GatewayIntentBits, Events, Message } from 'discord.js';
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

    const PREFIX = 'rpg ';
    
    // Simple command router
    client.on(Events.MessageCreate, async (message: Message) => {
        // Ignore bots and messages that don't start with our prefix
        if (message.author.bot || !message.content.toLowerCase().startsWith(PREFIX)) return;

        const args = message.content.slice(PREFIX.length).trim().split(/ +/);
        const commandName = args.shift()?.toLowerCase();

        if (!commandName) return;

        try {
            if (commandName === 'hunt') {
                const { handleHuntCommand } = await import('./commands/hunt.js');
                await handleHuntCommand(message);
            } else if (commandName === 'p' || commandName === 'profile') {
                const { handleProfileCommand } = await import('./commands/profile.js');
                await handleProfileCommand(message);
            } else if (commandName === 'shop' || commandName === 'buy') {
                const { handleShopCommand } = await import('./commands/shop.js');
                await handleShopCommand(message, args);
            } else if (commandName === 'inv' || commandName === 'i') {
                const { handleInventoryCommand } = await import('./commands/inventory.js');
                await handleInventoryCommand(message, args);
            } else if (commandName === 'equip') {
                const { handleEquipCommand } = await import('./commands/equip.js');
                await handleEquipCommand(message, args);
            } else if (commandName === 'enchant') {
                const { handleEnchantCommand } = await import('./commands/enchant.js');
                await handleEnchantCommand(message, args);
            } else if (commandName === 'gather') {
                const { handleGatherCommand } = await import('./commands/gather.js');
                await handleGatherCommand(message);
            } else if (commandName === 'forge') {
                const { handleForgeCommand } = await import('./commands/craft.js');
                await handleForgeCommand(message, args);
            } else if (commandName === 'cook') {
                const { handleCookCommand } = await import('./commands/craft.js');
                await handleCookCommand(message, args);
            } else if (commandName === 'eat') {
                const { handleEatCommand } = await import('./commands/consume.js');
                await handleEatCommand(message, args);
            } else if (commandName === 'read') {
                const { handleReadCommand } = await import('./commands/consume.js');
                await handleReadCommand(message, args);
            }
        } catch (error) {
            console.error(`Error executing ${commandName}:`, error);
            await message.reply('An error occurred while executing that command.');
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
