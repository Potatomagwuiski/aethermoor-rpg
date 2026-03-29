import 'dotenv/config';
import { prisma } from './db.js';
import { execute as executeHunt } from './commands/hunt.js';
import { executeForge } from './commands/forge.js';

async function runTest() {
  const discordId = 'combat_tester';
  
  await prisma.player.deleteMany({ where: { discordId } });

  const player = await prisma.player.create({
    data: {
      discordId,
      name: 'Combat Tester',
      level: 10,
      hp: 1500,
      maxHp: 1500,
      gold: 50000,
      energy: 100,
      location: 'lumina_plains'
    }
  });

  // Give Venom Shiv explicitly
  await prisma.equipment.create({
      data: {
          playerId: player.id,
          slot: 'WEAPON',
          name: '🟦 [Rare Venom Shiv]',
          baseItemKey: 'rare_venom_shiv',
          equipped: true,
          rarity: 'RARE',
          bonusAtk: 90,
          bonusCrit: 15,
      }
  });

  let messageOutput = '';
  const mockMessage: any = {
    author: { id: discordId, username: player.name },
    content: '',
    reply: async (response: any) => {
        if (typeof response === 'string') messageOutput = response;
        else if (response.embeds) {
            const desc = response.embeds[0].data.description || '';
            const fields = response.embeds[0].data.fields ? response.embeds[0].data.fields.map((f:any)=>`${f.name}: ${f.value}`).join(' | ') : '';
            messageOutput = `[EMBED TITLE]: ${response.embeds[0].data.title}\n[DESC]: ${desc}\n[FIELDS]: ${fields}`;
        }
    }
  };

  console.log('=== COMBAT SIMULATION ===');

  for (let i = 0; i < 5; i++) {
     mockMessage.content = 'rpg hunt';
     await executeHunt(mockMessage);
     console.log(`\n--- HUNT ${i+1} ---`);
     // console.log(messageOutput.substring(0, 300).replace(/\n/g, ' '));
     console.log(messageOutput);
  }

  // Give Dungeon Key
  await prisma.inventoryItem.upsert({ where: { playerId_itemKey: { playerId: player.id, itemKey: 'dungeon_key'} }, update: { quantity: 10 }, create: { playerId: player.id, itemKey: 'dungeon_key', quantity: 10} });

  console.log('\n\n=== UPGRADE SIMULATION ===');
  mockMessage.content = 'rpg forge upgrade weapon';
  await executeForge(mockMessage, ['upgrade', 'weapon']);
  console.log(messageOutput);

  // We need stones for upgrading! Output should be "Not enough stones".
  // Give Enhancement Stones
  await prisma.inventoryItem.upsert({ where: { playerId_itemKey: { playerId: player.id, itemKey: 'enhancement_stone'} }, update: { quantity: 5 }, create: { playerId: player.id, itemKey: 'enhancement_stone', quantity: 5} });
  
  await executeForge(mockMessage, ['upgrade', 'weapon']);
  console.log('\nSecond upgrade output:');
  console.log(messageOutput);

  process.exit(0);
}

runTest().catch(console.error);
