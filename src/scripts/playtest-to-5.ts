import { execute as runHunt } from '../commands/hunt.js';
import { executeForge as runForge } from '../commands/forge.js';
import prisma from '../db.js';

async function mockMessage(userId: string, inputOptions: any = {}) {
    let mockOutput = '';
    return {
        author: { id: userId },
        reply: (res: any) => {
            if (res.embeds && res.embeds[0]) {
                 mockOutput = `[COMBAT] ${res.embeds[0].data.title || ''}\n`;
            } else if (res.content) {
                 mockOutput = `[SYSTEM] ${res.content}`;
            }
        },
        options: {
            getString: (k: string) => inputOptions[k] || null
        },
        getMockOutput: () => mockOutput
    };
}

async function simulate() {
    console.log("=== INITIATING AUTOMATED STARTER PLAYTEST TO LEVEL 5 ===");

    // 1. Create or Reset a purely blank character for testing
    let player = await prisma.player.upsert({
        where: { discordId: 'TEST_STARTER' },
        update: { level: 1, xp: 0, gold: 0, hp: 100, maxHp: 100, location: 'lumina_plains' },
        create: { discordId: 'TEST_STARTER', name: 'Starter Hero', level: 1, hp: 100, maxHp: 100, str: 10, int: 10, agi: 10, location: 'lumina_plains' }
    });

    // Wipe inventory and gear to simulate fresh account
    await prisma.inventoryItem.deleteMany({ where: { playerId: player.id }});
    await prisma.equipment.deleteMany({ where: { playerId: player.id }});

    // Give a baseline Iron Spellblade (Hybrid) to start
    await prisma.equipment.create({
        data: {
            playerId: player.id,
            baseItemKey: 'iron_spellblade',
            name: 'Iron Spellblade',
            slot: 'WEAPON',
            equipmentClass: 'SPELLBLADE_WEAPON',
            bonusAtk: 100,
            bonusDef: 0,
            bonusCrit: 0,
            bonusLifesteal: 0,
            bonusEvasion: 0,
            equipped: true
        }
    });

    console.log(`\n🦸‍♂️ Created [Starter Hero] @ Level 1 w/ Iron Spellblade (SPELLBLADE)!`);

    console.log(`\n🦸‍♂️ Created [Starter Hero] @ Level 1 w/ Wooden Club!`);
    
    let hunts = 0;
    let crafts = 0;
    let deaths = 0;

    while (player.level < 5) {
        // --- PRE-COMBAT CHECKS ---
        if (player.hp < Math.floor(player.maxHp * 0.40)) {
            console.log(`🛌 HP is critically low (${player.hp}/${player.maxHp}). Resting to full HP...`);
            await prisma.player.update({ where: { id: player.id }, data: { hp: player.maxHp }});
            player.hp = player.maxHp;
        }

        // Check if we can craft a better weapon (Bronze Sword requires 25 Copper + 10 Sticks)
        const inv = await prisma.inventoryItem.findMany({ where: { playerId: player.id }});
        const copper = inv.find((i: any) => i.itemKey === 'copper_ore')?.quantity || 0;
        const sticks = inv.find((i: any) => i.itemKey === 'stick')?.quantity || 0;

        if (copper >= 25 && sticks >= 10) {
            console.log(`\n🛠️ SUFFICIENT MATERIALS GATHERED! (Copper: ${copper}, Sticks: ${sticks})`);
            console.log(`🔨 Initiating Forge: Bronze Sword...`);
            const forgeMsg = await mockMessage(player.discordId, { item: 'bronze_sword' });
            await runForge(forgeMsg as any, ['bronze_sword'] as any);
            console.log(forgeMsg.getMockOutput());
            crafts++;
        }

        // --- HUNT LOOP ---
        hunts++;
        // Clear redis cooldown manually
        try {
            const redisClient = require('../redis.js').default;
            if (!redisClient.isOpen) await redisClient.connect();
            await redisClient.del(`cooldown:hunt:${player.discordId}`);
        } catch(e) {}

        const huntMsg = await mockMessage(player.discordId);
        await runHunt(huntMsg as any);
        const out = huntMsg.getMockOutput();
        
        let suffix = "";
        if (out.includes('DEFEAT')) {
             suffix = "💀 (DIED!)";
             deaths++;
        } else if (out.includes('Hunt Resolved')) {
             suffix = "✅ (VICTORY)";
        }
        
        // Refresh player stats
        player = await prisma.player.findUnique({ where: { id: player.id } }) as any;
        console.log(`Hunt #${hunts}: ${suffix} | Hero Lvl ${player.level} | ${player.hp}/${player.maxHp} HP | XP: ${player.xp} | Gold: ${player.gold}`);
        
        if (hunts > 100) {
            console.log("Safety limit reached! Aborting infinite loop.");
            break;
        }
    }

    console.log(`\n🎉 === STARTER REACHED LEVEL 5 === 🎉`);
    console.log(`Total Hunts: ${hunts}`);
    console.log(`Total Deaths: ${deaths}`);
    console.log(`Total Crafts: ${crafts}`);
    
    // Dump final gear and inventory!
    const eq = await prisma.equipment.findFirst({ where: { playerId: player.id, slot: 'WEAPON', equipped: true }});
    console.log(`\n>>> Final Equipment: **${eq?.name}**`);
    console.log(`>>> Final Gold: 🪙 ${player.gold}`);

    process.exit(0);
}

simulate();
