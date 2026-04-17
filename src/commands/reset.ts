import { Message } from 'discord.js';
import { prisma } from '../db';

export async function executeReset(message: Message, args: string[]) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
  });

  if (!player) {
    return message.reply("You don't have a profile to reset. Use `rpg start` to create one!");
  }

  if (args[0] !== 'confirm') {
    return message.reply("⚠️ **WARNING:** This will permanently delete your character, all stats, equipment, inventory, and combat logs. To proceed, type `rpg reset confirm`.");
  }

  try {
    // Delete all related records first to satisfy foreign key constraints
    await prisma.$transaction([
      prisma.equipment.deleteMany({ where: { playerId: discordId } }),
      prisma.inventoryItem.deleteMany({ where: { playerId: discordId } }),
      prisma.combatLog.deleteMany({ where: { playerId: discordId } }),
      prisma.player.delete({ where: { discordId } })
    ]);

    return message.reply("♻️ Your profile has been completely reset. You can start over with `rpg start`.");
  } catch (error) {
    console.error("Failed to reset player:", error);
    return message.reply("❌ An error occurred while trying to reset your profile.");
  }
}
