import { Message } from 'discord.js';
import { simulateCombat } from '../engine/combat.js';
import { initializeFightEntity } from '../engine/stats.js';
import { EntityData } from '../engine/types.js';
import { ENEMY_REGISTRY } from '../data/enemies.js';
import { rollLoot, formatLootString } from '../engine/loot.js';

// Extremely basic in-memory cooldown cache for the dopamine loop
const cooldownCache = new Map<string, number>();
const HUNT_COOLDOWN_MS = 30 * 1000; // 30 seconds

// Temporary mock data until the database is hooked up
const getMockPlayer = (id: string, name: string): EntityData => ({
    id,
    name,
    hp: 113,
    maxHp: 113,
    mana: 13,
    maxMana: 13,
    baseStats: { str: 16, dex: 21, int: 11 },
    defenses: { ac: 29, ev: 16, sh: 9 },
    damages: [{ type: 'physical', minAmount: 6, maxAmount: 23 }],
    attackSpeed: 0.89,
    meleeAccuracy: 10,
    hpRegen: 1.0,
    mpRegen: 0.0
});


export async function handleHuntCommand(message: Message) {
    const userId = message.author.id;
    
    // Check Cooldown
    const now = Date.now();
    const lastUse = cooldownCache.get(userId) || 0;
    const timePassed = now - lastUse;
    
    if (timePassed < HUNT_COOLDOWN_MS) {
        const timeLeft = Math.ceil((HUNT_COOLDOWN_MS - timePassed) / 1000);
        await message.reply(`**${message.author.username}'s cooldown**\nThe fight command is on cooldown.\n\nTry again in **${timeLeft}s**!\n\nPatience is the key.`);
        return;
    }
    
    // Pick a random enemy for Dungeon 5
    const enemyKeys = Object.keys(ENEMY_REGISTRY);
    const randomKey = enemyKeys[Math.floor(Math.random() * enemyKeys.length)];
    const selectedEnemy = ENEMY_REGISTRY[randomKey];

    // Process combat
    const p1 = initializeFightEntity(getMockPlayer(userId, message.author.username));
    const m1 = initializeFightEntity(selectedEnemy);
    
    const result = simulateCombat(p1, m1, 8);
    
    if (result.winner === 'player') {
        const drops = rollLoot(selectedEnemy.lootTable);
        const dropString = formatLootString(drops);
        
        let rewardText = `earned **${selectedEnemy.xpReward} XP**!`;
        if (dropString) {
             rewardText = `found ${dropString} and earned **${selectedEnemy.xpReward} XP**!`;
        }

        await message.reply(`${message.author.username} explored Dungeon 5 and spotted a :beetle: ${m1.data.name} at a distance of 8 spaces!\nYou defeat the **${m1.data.name}** in melee combat!\nYou won the fight in **${result.turns} turns** with ${result.finalHpLeft}/${p1.data.maxHp} HP left!\nWhile exploring you ${rewardText}`);
    } else {
        // Death
        await message.reply(`${message.author.username} explored Dungeon 5 and spotted a :beetle: ${m1.data.name} at a distance of 8 spaces!\nThe **${m1.data.name}** defeats you in melee combat!\nThe ${m1.data.name} survived with ${result.finalHpLeft}/${m1.data.maxHp} HP left!\nYou lost 20% of your progress and you will be exhausted for 5 minutes.\nYou died in **${result.turns} turns**!`);
    }
    
    // Only set cooldown after a successful command execution
    cooldownCache.set(userId, now);
}
