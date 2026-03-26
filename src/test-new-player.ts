import 'dotenv/config';
import { prisma } from './db.js';
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
      level: 1,
      hp: 100,
      maxHp: 100,
      gold: 0,
    }
  });

  // No Armor! Just Fists + Casual Clothes.

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

  // Test Hunt
  console.log('\n=> Executing: rpg hunt (Level 1 with Fists, NO ARMOR)');
  await huntExecute(mockMessage);

}

runTest()
  .catch(e => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
    process.exit(0);
  });
