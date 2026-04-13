import { prisma } from '../lib/prisma';
import { Message } from 'discord.js';

export async function handleStart(message: Message) {
  const existing = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (existing) {
    return message.reply("You have already started your journey! Try `rpg profile`.");
  }

  // Set them up with a random build logic or just standard "Assassin" for testing
  await prisma.user.create({
    data: {
      id: message.author.id,
      strength: 10,
      dexterity: 10,
      vitality: 10,
      intelligence: 10,
      stanceId: 'shadow_cloak',
      actionId: 'assassin_blade',
      reactionId: 'smoke_powder'
    }
  });

  message.reply("Welcome to your new deep-combat journey! You have been equipped with the basic Assassin loadout. Use `rpg profile` to see your stats, and `rpg pve` to test your mettle!");
}
