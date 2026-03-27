import 'dotenv/config';
import { prisma } from './db.js';
import { execute as executeHunt } from './commands/hunt.js';

async function runTest() {
  const discordId = 'hunter_002';

  // 1. Reset completely
  await prisma.player.deleteMany({ where: { discordId } });

  // 2. Create fresh player
  const player = await prisma.player.create({
    data: {
      discordId,
      name: 'Grandmaster Mage',
      level: 50,
      hp: 5000,
      maxHp: 5000,
      energy: 100,
      gold: 5000,
      location: 'abyssal_depths',
      int: 200,
      end: 150
    }
  });

  // 3. Equip Legendary Meteor Staff
  await prisma.equipment.create({
      data: {
          playerId: player.id,
          slot: 'WEAPON',
          name: '🟧 [✨ LEGENDARY METEOR STAFF ✨]',
          baseItemKey: 'legendary_meteor_staff',
          equipped: true,
          rarity: 'LEGENDARY',
          equipmentClass: 'MAGIC_WEAPON',
          bonusAtk: 1200,
          bonusCrit: 25
      }
  });

  // Equip Legendary Void Armor (Shadow Tunic but mocked)
  await prisma.equipment.create({
      data: {
          playerId: player.id,
          slot: 'ARMOR',
          name: '🟧 [✨ LEGENDARY SHADOW TUNIC ✨]',
          baseItemKey: 'legendary_shadow_tunic',
          equipped: true,
          rarity: 'LEGENDARY',
          equipmentClass: 'LIGHT_ARMOR',
          bonusDef: 800,
          bonusEvasion: 30
      }
  });

  // Mock Math.random to always succeed 50% rolls but not 100%, to show variety.
  const originalMathRandom = Math.random;
  Math.random = () => 0.99;

  const mockMessage: any = {
    author: { id: discordId, username: player.name },
    reply: async (response: any) => {
      console.log('--- TEST HUNT RESULT ---');
      console.log(response.embeds[0].data.title);
      console.log(response.embeds[0].data.description);
      if (response.embeds[0].data.fields) {
         response.embeds[0].data.fields.forEach((f: any) => console.log(`\n${f.name}\n${f.value}`));
      }
    }
  };

  try {
    console.log('Simulating hunting Abyssal Lich with Legendary Meteor Staff...');
    await executeHunt(mockMessage);
  } catch (error) {
    console.error('Test crashed:', error);
  } finally {
    Math.random = originalMathRandom; // Restore
    await prisma.$disconnect();
  }
}

runTest();
