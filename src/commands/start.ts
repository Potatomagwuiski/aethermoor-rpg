import { prisma } from '../lib/prisma';
import { Message } from 'discord.js';

export async function handleStart(message: Message) {
  const existing = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (existing) {
    return message.reply("You have already started your journey! Try `rpg profile`.");
  }

  await prisma.user.create({
    data: {
      id: message.author.id,
      strength: 10,
      dexterity: 10,
      vitality: 10,
      intelligence: 10,
      
      // Default Base Gear
      equipChest: 'shadow_cloak',
      equipMainHand: 'assassin_blade',
      equipOffHand: 'smoke_bomb'
    }
  });

  message.reply("Welcome to your new Aethermoor journey! Your soul has bound physical form. Use `rpg profile` to see your stats, and `rpg hunt` to grind your first encounters!");
}
