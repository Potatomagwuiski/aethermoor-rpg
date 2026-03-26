import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeInventory(message: Message, args: string[]) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
      inventory: true,
      equipment: true,
      tools: true
    }
  });

  if (!player) {
    return message.reply('You belong to the void. Type `rpg start` to begin.');
  }

  const subCommand = args[0] ? args[0].toLowerCase() : 'items';

  if (subCommand === 'equipment' || subCommand === 'gear' || subCommand === 'eq') {
    if (player.equipment.length === 0) {
      return message.reply(`🛡️ Your gear locker is empty. Try \`rpg forge\`!`);
    }
    const embed = new EmbedBuilder()
      .setTitle(`🛡️ ${player.name}'s Equipment Vault`)
      .setColor(0x00FF00)
      .setDescription('Use `rpg equip <ID>` or `rpg equip <name>` to equip an item.');

    let currentBucket = '';
    let fieldCount = 1;
    for (let i = 0; i < player.equipment.length; i++) {
        const item = player.equipment[i];
        const emoji = getEmoji(item.baseItemKey);
        const uuidTail = item.id.substring(0, 6);
        const equipLabel = item.equipped ? ' **[EQUIPPED]**' : '';
        currentBucket += `\`${uuidTail}\` ${emoji} **${item.name}** (+${item.bonusAtk}⚔️ | +${item.bonusDef}🛡️)${equipLabel}\n`;

        if ((i + 1) % 15 === 0 || i === player.equipment.length - 1) {
            embed.addFields({ name: `Page ${fieldCount}`, value: currentBucket, inline: true });
            currentBucket = '';
            fieldCount++;
        }
        if (fieldCount >= 20) {
            embed.setFooter({ text: 'Inventory too large. Showing top results.' });
            break;
        }
    }
    return message.reply({ embeds: [embed] });
  }

  if (subCommand === 'tools') {
    if (player.tools.length === 0) {
      return message.reply(`⛏️ Your toolbelt is empty. Try \`rpg forge\`!`);
    }
    const embed = new EmbedBuilder()
      .setTitle(`⛏️ ${player.name}'s Toolbelt Vault`)
      .setColor(0xE67E22)
      .setDescription('Use `rpg equip <ID>` or `rpg equip <name>` to equip a tool.');

    let currentBucket = '';
    let fieldCount = 1;
    for (let i = 0; i < player.tools.length; i++) {
        const item = player.tools[i];
        // Tools don't natively map to emojis directly via baseItemKey since they don't have one in schema yet,
        // but their name contains the emoji natively (e.g. ⬜ [Common Bronze Pickaxe]).
        const uuidTail = item.id.substring(0, 6);
        const equipLabel = item.equipped ? ' **[EQUIPPED]**' : '';
        currentBucket += `\`${uuidTail}\` **${item.name}** (x${item.yieldMultiplier} Yield)${equipLabel}\n`;

        if ((i + 1) % 15 === 0 || i === player.tools.length - 1) {
            embed.addFields({ name: `Page ${fieldCount}`, value: currentBucket, inline: true });
            currentBucket = '';
            fieldCount++;
        }
        if (fieldCount >= 20) {
            embed.setFooter({ text: 'Inventory too large. Showing top results.' });
            break;
        }
    }
    return message.reply({ embeds: [embed] });
  }

  // --- DEFAULT MATERIALS INVENTORY ---
  const sortedInventory = player.inventory.sort((a, b) => b.quantity - a.quantity);

  if (sortedInventory.length === 0) {
    return message.reply('🎒 Your inventory is completely empty. Go `rpg hunt` or `rpg chop` for loot!');
  }

  // Handle potential Discord pagination for huge inventories
  // For now, chunk it into fields of 20 items per field
  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${player.name}'s Material Inventory`)
    .setColor(0xCD853F)
    .setDescription(`Total Unique Materials: **${sortedInventory.length}**\nGold Balance: **🪙 ${player.gold}**\n\n*Tip: Use \`rpg inv equipment\` or \`rpg inv tools\` to see non-stackables!*`);

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
