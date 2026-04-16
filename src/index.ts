import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import { executeStart } from './commands/start';
import { executeProfile } from './commands/profile';
import { executeHunt } from './commands/hunt';

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
    await message.reply('Pong! The clean slate is ready for the new idea.');
  } else if (content === 'rpg start') {
    await executeStart(message);
  } else if (content === 'rpg profile') {
    await executeProfile(message);
  } else if (content === 'rpg hunt') {
    await executeHunt(message);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
