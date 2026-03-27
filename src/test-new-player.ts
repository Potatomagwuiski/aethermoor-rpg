import 'dotenv/config';
import prisma from './db.js';
import { execute as huntExecute } from './commands/hunt.js';

async function runTest() {
  const discordId = 'new_player_001';

  // 1. Reset completely
  await prisma.player.deleteMany({ where: { discordId } });

  // 2. Create fresh player
  const player = await prisma.player.create({
    data: {
      discordId,
      name: 'Fresh Spawn',
      level: 10,
      hp: 1500,
      maxHp: 1500,
      gold: 0,
      location: 'abyssal_depths' // High tier zone to survive longer
    }
  });

  // 3. Equip Epic Meteor Staff & Epic Lich Mantle to test abilities
  await prisma.equipment.createMany({
      data: [
          {
              playerId: player.id,
              slot: 'WEAPON',
              baseItemKey: 'epic_meteor_staff',
              name: '🟪 [Epic Meteor Staff]',
              equipped: true,
              equipmentClass: 'MAGIC_WEAPON',
              bonusAtk: 300,
              bonusDef: 0,
              bonusCrit: 0,
              bonusEvasion: 0,
              bonusLifesteal: 0,
              id: 'test_weap_1'
          },
          {
              playerId: player.id,
              slot: 'ARMOR',
              baseItemKey: 'epic_lich_mantle',
              name: '🟪 [Epic Lich Mantle]',
              equipped: true,
              equipmentClass: 'CLOTH',
              bonusAtk: 0,
              bonusDef: 200,
              bonusCrit: 0,
              bonusEvasion: 0,
              bonusLifesteal: 0,
              id: 'test_arm_1'
          }
      ]
  });

  const mockMessage: any = {
    author: { id: discordId, username: player.name },
    reply: async (response: any) => {
      console.log('\n--- BOT REPLY TRIGGERED ---');
      if (typeof response === 'string') {
        console.log(response);
      } else if (response.embeds) {
        const embed = response.embeds[0].data;
        console.log(`Embed Title: ${embed.title}`);
        console.log(`Embed Desc: ${embed.description}`);
        if (embed.fields) {
          console.log('Embed Fields:');
          embed.fields.forEach((f: any) => console.log(`  [${f.name}] => ${f.value}`));
        }
      }
    }
  };

  console.log('\n=> Executing: rpg hunt (Level 10 with Epic Meteor Staff & Epic Lich Mantle)');
  // Run multiple hunts to ensure RNG procs (like 10% Meteor) have a chance to trigger
  for (let i = 0; i < 5; i++) {
      console.log(`\n--- HUNT ATTEMPT ${i + 1} ---`);
      await huntExecute(mockMessage);
  }

}

runTest()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
