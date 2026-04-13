import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';

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

import { handleGather } from './commands/gather';
import { handleStart } from './commands/start';
import { handleProfile } from './commands/profile';
import { handleInventory } from './commands/inventory';

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  // Basic Router
  if (content === 'rpg gather') {
    try {
      await handleGather(message);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while gathering.");
    }
  } else if (content === 'rpg start') {
    try {
      await handleStart(message);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while starting your adventure.");
    }
  } else if (content === 'rpg profile' || content === 'rpg p') {
    try {
      await handleProfile(message);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while fetching your profile.");
    }
  } else if (content === 'rpg inventory' || content === 'rpg inv' || content === 'rpg i') {
    try {
      await handleInventory(message);
    } catch (error) {
      console.error(error);
      message.reply("An error occurred while fetching your inventory.");
    }
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
