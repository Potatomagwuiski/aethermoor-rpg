import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';

export async function handleProfile(message: Message) {
  const userId = message.author.id;
  const username = message.author.username;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return message.reply("> ⚠️ **Hold on!**\n> You haven't started your journey yet! Type `rpg start` to begin.");
  }

  const formatSlot = (slot: string | null) => slot ? `[ Equipped ]` : `[ Empty ]`;

  const embed = new EmbedBuilder()
    .setTitle(`👤 ${username.toUpperCase()}'S PROFILE`)
    .setColor('#3498db') // A sleek blue hex color
    .addFields(
      { name: '🏅 Progression', value: `**Level:** ${user.level} | **XP:** ${user.xp}`, inline: true },
      { name: '💰 Wealth', value: `**Gold:** ${user.gold}g`, inline: true },
      { name: '📊 Attributes', value: `\`STR: ${user.str}\` | \`DEX: ${user.dex}\` | \`VIT: ${user.vit}\` | \`AGI: ${user.agi}\` | \`INT: ${user.int}\``, inline: false },
      { name: '⚔️ Loadout', value: `**Weapon:** ${formatSlot(user.weaponId)}\n**Armor:** ${formatSlot(user.armorId)}\n**Helmet:** ${formatSlot(user.helmetId)}\n**Boots:** ${formatSlot(user.bootsId)}\n**Gloves:** ${formatSlot(user.glovesId)}\n**Amulet:** ${formatSlot(user.amuletId)}\n**Ring 1:** ${formatSlot(user.ring1Id)}\n**Ring 2:** ${formatSlot(user.ring2Id)}`, inline: false }
    )
    .setFooter({ text: 'Aethermoor RPG Dashboard' });

  return message.reply({ embeds: [embed] });
}
