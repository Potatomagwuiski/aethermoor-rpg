import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeStat(message: Message, args: string[]) {
  const discordId = message.author.id;
  
  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('You belong to the void. Type `rpg start <class>` to manifest a physical form.');
  }

  // View Stats Dashboard
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle(`📊 Stats: ${player.name} (Level ${player.level})`)
      .setColor(0x00B0FF)
      .setDescription(`**Class:** ${player.activeClass}\n**Next Level:** ${player.xp} / ${player.level * 100} XP\n**Available Points:** 🌟 ${player.pointsAvailable}\n**Health:** ❤️ ${Math.max(0, player.hp)} / ${player.maxHp} HP`)
      .addFields(
        { name: '💪 STR', value: player.str.toString(), inline: true },
        { name: '🏃 AGI', value: player.agi.toString(), inline: true },
        { name: '🧠 INT', value: player.int.toString(), inline: true },
        { name: '🛡️ END', value: player.end.toString(), inline: true }
      )
      .setFooter({ text: 'To spend points, type: `rpg stat add <str/agi/int/end> <amount>`' });
      
    return message.reply({ embeds: [embed] });
  }

  // Stat Allocation Engine
  if (args[0] === 'add') {
    const attribute = args[1]?.toLowerCase();
    const amount = parseInt(args[2]) || 1;

    if (!['str', 'agi', 'int', 'end'].includes(attribute)) {
      return message.reply('❌ Invalid attribute! Available attributes: `str`, `agi`, `int`, `end`.');
    }

    if (player.pointsAvailable < amount || amount <= 0) {
      return message.reply(`❌ You do not have enough points! You have 🌟 ${player.pointsAvailable} available.`);
    }

    const updateData: any = {
      pointsAvailable: { decrement: amount }
    };
    updateData[attribute] = { increment: amount };

    await prisma.player.update({
      where: { id: player.id },
      data: updateData
    });

    return message.reply(`✅ Successfully infused **${amount}** points into **${attribute.toUpperCase()}**! Use \`rpg stat\` to view your new power.`);
  }

  return message.reply('❓ **Unknown stat subcommand.** Try `rpg stat` or `rpg stat add <str/agi/int/end> <amount>`.');
}
