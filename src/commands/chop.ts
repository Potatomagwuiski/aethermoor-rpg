import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeChop(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Pure RNG chopping node table
  const roll = Math.random();
  let materialDrop = '';
  let dropQuantity = 0;
  let flavorText = '';

  if (roll > 0.95) {
    materialDrop = 'elderwood_log';
    dropQuantity = 1;
    flavorText = 'You felled an ancient, glowing tree and harvested an ✨ **Elderwood Log**!';
  } else if (roll > 0.6) {
    materialDrop = 'pine_log';
    dropQuantity = Math.floor(Math.random() * 3) + 1;
    flavorText = `You swung your axe and chopped down **${dropQuantity} Pine Logs**.`;
  } else {
    materialDrop = 'wood_scrap';
    dropQuantity = Math.floor(Math.random() * 5) + 1;
    flavorText = `You hacked at some dry branches and gathered **${dropQuantity} Wood Scraps**.`;
  }

  // Transaction: Add to inventory, give a tiny bit of XP (Gathering XP)
  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { xp: { increment: 2 } } // Small flat XP for gathering
    }),
    prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: materialDrop } },
      update: { quantity: { increment: dropQuantity } },
      create: { playerId: player.id, itemKey: materialDrop, quantity: dropQuantity }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle('🪓 Chopping Resolved')
    .setColor(0x8B4513) // SaddleBrown
    .setDescription(flavorText)
    .addFields({ name: 'Rewards', value: `+${dropQuantity} ${materialDrop.replace('_', ' ').toUpperCase()}, +2 EXP`});

  return message.reply({ embeds: [embed] });
}
