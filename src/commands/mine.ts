import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeMine(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Pure RNG mining node table
  const roll = Math.random();
  let materialDrop = '';
  let dropQuantity = 0;
  let flavorText = '';

  if (roll > 0.95) {
    materialDrop = 'mythril_ore';
    dropQuantity = 1;
    flavorText = 'You struck a glowing blue vein and extracted a chunk of ✨ **Mythril Ore**!';
  } else if (roll > 0.6) {
    materialDrop = 'iron_ore';
    dropQuantity = Math.floor(Math.random() * 3) + 1;
    flavorText = `Your pickaxe hit solid rock. You extracted **${dropQuantity} Iron Ore**.`;
  } else {
    materialDrop = 'stone';
    dropQuantity = Math.floor(Math.random() * 5) + 1;
    flavorText = `You chiseled away at some rubble and gathered **${dropQuantity} Stone**.`;
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
    .setTitle('⛏️ Mining Resolved')
    .setColor(0x808080)
    .setDescription(flavorText)
    .addFields({ name: 'Rewards', value: `+${dropQuantity} ${materialDrop.replace('_', ' ').toUpperCase()}, +2 EXP`});

  return message.reply({ embeds: [embed] });
}
