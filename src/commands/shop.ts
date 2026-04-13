import { Message, EmbedBuilder } from 'discord.js';
import { GEAR } from '../game/gear';

export async function handleShop(message: Message) {
  const allGear = Object.values(GEAR);
  
  const weapons = allGear.filter(g => g.slot === 'weapon');
  const armor = allGear.filter(g => g.slot !== 'weapon');

  const formatItem = (g: typeof allGear[0]) => {
    // Format stats string like "STR: 2 | AGI: 1"
    const statStrings = Object.entries(g.stats).map(([key, val]) => `${key.toUpperCase()}: ${val}`);
    const statText = statStrings.length > 0 ? ` [${statStrings.join(' | ')}]` : '';
    
    return `${g.emoji} **${g.name}** — 💰 ${g.price}g\n\`ID: ${g.id}\`${statText}`;
  };

  const embed = new EmbedBuilder()
    .setTitle('🏪 Aethermoor Merchant Shop')
    .setDescription('Welcome! Spend your hard-earned gold to equip yourself for the journey ahead.\nType `rpg buy <ID>` to purchase an item.')
    .setColor('#2ecc71') // Emerald green
    .addFields(
      { name: '⚔️ Weapons', value: weapons.map(formatItem).join('\n\n'), inline: false },
      { name: '🛡️ Armor & Accessories', value: armor.map(formatItem).join('\n\n'), inline: false }
    )
    .setFooter({ text: 'Aethermoor Economy System' });

  return message.reply({ embeds: [embed] });
}
