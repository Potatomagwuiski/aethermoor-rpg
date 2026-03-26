import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import prisma from './db.js';
import redisClient from './redis.js';
import * as huntCommand from './commands/hunt.js';
import * as startCommand from './commands/start.js';

dotenv.config();

const client = new Client({
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.MessageContent,
    ],
});

client.once(Events.ClientReady, async (readyClient) => {
    console.log(`Ready! Logged in as ${readyClient.user.tag}`);
    
    try {
        const playerCount = await prisma.player.count();
        console.log(`Connected to PostgreSQL Database. Current players registered: ${playerCount}`);
    } catch (e) {
        console.error('Failed to connect to PG db:', e);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    const content = message.content.toLowerCase().trim();

    if (!content.startsWith('rpg ')) return;

    const args = content.slice(4).trim().split(/ +/);
    const command = args.shift();

    if (command === 'ping') {
        await message.reply('Pong! The Aethermoor RPG bot foundation is live.');
    } else if (command === 'start') {
        try {
            await startCommand.execute(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing start command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'hunt') {
        try {
            await huntCommand.execute(message);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing hunt command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
