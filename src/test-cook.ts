import 'dotenv/config';
import { prisma } from './db.js';
import { executeCook } from './commands/cook.js';
import { execute as huntExecute } from './commands/hunt.js';

async function runTest() {
  const player = await prisma.player.findFirst();
  if (!player) {
    console.log("No player found.");
    return;
  }
  
  console.log(`Testing using Player: ${player.name} (${player.discordId})`);

  // 1. Inject Materials
  await prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'river_trout' } },
    update: { quantity: 10 },
    create: { playerId: player.id, itemKey: 'river_trout', quantity: 10 }
  });
  
  await prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'wood' } },
    update: { quantity: 10 },
    create: { playerId: player.id, itemKey: 'wood', quantity: 10 }
  });

  // 2. Mock Discord Message
  const mockMessage: any = {
    author: { id: player.discordId, username: player.name },
    reply: async (response: any) => {
      console.log('\n--- BOT REPLY TRIGGERED ---');
      if (response && response.embeds && response.embeds.length > 0) {
        console.log(`Embed Title: ${response.embeds[0].data.title}`);
        console.log(`Embed Desc: ${response.embeds[0].data.description}`);
        if(response.embeds[0].data.fields) {
            console.log(`Embed Fields:`);
            response.embeds[0].data.fields.forEach((f: any) => {
                console.log(`  [${f.name}] => ${f.value}`);
            });
        }
      } else {
        console.log(response);
      }
      return {};
    }
  };

  // 3. Test Cook
  console.log('\n=> Executing: rpg cook roasted_trout');
  await executeCook(mockMessage, ['roasted_trout']);

  // 4. Test Hunt
  console.log('\n=> Executing: rpg hunt');
  await huntExecute(mockMessage);

}

runTest().catch(console.error).finally(() => process.exit(0));
