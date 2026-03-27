import 'dotenv/config';
import { Client, GatewayIntentBits, Events } from 'discord.js';
import prisma from './db.js';
import redisClient from './redis.js';
import * as huntCommand from './commands/hunt.js';
import * as startCommand from './commands/start.js';
import { executeMine } from './commands/mine.js';
import { executeChop } from './commands/chop.js';
import { executeFish } from './commands/fish.js';
import { executeHarvest } from './commands/harvest.js';
import { executeShop, executeBuy } from './commands/shop.js';
import { executeDungeon } from './commands/dungeon.js';
import { executeForge } from './commands/forge.js';
import { executeHeal } from './commands/heal.js';
import { executeCook } from './commands/cook.js';
import { executeHelp } from './commands/help.js';
import { executeInventory } from './commands/inventory.js';
import { executeProfile } from './commands/profile.js';
import { executeReset } from './commands/reset.js';
import { executeStat } from './commands/stat.js';
import { executeSell } from './commands/sell.js';
import { executeGive } from './commands/give.js';
import { executePay } from './commands/pay.js';
import { executeHatch } from './commands/hatch.js';
import { executeEquip } from './commands/equip.js';
import { executeTravel } from './commands/travel.js';
import { executeRest } from './commands/rest.js';

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
        if (!redisClient.isOpen) {
            await redisClient.connect();
        }
        console.log('Redis connected successfully.');
        
        const playerCount = await prisma.player.count();
        console.log(`Connected to PostgreSQL Database. Current players registered: ${playerCount}`);
    } catch (e) {
        console.error('Failed to connect to databases (Redis/PG):', e);
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
    } else if (command === 'mine') {
        try {
            await executeMine(message);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing mine command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'chop') {
        try {
            await executeChop(message);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing chop command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'fish') {
        try {
            await executeFish(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing fish command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'harvest') {
        try {
            await executeHarvest(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing harvest command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'hatch') {
        try {
            await executeHatch(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing hatch command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'shop') {
        try {
            await executeShop(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing shop command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'buy') {
        try {
            await executeBuy(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing buy command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'dungeon') {
        try {
            await executeDungeon(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing dungeon command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'forge') {
        try {
            await executeForge(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing forge command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'help') {
        try {
            await executeHelp(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing help command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'cook') {
        try {
            await executeCook(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing cook command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'reset') {
        try {
            await executeReset(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing reset command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'stat' || command === 'stats' || command === 'str' || command === 'agi' || command === 'int' || command === 'end') {
        try {
            await executeStat(message, command as string, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing stat command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'heal') {
        try {
            await executeHeal(message);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing heal command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'profile' || command === 'p') {
        try {
            await executeProfile(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing profile command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'inv' || command === 'inventory' || command === 'i') {
        try {
            await executeInventory(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing inventory command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'sell') {
        try {
            await executeSell(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing sell command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'give' || command === 'trade') {
        try {
            await executeGive(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing give command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'pay') {
        try {
            await executePay(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing pay command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'travel') {
        try {
            await executeTravel(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing travel command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'rest' || command === 'campfire') {
        try {
            await executeRest(message);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing rest command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else if (command === 'equip' || command === 'e') {
        try {
            await executeEquip(message, args);
        } catch (error: any) {
            console.error(error);
            await message.reply(`Error executing equip command: ${error.message}\n\`\`\`\n${error.stack}\n\`\`\``);
        }
    } else {
        await message.reply('❓ **Unknown command.** Try:\n⚔️ `rpg hunt` | 🏰 `rpg dungeon`\n⛏️ `rpg mine` | 🪓 `rpg chop` | 🎣 `rpg fish` | 🌾 `rpg harvest`\n🛒 `rpg shop` | 💰 `rpg buy` | 🔄 `rpg trade`\n🔨 `rpg forge` | 🛡️ `rpg equip`\n🗺️ `rpg travel` | 🧪 `rpg heal`\n📖 `rpg profile` | 🎒 `rpg inv`\n📊 `rpg stat` | ❓ `rpg help`');
    }
});

client.login(process.env.DISCORD_TOKEN);
