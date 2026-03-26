import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeFarm(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Pure RNG farming node table
  const roll = Math.random();
  let materialDrop = '';
  let dropQuantity = 0;
  let flavorText = '';

  if (roll > 0.95) {
    materialDrop = 'moon_herb';
    dropQuantity = 1;
    flavorText = 'You harvested a delicate, luminescent flower: a ✨ **Moon Herb**!';
  } else if (roll > 0.6) {
    materialDrop = 'potato';
    dropQuantity = Math.floor(Math.random() * 3) + 1;
    flavorText = `You dug through the dirt and pulled out **${dropQuantity} Potatoes**.`;
  } else {
    materialDrop = 'wheat';
    dropQuantity = Math.floor(Math.random() * 5) + 1;
    flavorText = `You scythed down tall grass and gathered **${dropQuantity} sheaves of Wheat**.`;
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
    .setTitle('🌾 Farming Resolved')
    .setColor(0x32CD32) // LimeGreen
    .setDescription(flavorText)
    .addFields({ name: 'Rewards', value: `+${dropQuantity} ${materialDrop.replace('_', ' ').toUpperCase()}, +2 EXP`});

  return message.reply({ embeds: [embed] });
}
