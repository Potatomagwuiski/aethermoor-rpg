import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';
import { compilePlayerStats } from '../utils/stats';

export async function executeProfile(message: Message) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
      equipment: {
        include: {
          mainHand: true, offHand: true, helmet: true, chest: true, gloves: true, boots: true, cloak: true, ring1: true, ring2: true, amulet: true
        }
      }
    }
  });

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start`.');
  }

  const cStats = compilePlayerStats(player);

  const embed = new EmbedBuilder()
    .setColor('#3498DB')
    .setTitle(`${message.author.username}'s Profile (Lvl ${player.level})`)
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
       { name: '❤️ HP', value: `${player.hp} / ${cStats.maxHp}`, inline: true },
       { name: '✨ XP', value: `${player.xp} / ${player.level * 100}`, inline: true },
       { name: '🪙 Gold', value: `${player.gold}`, inline: true },
       { name: '--- Core Attributes ---', value: `**STR:** ${cStats.str}  |  **DEX:** ${cStats.dex}  |  **INT:** ${cStats.int}  |  **VIT:** ${cStats.vit}\n*Available Stat Points: ${player.statPoints}*`, inline: false },
       { name: '--- Combat Ratings ---', value: `🗡️ **Damage:** ${cStats.minDamage} - ${cStats.maxDamage}\n🛡️ **Armor:** ${cStats.armor} | 💨 **Evasion:** ${cStats.evasion}%\n💥 **Crit Chance:** ${cStats.critChance}% (*x${cStats.critMultiplier}*)`, inline: false }
    );

    // Resistances
    const resists = `🔥 Fire: ${cStats.rFire}% | ❄️ Cold: ${cStats.rCold}% | ⚡ Lightning: ${cStats.rLightning}%\n🧪 Poison: ${cStats.rPoison}% | 🌟 Holy: ${cStats.rHoly}% | 🟢 Acid: ${cStats.rAcid}%`;
    embed.addFields({ name: '--- Elemental Resistances ---', value: resists, inline: false });

    if (cStats.passives && cStats.passives.length > 0) {
      embed.addFields({ name: '--- Active Passives ---', value: cStats.passives.map(p => `• \`${p}\``).join('\n'), inline: false });
    }

    // Equipment 
    const eq = player.equipment;
    let gearText = '';
    const map = [
      { key: 'helmet', label: 'Helmet' },
      { key: 'amulet', label: 'Amulet' },
      { key: 'chest', label: 'Chest' },
      { key: 'cloak', label: 'Cloak' },
      { key: 'gloves', label: 'Gloves' },
      { key: 'mainHand', label: 'Main Hand' },
      { key: 'offHand', label: 'Off Hand' },
      { key: 'ring1', label: 'Ring 1' },
      { key: 'ring2', label: 'Ring 2' },
      { key: 'boots', label: 'Boots' },
    ];
    for (const slot of map) {
      if (eq && (eq as any)[slot.key]) {
        const item = (eq as any)[slot.key];
        const r = item.rarity;
        let rarityEmoji = '🔸';
        if (r === 'Epic') rarityEmoji = '🟣';
        if (r === 'Legendary') rarityEmoji = '🟡';
        if (r === 'Rare') rarityEmoji = '🔵';
        if (r === 'Uncommon') rarityEmoji = '🟢';

        gearText += `**${slot.label}:** ${rarityEmoji} ${item.name}\n`;
      } else {
        gearText += `**${slot.label}:** *Empty*\n`;
      }
    }
    
    embed.addFields({ name: '--- 10-Slot Loadout ---', value: gearText, inline: false });

  await message.reply({ embeds: [embed] });
}
