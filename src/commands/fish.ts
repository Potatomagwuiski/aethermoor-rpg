import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeFish(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Pure RNG fishing node table
  const roll = Math.random();
  let materialDrop = '';
  let dropQuantity = 0;
  let flavorText = '';

  if (roll > 0.95) {
    materialDrop = 'void_bass';
    dropQuantity = 1;
    flavorText = 'You wrestled an otherworldly creature from the depths: a ✨ **Void Bass**!';
  } else if (roll > 0.6) {
    materialDrop = 'river_trout';
    dropQuantity = Math.floor(Math.random() * 3) + 1;
    flavorText = `Your bobber dipped, and you reeled in **${dropQuantity} River Trout**.`;
  } else {
    materialDrop = 'seaweed';
    dropQuantity = Math.floor(Math.random() * 5) + 1;
    flavorText = `Your hook got snagged. You pulled up **${dropQuantity} clumps of Seaweed**.`;
  }

  // Transaction: Add to inventory, give a tiny bit of XP (Gathering XP)
  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { xp: { increment: 2 } }
    }),
    prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: materialDrop } },
      update: { quantity: { increment: dropQuantity } },
      create: { playerId: player.id, itemKey: materialDrop, quantity: dropQuantity }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle('🎣 Fishing Resolved')
    .setColor(0x1E90FF) // DodgerBlue
    .setDescription(flavorText)
    .addFields({ name: 'Rewards', value: `+${dropQuantity} ${materialDrop.replace('_', ' ').toUpperCase()}, +2 EXP`});

  return message.reply({ embeds: [embed] });
}
