import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';
import { MATERIALS } from '../game/materials';

export async function handleInventory(message: Message) {
  const userId = message.author.id;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      inventory: true
    }
  });

  if (!user) {
    return message.reply("> ⚠️ **Hold on!**\n> You haven't started your journey yet! Type `rpg start` to begin.");
  }

  const items = user.inventory;

  if (items.length === 0) {
    return message.reply("> 🎒 **Inventory [0/50]**\n> \n> Your pockets are completely empty. Type `rpg gather` to scavenge materials.");
  }

  let inventoryText = `> 🎒 **Inventory [${items.length}/50]**\n> \n`;

  for (const item of items) {
    // If we have an external gear registry, we'd check that too. For now we just map materials.
    const matDetails = MATERIALS[item.baseItemId];
    
    if (matDetails) {
      inventoryText += `> ${matDetails.emoji} **${item.quantity}x ${matDetails.name}**\n`;
    } else {
      // Fallback if item ID doesn't exist in our config
      inventoryText += `> ❓ **${item.quantity}x Unknown Item (${item.baseItemId})**\n`;
    }
  }

  return message.reply(inventoryText.trim());
}
