import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';
import { MATERIALS, ProfessionCategory } from '../game/materials';

// 5 minutes in milliseconds shared cooldown for all gathering activities
const GATHER_COOLDOWN_MS = 5 * 60 * 1000;

export async function handleGather(message: Message) {
  const userId = message.author.id;

  // 1. Authenticate / Fetch User
  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return message.reply("> ⚠️ **Hold on!**\n> You haven't started your journey yet! Type `rpg start` to begin.");
  }

  // 2. Global Cooldown Check
  if (user.lastGather) {
    const timeSinceLastGather = Date.now() - user.lastGather.getTime();
    if (timeSinceLastGather < GATHER_COOLDOWN_MS) {
      const remainingMs = GATHER_COOLDOWN_MS - timeSinceLastGather;
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      
      return message.reply(`> 🥱 **You are fatigued.**\n> You can gather again in **${remainingMinutes}m ${remainingSeconds}s**.`);
    }
  }

  // 3. RNG Core
  const availableMats = Object.values(MATERIALS);
  
  // Determine how many *types* of items we pull: 1 or 2
  const numTypes = Math.min(availableMats.length, Math.floor(Math.random() * 2) + 1);
  
  // Fisher-Yates Shuffle for mathematically sound unbiased randomization
  for (let i = availableMats.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [availableMats[i], availableMats[j]] = [availableMats[j], availableMats[i]];
  }
  
  const gatheredMats = availableMats.slice(0, numTypes);

  let outputText = `> 🏕️ **Gathering Complete**\n> You spent 5 minutes scavenging the area and found:\n>\n`;

  // 4. Update Database
  for (const mat of gatheredMats) {
    const baseAmount = Math.floor(Math.random() * 15) + 5;
    const quantity = Math.max(1, Math.floor(baseAmount * mat.dropChanceMultiplier));

    const existingStack = await prisma.inventoryItem.findFirst({
      where: {
        userId: user.id,
        baseItemId: mat.id,
        upgradeTier: 0
      }
    });

    if (existingStack) {
      await prisma.inventoryItem.update({
        where: { id: existingStack.id },
        data: { quantity: existingStack.quantity + quantity }
      });
    } else {
      await prisma.inventoryItem.create({
        data: {
          userId: user.id,
          baseItemId: mat.id,
          upgradeTier: 0,
          quantity: quantity
        }
      });
    }

    outputText += `> ${mat.emoji} **${quantity}x ${mat.name}**\n`;
  }

  // Put user on global gathering cooldown
  await prisma.user.update({
    where: { id: user.id },
    data: { lastGather: new Date() }
  });

  // 5. Reply
  return message.reply(outputText);
}
