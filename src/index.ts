import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import prisma from './db.js';
import redisClient from './redis.js';

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
    
    // Quick test to ensure DB is connected
    try {
        const playerCount = await prisma.player.count();
        console.log(`Connected to PostgreSQL Database. Current players registered: ${playerCount}`);
        
        await redisClient.connect();
        await redisClient.set('ping', 'pong');
        const pingResponse = await redisClient.get('ping');
        console.log(`Connected to Redis Cache. Ping -> ${pingResponse}`);
    } catch (e) {
        console.error('Failed to connect to databases:', e);
    }
});

client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;

    if (message.content === '!ping' || message.content === '/ping') {
        await message.reply('Pong! The Aethermoor RPG bot foundation is live on Railway.');
    }
});

client.login(process.env.DISCORD_TOKEN);
