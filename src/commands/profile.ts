import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeProfile(message: Message, args: string[]) {
  // If args[0] exists, try to look up another player by ping!
  let targetId = message.author.id;
  let targetUser = message.author;
  
  if (args.length > 0) {
    const mentionMatch = args[0].match(/<@!?(\d+)>/);
    if (mentionMatch) {
      targetId = mentionMatch[1];
      const fetchedUser = message.client.users.cache.get(targetId);
      if (fetchedUser) targetUser = fetchedUser;
    }
  }

  const player = await prisma.player.findUnique({
    where: { discordId: targetId },
    include: {
      inventory: true,
      equipment: { where: { equipped: true } },
      tools: { where: { equipped: true } }
    }
  });

  if (!player) {
    if (targetId === message.author.id) {
      return message.reply('You do not exist in the database. Type `rpg start <class>` to begin.');
    } else {
      return message.reply(`That player has not stepped into Aethermoor yet.`);
    }
  }

  // Build the massive embed
  const embed = new EmbedBuilder()
    .setTitle(`🌟 ${player.name}'s Profile`)
    .setColor(0x9B59B6)
    .setThumbnail(targetUser.displayAvatarURL())
    .setDescription(`**Class:** ${player.activeClass}\n**Level:** ${player.level} (${player.xp} / ${player.level * 100} XP)\n**Health:** ❤️ ${Math.max(0, player.hp)} / ${player.maxHp}\n**Wealth:** 🪙 ${player.gold} Gold`);

  // Parse Equipment
  let gearText = '';
  if (player.equipment.length === 0) gearText = '*No weapons or armor equipped.*';
  else {
    player.equipment.forEach(gear => {
      gearText += `• [${gear.rarity}] **${gear.baseItemKey.toUpperCase()}** (+${gear.bonusAtk} ATK | +${gear.bonusDef} DEF)\n`;
    });
  }
  embed.addFields({ name: '⚔️ Equipped Gear', value: gearText });

  // Parse Tools
  let toolsText = '';
  if (player.tools.length === 0) toolsText = '*No gathering tools equipped.*';
  else {
    player.tools.forEach(tool => {
      toolsText += `• [${tool.rarity}] **${tool.type}** (x${tool.yieldMultiplier} Yield)\n`;
    });
  }
  embed.addFields({ name: '⛏️ Gathering Tools', value: toolsText });

  // Backpack Preview (Top 10 Items by Quantity)
  const sortedInventory = player.inventory.sort((a, b) => b.quantity - a.quantity);
  const topItems = sortedInventory.slice(0, 10);
  let invText = '';
  
  if (topItems.length === 0) invText = '*Inventory is completely empty.*';
  else {
    topItems.forEach(item => {
      // Basic formatting to look pretty
      const prettyKey = item.itemKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      invText += `\`x${item.quantity}\` **${prettyKey}**\n`;
    });
    if (sortedInventory.length > 10) {
      invText += `\n*...and ${sortedInventory.length - 10} more item types.* Use \`rpg inv\` to see everything.`;
    }
  }
  
  embed.addFields({ name: '🎒 Backpack Preview', value: invText });

  embed.setFooter({ text: 'Tip: Use `rpg stat` to view attributes & `rpg inv` for full item list!' });

  return message.reply({ embeds: [embed] });
}
