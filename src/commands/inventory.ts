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
            embed.addFields({ name: `Page ${fieldCount}`, value: currentBucket, inline: false });
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
            embed.addFields({ name: `Page ${fieldCount}`, value: currentBucket, inline: false });
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

  // --- DEFAULT MATERIALS INVENTORY (CATEGORICAL VIEW) ---
  const validInventory = player.inventory
    .filter(i => i.quantity > 0)
    .sort((a, b) => b.quantity - a.quantity);

  if (validInventory.length === 0) {
    return message.reply('🎒 Your bag is completely empty. Go `rpg hunt` or `rpg chop` for loot!');
  }

  const embed = new EmbedBuilder()
    .setTitle(`🎒 ${player.name}'s Material Inventory`)
    .setColor(0xCD853F)
    .setDescription(`Total Unique Materials: **${validInventory.length}**\nGold Balance: **🪙 ${player.gold}**\n\n*Tip: Use \`rpg inv equipment\` or \`rpg inv tools\` to see non-stackables!*`);

  const categories: Record<string, string[]> = {
    '🛠️ Blueprints': [],
    '⛏️ Ores & Minerals': [],
    '🪓 Flora & Organic': [],
    '🐻 Monster Drops': [],
    '🎣 Fishing & Food': [],
    '✨ Relics & Consumables': [],
    '🎒 Miscellaneous': []
  };

  for (const item of validInventory) {
      const key = item.itemKey.toLowerCase();
      const prettyKey = item.itemKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
      const emoji = getEmoji(item.itemKey);
      
      const line = `\`x${item.quantity.toString().padEnd(3)}\` ${emoji} **${prettyKey}**`;
      
      if (key.includes('blueprint')) categories['🛠️ Blueprints'].push(line);
      else if (key.match(/(ore|coal|iron|copper|tin|gold|stone|ingot|metal)/)) categories['⛏️ Ores & Minerals'].push(line);
      else if (key.match(/(wood|stick|herb|mushroom|berry|seaweed|potato|wheat|bark)/)) categories['🪓 Flora & Organic'].push(line);
      else if (key.match(/(pelt|ear|gel|wing|bone|horn|scale)/)) categories['🐻 Monster Drops'].push(line);
      else if (key.match(/(fish|trout|koi|eel|sashimi|stew|filet|feast|brew)/)) categories['🎣 Fishing & Food'].push(line);
      else if (key.match(/(key|soul|egg|stone|lootbox|premium|lumina|potion)/)) categories['✨ Relics & Consumables'].push(line);
      else categories['🎒 Miscellaneous'].push(line);
  }

  let totalFields = 0;

  for (const [catName, lines] of Object.entries(categories)) {
      if (lines.length === 0) continue;
      
      let chunk = '';
      let part = 1;
      
      for (let i = 0; i < lines.length; i++) {
          if (chunk.length + lines[i].length + 5 > 1000 || (i > 0 && i % 10 === 0)) { 
              embed.addFields({ name: `${catName} (Part ${part})`, value: chunk, inline: true });
              totalFields++;
              chunk = '';
              part++;
          }
          chunk += lines[i] + '\n';
      }
      
      if (chunk.length > 0) {
          const header = part > 1 ? `${catName} (Part ${part})` : catName;
          if (totalFields < 24) { 
             embed.addFields({ name: header, value: chunk, inline: true });
             totalFields++;
          } else {
             break;
          }
      }
      
      if (totalFields >= 24) break;
  }
  
  if (totalFields >= 24) {
      embed.setFooter({ text: 'Inventory too large. Showing top categories/results.' });
  }

  return message.reply({ embeds: [embed] });
}
