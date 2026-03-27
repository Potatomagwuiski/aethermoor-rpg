import 'dotenv/config';
import { prisma } from './db.js';
import { executeMine } from './commands/mine.js';

async function runTest() {
  const discordId = 'gatherer_001';

  // 1. Reset completely
  await prisma.player.deleteMany({ where: { discordId } });

  // 2. Create fresh player
  const player = await prisma.player.create({
    data: {
      discordId,
      name: 'Rico The Prospector',
      level: 10,
      hp: 1500,
      maxHp: 1500,
      gold: 0,
      location: 'ironpeak_mountains'
    }
  });

  // 3. Equip Mythril Pickaxe
  await prisma.tool.create({
      data: {
          playerId: player.id,
          type: 'PICKAXE',
          name: '🟦 [Mythril Pickaxe]',
          equipped: true,
          rarity: 'RARE',
          yieldMultiplier: 8.0,
          activeAbilities: [
              '⛏️ **Miner**: +1 Base Yield',
              '💎 **Prospector**: 15% chance to drop Epic Ore',
              '🌟 **Overload**: 5% chance to 10x all gathered resources'
          ]
      }
  });

  // Since Overload evaluates Math.random() > 0.95, let's force the probabilities for this test run.
  // We'll mock Math.random to always succeed the proc rolls.
  const originalMathRandom = Math.random;
  Math.random = () => 0.99; 

  const mockMessage: any = {
    author: { id: discordId, username: player.name },
    reply: async (response: any) => {
      console.log('--- TEST MINE RESULT ---');
      console.log(response.embeds[0].data.title);
      console.log(response.embeds[0].data.description);
    }
  };

  try {
    console.log('Simulating mining with Mythril Pickaxe (100% proc)...');
    await executeMine(mockMessage);
  } catch (error) {
    console.error('Test crashed:', error);
  } finally {
    Math.random = originalMathRandom; // Restore
    await prisma.$disconnect();
  }
}

runTest();
