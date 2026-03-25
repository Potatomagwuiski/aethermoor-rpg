import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import prisma from './db.js';
import redisClient from './redis.js';
import * as huntCommand from './commands/hunt.js';

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
        await readyClient.application.commands.set([huntCommand.data.toJSON()]);
        console.log('Successfully registered /hunt global command.');
    } catch (err) {
        console.error('Failed to register commands:', err);
    }
    
    try {
        const playerCount = await prisma.player.count();
        console.log(`Connected to PostgreSQL Database. Current players registered: ${playerCount}`);
    } catch (e) {
        console.error('Failed to connect to PG db:', e);
    }
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === 'hunt') {
        try {
            await huntCommand.execute(interaction);
        } catch (error) {
            console.error(error);
            if (!interaction.replied && !interaction.deferred) {
                await interaction.reply({ content: 'Error executing command.', ephemeral: true });
            }
        }
    }
});

client.login(process.env.DISCORD_TOKEN);
