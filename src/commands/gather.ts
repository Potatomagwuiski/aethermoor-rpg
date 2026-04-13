import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';
import { MATERIALS } from '../game/materials';

// 5 minutes in milliseconds
const GATHER_COOLDOWN_MS = 5 * 60 * 1000;

export async function handleGather(message: Message) {
  const userId = message.author.id;

  // 1. Authenticate / Fetch User
  let user = await prisma.user.findUnique({
    where: { id: userId }
  });

  // Provision user if they don't exist
  if (!user) {
    user = await prisma.user.create({
      data: { id: userId }
    });
  }

  // 2. Cooldown Check
  if (user.lastGather) {
    const timeSinceLastGather = Date.now() - user.lastGather.getTime();
    if (timeSinceLastGather < GATHER_COOLDOWN_MS) {
      const remainingMs = GATHER_COOLDOWN_MS - timeSinceLastGather;
      const remainingMinutes = Math.floor(remainingMs / 60000);
      const remainingSeconds = Math.floor((remainingMs % 60000) / 1000);
      
      return message.reply(`You are fatigued. You can gather again in **${remainingMinutes}m ${remainingSeconds}s**.`);
    }
  }

  // 3. RNG Core
  // Determine how many *types* of items we pull (between 1 and 3)
  const numTypes = Math.floor(Math.random() * 3) + 1;
  const availableMats = Object.values(MATERIALS);
  
  // Shuffle and pick
  availableMats.sort(() => Math.random() - 0.5);
  const gatheredMats = availableMats.slice(0, numTypes);

  let outputText = `You spent 5 minutes gathering the surrounding area and found:\n`;

  // 4. Update Database
  // Since Prisma upscale queries can be tedious with relations, we'll do them sequentially.
  for (const mat of gatheredMats) {
    // Generate a quantity based on rarity modifier
    const baseAmount = Math.floor(Math.random() * 15) + 5; // 5 to 19 roughly
    const quantity = Math.max(1, Math.floor(baseAmount * mat.dropChanceMultiplier));

    // Upsert equivalent for inventory: Find if user already has an unupgraded stack of this item
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

    outputText += `${mat.emoji} **${quantity}x ${mat.name}**\n`;
  }

  // Put user on cooldown
  await prisma.user.update({
    where: { id: user.id },
    data: { lastGather: new Date() }
  });

  // 5. Reply
  return message.reply(outputText);
}
