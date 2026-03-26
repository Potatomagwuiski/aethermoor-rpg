import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeStat(message: Message, commandName: string, args: string[]) {
  const discordId = message.author.id;
  
  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('You belong to the void. Type `rpg start <class>` to manifest a physical form.');
  }

  // View Stats Dashboard
  if (commandName === 'stat' || commandName === 'stats') {
    if (args.length === 0) {
      const embed = new EmbedBuilder()
        .setTitle(`📊 Stats: ${player.name} (Level ${player.level})`)
        .setColor(0x00B0FF)
        .setDescription(`**Next Level:** ${player.xp} / ${player.level * 100} XP\n**Available Points:** 🌟 ${player.pointsAvailable}\n**Health:** ❤️ ${Math.max(0, player.hp)} / ${player.maxHp} HP`)
        .addFields(
          { name: '💪 STR', value: player.str.toString(), inline: true },
          { name: '🏃 AGI', value: player.agi.toString(), inline: true },
          { name: '🧠 INT', value: player.int.toString(), inline: true },
          { name: '🛡️ END', value: player.end.toString(), inline: true }
        )
        .setFooter({ text: 'To spend points, type: `rpg <str/agi/int/end> <amount>`' });
        
      return message.reply({ embeds: [embed] });
    }

    // backwards compatibility for `rpg stat add str 5`
    if (args[0] === 'add') {
      commandName = args[1]?.toLowerCase();
      args = [args[2] || '1'];
    }
  }

  // Stat allocation logic
  const validStats = ['str', 'agi', 'int', 'end'];
  if (validStats.includes(commandName)) {
    const attribute = commandName;
    const amount = parseInt(args[0]) || 1;

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

    // Determine Emoji for the embed
    const emojiMap: any = {
      'str': '💪',
      'agi': '🏃',
      'int': '🧠',
      'end': '🛡️'
    };
    const statNameMap: any = {
      'str': 'Strength',
      'agi': 'Agility',
      'int': 'Intelligence',
      'end': 'Endurance'
    };

    const embed = new EmbedBuilder()
      .setTitle(`🌟 Stat Allocation Successful`)
      .setColor(0x00FF00)
      .setDescription(`You channeled your inner energy and permanently enhanced your physiological form.\n\n**Invested:** \`+${amount}\` ${emojiMap[attribute]} **${statNameMap[attribute]}**\n**Remaining Unspent Points:** 🌟 \`${player.pointsAvailable - amount}\``);

    return message.reply({ embeds: [embed] });
  }

  return message.reply('❓ **Unknown stat subcommand.** Try `rpg stat` or `rpg <str/agi/int/end> <amount>`.');
}
