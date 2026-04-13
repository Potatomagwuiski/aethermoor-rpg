import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import { ACTIONS, REACTIONS, STANCES } from './game/items';
import { Fighter, buildFighter, resolveCombat } from './game/combat';
import { handleStart } from './commands/start';
import { handleProfile } from './commands/profile';
import prisma from './lib/prisma';

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
  } else if (content === 'rpg sim') {
    // Scaffold two pre-made builds fighting
    const rogue = buildFighter("Shadow Assassin", 
       { str: 5, dex: 30, vit: 10, int: 5 }, 
       { stance: STANCES['shadow_cloak'], action: ACTIONS['assassin_blade'], reaction: REACTIONS['smoke_powder'] }
    );

    const paladin = buildFighter("Holy Paladin", 
       { str: 20, dex: 5, vit: 25, int: 15 }, 
       { stance: STANCES['paladin_aura'], action: ACTIONS['heavy_greataxe'], reaction: REACTIONS['shield_bash'] }
    );

    let logStr = "**--- TICK-BASED COMBAT SIMULATION ---**\n";
    logStr += "🗡️ **Shadow Assassin** [Shadow Cloak (Evade/Stealth) + Assassin Blade (Fast) + Smoke Powder (Re-stealth)]\n";
    logStr += "Vs.\n";
    logStr += "🛡️ **Holy Paladin** [Paladin Aura (+AC/+Shield) + Heavy Greataxe (Slow/Heavy) + Shield Bash (Reflect)]\n\n";

    const combatLogs = resolveCombat(rogue, paladin);
    let fullLog = logStr + combatLogs.join("\n");
    if (fullLog.length > 1950) fullLog = fullLog.substring(0, 1950) + "\n...[Truncated]";
    await message.reply(fullLog);

  } else if (content === 'rpg pve') {
    const user = await prisma.user.findUnique({ where: { id: message.author.id } });
    if (!user) return message.reply("You haven't started yet! Type `rpg start`.");

    const playerFighter = buildFighter(
      message.author.username,
      { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
      {
        stance: user.stanceId ? STANCES[user.stanceId] : undefined,
        action: user.actionId ? ACTIONS[user.actionId] : undefined,
        reaction: user.reactionId ? REACTIONS[user.reactionId] : undefined,
      }
    );

    const monsterFighter = buildFighter(
      "Corrupted Golem",
      { str: 15, dex: 5, vit: 20, int: 0 },
      {
        stance: STANCES['paladin_aura'],
        action: ACTIONS['heavy_greataxe'],
        reaction: REACTIONS['shield_bash']
      }
    );

    let logStr = `**You encounter a Corrupted Golem in the wilds!**\n\n`;
    const combatLogs = resolveCombat(playerFighter, monsterFighter);
    
    let fullLog = logStr + combatLogs.join("\n");
    if (fullLog.length > 1950) fullLog = fullLog.substring(0, 1950) + "\n...[Truncated]";
    await message.reply(fullLog);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
