import 'dotenv/config';
import { prisma } from './db.js';
import { execute as executeHunt } from './commands/hunt.js';
import { executeMine } from './commands/mine.js';
import { processForge } from './commands/forge.js';

async function runTest() {
  const discordId = 'progression_tester';

  // 1. Reset completely
  await prisma.player.deleteMany({ where: { discordId } });

  // 2. Create fresh player
  const player = await prisma.player.create({
    data: {
      discordId,
      name: 'Rookie Tester',
      level: 1,
      hp: 100,
      maxHp: 100,
      gold: 50,
      energy: 100,
      location: 'lumina_plains'
    }
  });

  // Give basic tool directly so we can mine
  await prisma.tool.create({
      data: {
          playerId: player.id,
          type: 'PICKAXE',
          name: '⬜ [Basic Pickaxe]',
          equipped: true,
          rarity: 'COMMON',
          yieldMultiplier: 1.0,
      }
  });

  let messageOutput = '';
  const mockMessage: any = {
    author: { id: discordId, username: player.name },
    reply: async (response: any) => {
        if (typeof response === 'string') messageOutput = response;
        else if (response.embeds) messageOutput = `${response.embeds[0].data.title}\n${response.embeds[0].data.description}`;
    }
  };

  const mockInteraction: any = {
    isStringSelectMenu: () => false,
    update: async (response: any) => {
        if (response.embeds) messageOutput = `${response.embeds[0].data.title}\n${response.embeds[0].data.description}`;
    }
  };

  console.log('=== AETHERMOOR RPG PROGRESSION SIMULATION ===');
  console.log('Simulating the first 15 interactions of a new player...');

  // Day 1: Mining for Copper & Tin
  console.log('\n[Action 1-5]: Mining 5 times in Lumina Plains');
  for (let i = 0; i < 5; i++) {
     await executeMine(mockMessage);
     const p = await prisma.player.findUnique({ where: { discordId }});
     console.log(`  Mine ${i+1}: Result -> ${messageOutput.split('\n')[2] || messageOutput.substring(0, 50).replace(/\n/g, '')} | Energy: ${p?.energy}/100`);
  }

  // Check Inventory
  const invArgs = await prisma.inventoryItem.findMany({ where: { playerId: player.id } });
  console.log(`\nInventory post-mining:`, invArgs.map(i => `${i.quantity}x ${i.itemKey}`).join(', '));

  // Let's cheat slightly and give exactly enough for a bronze sword so we don't rely entirely on RNG drops from 5 mines
  const copper = invArgs.find(i => i.itemKey === 'copper');
  const tin = invArgs.find(i => i.itemKey === 'tin');
  const wood = invArgs.find(i => i.itemKey === 'wood');

  if (!copper || copper.quantity < 10) { await prisma.inventoryItem.upsert({ where: { playerId_itemKey: { playerId: player.id, itemKey: 'copper'} }, update: { quantity: 10 }, create: { playerId: player.id, itemKey: 'copper', quantity: 10} }); }
  if (!tin || tin.quantity < 5) { await prisma.inventoryItem.upsert({ where: { playerId_itemKey: { playerId: player.id, itemKey: 'tin'} }, update: { quantity: 5 }, create: { playerId: player.id, itemKey: 'tin', quantity: 5} }); }
  if (!wood || wood.quantity < 5) { await prisma.inventoryItem.upsert({ where: { playerId_itemKey: { playerId: player.id, itemKey: 'wood'} }, update: { quantity: 5 }, create: { playerId: player.id, itemKey: 'wood', quantity: 5} }); }

  const updatedPlayer = await prisma.player.findUnique({ where: { discordId }, include: { equipment: true } });
  const updatedInv = await prisma.inventoryItem.findMany({ where: { playerId: player.id } });

  console.log('\n[Action 6]: Forging a Bronze Sword');
  await processForge('bronze_sword', updatedPlayer, updatedInv, mockMessage, false);
  console.log(`  Result: ${messageOutput.substring(0, 150).replace(/\n/g, ' ')}...`);

  const pAfterForge = await prisma.player.findUnique({ where: { discordId }, include: { equipment: true } });
  const weapon = pAfterForge?.equipment.find(e => e.equipped && e.slot === 'WEAPON');
  console.log(`  Equipped Weapon: ${weapon?.name} (ATK: ${weapon?.bonusAtk})`);

  console.log('\n[Action 7-15]: Hunting 9 times in Lumina Plains');
  for (let i = 0; i < 9; i++) {
      let huntP = await prisma.player.findUnique({ where: { discordId } });
      if (huntP && huntP.hp <= 20) {
          console.log(`  Hunt ${i+1}: Skipped! HP too low (${huntP.hp}). Simulating Potion use...`);
          await prisma.player.update({ where: { discordId }, data: { hp: 100 } });
          continue;
      }

      await executeHunt(mockMessage);
      const postHuntP = await prisma.player.findUnique({ where: { discordId } });
      const didDie = messageOutput.includes('DEFEAT');
      
      console.log(`  Hunt ${i+1}: ${didDie ? '❌ DEFEAT' : '✅ VICTORY'} | Level: ${postHuntP?.level} (XP: ${postHuntP?.xp}/${postHuntP?.level!*100}) | HP: ${postHuntP?.hp}/${postHuntP?.maxHp} | Gold: ${postHuntP?.gold}`);
      
      if (didDie) {
          // Heal the player back up to full to continue simulation
          await prisma.player.update({ where: { discordId }, data: { hp: 100 } });
      }
  }

  const finalPlayer = await prisma.player.findUnique({ where: { discordId } });
  console.log(`\n=== END OF SIMULATION ===`);
  console.log(`Final Player State: Level ${finalPlayer?.level}, Gold: ${finalPlayer?.gold}, Energy: ${finalPlayer?.energy}`);

}

runTest()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
