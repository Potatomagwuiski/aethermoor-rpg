import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeReset(message: Message, args: string[]) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('You do not have a character to reset! Type `rpg start` to begin.');
  }

  // To prevent Prisma foreign key errors, we manually delete child records first
  await prisma.$transaction([
    prisma.inventoryItem.deleteMany({
      where: { playerId: player.id }
    }),
    prisma.player.delete({
      where: { id: player.id }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle('⚠️ ACCOUNT ANNIHILATED ⚠️')
    .setColor(0xFF0000)
    .setDescription('Your character, your gold, your inventory, and your legacy have been entirely erased from the timeline.\n\nYou are a blank slate. Type `rpg start` to begin anew.');

  return message.reply({ embeds: [embed] });
}
