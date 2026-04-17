import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeInventory(message: Message) {
  const discordId = message.author.id;
  const playerInfo = await prisma.player.findUnique({
    where: { discordId },
    include: {
      inventory: {
        include: { item: true }
      }
    }
  });

  if (!playerInfo) {
    return message.reply('You do not have a profile yet! Use `rpg start`.');
  }

  const items = playerInfo.inventory;

  const embed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle(`Inventory: ${message.author.username}`)
    .setThumbnail(message.author.displayAvatarURL());

  if (items.length === 0) {
    embed.setDescription('Your bags feel extremely light... You currently hold nothing.');
  } else {
    // Map items to description strings
    const desc = items.map(invItem => {
      const it = invItem.item;
      // Show rarity
      let rarityEmoji = '🔸';
      if (it.rarity === 'Epic') rarityEmoji = '🟣';
      if (it.rarity === 'Legendary') rarityEmoji = '🟡';
      if (it.rarity === 'Rare') rarityEmoji = '🔵';
      if (it.rarity === 'Uncommon') rarityEmoji = '🟢';
      
      let passiveDetail = '';
      const passArr = typeof it.passives === 'string' ? JSON.parse(it.passives) : it.passives;
      if (Array.isArray(passArr) && passArr.length > 0) {
          passiveDetail = `\n     *Passives: ${passArr.join(', ')}*`;
      }
      
      const modifiersObj = typeof it.modifiers === 'string' ? JSON.parse(it.modifiers) : it.modifiers;
      let statsDetail = '';
      if (modifiersObj && typeof modifiersObj === 'object') {
        const stats = Object.entries(modifiersObj).map(([k, v]) => `${k}: +${v}`).join(', ');
        if (stats) statsDetail = `\n     *Stats: ${stats}*`;
      }

      let baseDetail = '';
      if (it.baseDamage) baseDetail += ` \`DMG: ${it.baseDamage}\``;
      if (it.baseArmor) baseDetail += ` \`AR: ${it.baseArmor}\``;

      return `${rarityEmoji} **${it.name}** ${baseDetail}\n     ID: \`${it.id}\` (x${invItem.amount})\n     *Slot: ${it.slot}*${statsDetail}${passiveDetail}`;
    }).join('\n\n');
    
    embed.setDescription(desc || 'No items to display.');
  }

  await message.reply({ embeds: [embed] });
}
