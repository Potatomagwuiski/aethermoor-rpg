import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';
import { calculateBuildArchitecture, getWeaponSlotModifierString } from '../utils/stats.js';
import { BLUEPRINTS } from './forge.js';
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
      tools: { where: { equipped: true } },
      pets: { where: { equipped: true } }
    }
  });

  if (!player) {
    if (targetId === message.author.id) {
      return message.reply('You do not exist in the database. Type `rpg start` to begin.');
    } else {
      return message.reply(`That player has not stepped into Aethermoor yet.`);
    }
  }

  // Build the massive embed
  const embed = new EmbedBuilder()
    .setTitle(`🌟 ${player.name}'s Profile`)
    .setColor(0x9B59B6)
    .setThumbnail(targetUser.displayAvatarURL())
    .setDescription(`**Level:** ${player.level} (${player.xp} / ${player.level * 100} XP)\n**Health:** ❤️ ${Math.max(0, player.hp)} / ${player.maxHp}\n**Wealth:** 🪙 ${player.gold} Gold\n\n**Core Attributes** (🌟 ${player.pointsAvailable} Unspent)\n💪 \`${player.str}\` STR  |  🏃 \`${player.agi}\` AGI  |  🧠 \`${player.int}\` INT  |  🛡️ \`${player.end}\` END`);

  // Parse Equipment
  let gearText = '';
  if (player.equipment.length === 0) gearText = '*No weapons or armor equipped.*';
  else {
    player.equipment.forEach(gear => {
      const emoji = getEmoji(gear.baseItemKey);
      
      let extra = '';
      if (gear.slot === 'WEAPON') {
          const bp = BLUEPRINTS[gear.baseItemKey];
          let activeAbilities: string[] = [];
          if (bp && bp.abilities) {
              const rarity = gear.rarity.toLowerCase();
              if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 0) activeAbilities.push(bp.abilities[0]);
              if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 1) activeAbilities.push(bp.abilities[1]);
              if (['rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 2) activeAbilities.push(bp.abilities[2]);
              if (['epic', 'legendary'].includes(rarity) && bp.abilities.length > 3) activeAbilities.push(bp.abilities[3]);
              if (['legendary'].includes(rarity) && bp.abilities.length > 4) activeAbilities.push(bp.abilities[4]);
          }
          const slotTag = getWeaponSlotModifierString(gear.name || '', activeAbilities);
          if (slotTag) extra = ` ${slotTag}`;
      }

      gearText += `• ${emoji} **${gear.name}** (+${gear.bonusAtk}⚔️ | +${gear.bonusDef}🛡️)${extra}\n`;
    });
  }
  embed.addFields({ name: '⚔️ Equipped Gear', value: gearText });

  const buildData = calculateBuildArchitecture(player);
  embed.addFields({ name: '💠 Build Architecture', value: buildData.buildIdentity });

  if (player.activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
      embed.addFields({ 
          name: '🍺 Active Buffs', 
          value: `> **${player.activeBuff.replace(/_/g, ' ')}**\n> Expires: <t:${Math.floor(player.buffExpiresAt.getTime() / 1000)}:R>` 
      });
  }

  // Parse Tools
  let toolsText = '';
  if (player.tools.length === 0) toolsText = '*No gathering tools equipped.*';
  else {
    player.tools.forEach(tool => {
      toolsText += `• **${tool.name}** (x${tool.yieldMultiplier} Yield)\n`;
    });
  }
  embed.addFields({ name: '⛏️ Gathering Tools', value: toolsText });


  embed.setFooter({ text: 'Tip: Use `rpg stat` to view detailed attributes or `rpg inv` to view your items.' });

  return message.reply({ embeds: [embed] });
}
