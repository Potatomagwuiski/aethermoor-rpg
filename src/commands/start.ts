import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';
import { getMap } from '../game/maps';

export async function handleStart(message: Message) {
  const userId = message.author.id;

  // 1. Check if they already exist
  const existingUser = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (existingUser) {
    return message.reply("You are already on an adventure! Try exploring or typing `rpg gather`.");
  }

  // 2. Create the Account
  // The database schema automatically assigns the base 5 stats and 'whispering_woods'
  const newUser = await prisma.user.create({
    data: { id: userId }
  });

  // 3. Welcome Dialogue
  const startingMap = getMap(newUser.currentMapId);
  const welcomeText = `
**Welcome to Aethermoor!**
You awaken in ${startingMap?.emoji || '🌲'} **${startingMap?.name || 'The Whispering Woods'}** with nothing but the clothes on your back. 

The path ahead is dangerous, but the rewards are eternal. To survive, you must scavenge materials to forge your first weapon.

➡️ **Tip:** Type \`rpg gather\` to scavenge the surrounding area.
  `.trim();

  return message.reply(welcomeText);
}
