import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeInventory(message: Message, args: string[]) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
      inventory: true
    }
  });

  if (!player) {
    return message.reply('You belong to the void. Type `rpg start <class>` to begin.');
  }

  const sortedInventory = player.inventory.sort((a, b) => b.quantity - a.quantity);

  if (sortedInventory.length === 0) {
    return message.reply('🎒 Your inventory is completely empty. Go `rpg hunt` or `rpg chop` for loot!');
  }

  // Handle potential Discord pagination for huge inventories
  // For now, chunk it into fields of 20 items per field
  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${player.name}'s Inventory`)
    .setColor(0xCD853F)
    .setDescription(`Total Unique Items: **${sortedInventory.length}**\nGold Balance: **🪙 ${player.gold}**`);

  let currentBucket = '';
  let fieldCount = 1;

  for (let i = 0; i < sortedInventory.length; i++) {
    const item = sortedInventory[i];
    const prettyKey = item.itemKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    const emoji = getEmoji(item.itemKey);
    currentBucket += `\`x${item.quantity.toString().padEnd(4)}\` ${emoji} **${prettyKey}**\n`;

    // Every 15 items, create a new Field block (Discord hard limit is 1024 chars per field value)
    if ((i + 1) % 15 === 0 || i === sortedInventory.length - 1) {
      embed.addFields({ name: `Page ${fieldCount}`, value: currentBucket, inline: true });
      currentBucket = '';
      fieldCount++;
    }

    if (fieldCount >= 20) {
      embed.setFooter({ text: 'Inventory too large. Showing top results.' });
      break; // Safe exit point preventing Discord API rejection on over-sized embeds
    }
  }

  return message.reply({ embeds: [embed] });
}
