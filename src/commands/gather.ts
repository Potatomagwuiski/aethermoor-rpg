import { Message } from 'discord.js';
import { ITEM_REGISTRY } from '../data/items.js';

// Extremely basic in-memory cooldown cache for the dopamine loop
const cooldownCache = new Map<string, number>();
const GATHER_COOLDOWN_MS = 60 * 1000 * 5; // 5 minutes representing strict pacing

interface GatherLoot {
    itemId: string;
    chance: number;
    minQuantity: number;
    maxQuantity: number;
}

// Unified Gathering Loot Table representing all professions
const GATHER_TABLE: GatherLoot[] = [
    // Mining
    { itemId: "iron_ore", chance: 0.30, minQuantity: 1, maxQuantity: 3 },
    // Chopping
    { itemId: "oak_log", chance: 0.30, minQuantity: 1, maxQuantity: 4 },
    // Fishing
    { itemId: "raw_salmon", chance: 0.15, minQuantity: 1, maxQuantity: 2 },
    // Foraging
    { itemId: "goblin_herb", chance: 0.20, minQuantity: 1, maxQuantity: 3 }
];

export async function handleGatherCommand(message: Message) {
    const userId = message.author.id;
    
    // Check Cooldown
    const now = Date.now();
    const lastUse = cooldownCache.get(userId) || 0;
    const timePassed = now - lastUse;
    
    if (timePassed < GATHER_COOLDOWN_MS) {
        const timeLeft = Math.ceil((GATHER_COOLDOWN_MS - timePassed) / 1000);
        await message.reply(`**${message.author.username}'s cooldown**\nThe gather command is on cooldown.\n\nTry again in **${timeLeft}s**!\n\nPatience is the key.`);
        return;
    }
    
    const drops: string[] = [];

    // Evaluate the enormous table
    for (const loot of GATHER_TABLE) {
        if (Math.random() <= loot.chance) {
            const qty = Math.floor(Math.random() * (loot.maxQuantity - loot.minQuantity + 1)) + loot.minQuantity;
            const itemDef = ITEM_REGISTRY[loot.itemId];
            if (itemDef) {
                drops.push(`${qty}x ${itemDef.icon} ${itemDef.name}`);
                
                // === PRODUCTION PRISMA LOGIC ===
                // await prisma.gameItem.create({ data: { playerId: userId, baseItemId: loot.itemId, quantity: qty... }})
            }
        }
    }
    
    // If they got extremely unlucky and rolled nothing, give them a pity item
    if (drops.length === 0) {
        const itemDef = ITEM_REGISTRY["oak_log"];
        drops.push(`1x ${itemDef?.icon} ${itemDef?.name}`);
    }

    const dropString = drops.join(' and ');
    await message.reply(`${message.author.username} explored the surrounding wilderness and gathered:\n**${dropString}**!`);
    
    cooldownCache.set(userId, now);
}
