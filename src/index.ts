import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import { executeStart } from './commands/start';
import { executeProfile } from './commands/profile';
import { executeHunt } from './commands/hunt';
import { executeAssign } from './commands/assign';
import { executeInventory } from './commands/inventory';
import { executeEquip } from './commands/equip';
import { executeLogs } from './commands/logs';
import { executeShop } from './commands/shop';
import { executeBuy } from './commands/buy';
import { executeReset } from './commands/reset';
import { executeInfo } from './commands/info';
import { executeStats } from './commands/stats';

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

  try {
    if (content === 'ping') {
      await message.reply('Pong! The clean slate is ready for the new idea.');
    } else if (content === 'rpg start') {
      await executeStart(message);
    } else if (content === 'rpg profile') {
      await executeProfile(message);
    } else if (content === 'rpg hunt') {
      await executeHunt(message);
    } else if (content.startsWith('rpg assign')) {
      const args = content.split(' ').slice(2);
      await executeAssign(message, args);
    } else if (content.startsWith('rpg inv')) {
      await executeInventory(message);
    } else if (content.startsWith('rpg equip')) {
      const args = content.split(' ').slice(2);
      await executeEquip(message, args);
    } else if (content.startsWith('rpg logs')) {
      const args = content.split(' ').slice(2);
      await executeLogs(message, args);
    } else if (content === 'rpg shop') {
      await executeShop(message);
    } else if (content.startsWith('rpg buy')) {
      const args = content.split(' ').slice(2);
      await executeBuy(message, args);
    } else if (content.startsWith('rpg reset')) {
      const args = content.split(' ').slice(2);
      await executeReset(message, args);
    } else if (content.startsWith('rpg info')) {
      const args = content.split(' ').slice(2);
      await executeInfo(message, args);
    } else if (content === 'rpg stats') {
      await executeStats(message);
    } else if (content.match(/^rpg\s+(str|dex|int|vit)(?:\s+\d+)?$/)) {
      const parts = content.split(/\s+/);
      const stat = parts[1];
      const amount = parts[2] || '1';
      await executeAssign(message, [stat, amount]);
    }
  } catch (error: any) {
    console.error(error);
    await message.reply(`A fatal error occurred: \`${error.message}\``);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
