import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { MATERIALS } from '../game/materials';
import { GEAR } from '../game/gear';

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

  const embed = new EmbedBuilder()
    .setTitle(`🎒 Inventory [${items.length}/50]`)
    .setColor('#e67e22') // Orange layout
    .setFooter({ text: 'Aethermoor Inventory System' });

  if (items.length === 0) {
    embed.setDescription('*Your pockets are completely empty. Type `rpg gather` to scavenge materials.*');
  } else {
    let inventoryText = '';
    for (const item of items) {
      const matDetails = MATERIALS[item.baseItemId];
      const gearDetails = GEAR[item.baseItemId];
      
      if (matDetails) {
        inventoryText += `${matDetails.emoji} **${matDetails.name}** \`x${item.quantity}\`\n`;
      } else if (gearDetails) {
        inventoryText += `${gearDetails.emoji} **${gearDetails.name}** \`x${item.quantity}\`\n`;
      } else {
        inventoryText += `❓ **Unknown Item (${item.baseItemId})** \`x${item.quantity}\`\n`;
      }
    }
    embed.setDescription(inventoryText.trim());
  }

  return message.reply({ embeds: [embed] });
}
