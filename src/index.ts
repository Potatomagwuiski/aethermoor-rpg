import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';

import { handleStart } from './commands/start';
import { handleProfile } from './commands/profile';
import { handleBossMenu, handleFightBoss } from './commands/boss';
import { handleLogsList, handleLogsGet } from './commands/logs';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  if (content === 'ping') {
    await message.reply('Pong! Bot is online and ready for a new idea.');
  } else if (content === 'rpg start') {
    await handleStart(message);
  } else if (content === 'rpg profile' || content === 'rpg p') {
    await handleProfile(message);
  } else if (content === 'rpg boss') {
    await handleBossMenu(message);
  } else if (content === 'rpg fight boss') {
    await handleFightBoss(message);
  } else if (content === 'rpg logs') {
    await handleLogsList(message);
  } else if (content.startsWith('rpg logs get ')) {
    const logIdStr = content.split(' ')[3];
    if (logIdStr) await handleLogsGet(message, logIdStr);
    else await message.reply("Please specify a log ID. Example: `rpg logs get 1`");
  } 
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
