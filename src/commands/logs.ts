import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeLogs(message: Message, args: string[]) {
  const discordId = message.author.id;

  if (args.length > 0 && args[0] === 'get') {
    const logId = parseInt(args[1], 10);
    if (isNaN(logId)) {
        return message.reply('Please provide a valid numeric log ID: `rpg logs get 5`');
    }

    const log = await prisma.combatLog.findFirst({
        where: { id: logId, playerId: discordId }
    });

    if (!log) {
        return message.reply('No combat log found with that ID or you do not own it.');
    }

    // Discord has a 4096 character limit for Embed Descriptions, we might need to chunk it, but 5 rounds shouldn't exceed it.
    const logEmbed = new EmbedBuilder()
        .setColor('#8E44AD')
        .setTitle(`Combat Archive #${log.id}: vs ${log.target}`)
        .setDescription('```markdown\n' + log.logText.substring(0, 4000) + '\n```')
        .setFooter({ text: `Result: ${log.result} | Timestamp: ${log.createdAt.toLocaleString()}` });

    return message.reply({ embeds: [logEmbed] });
  }

  // Fetch the last 15 logs
  const logs = await prisma.combatLog.findMany({
      where: { playerId: discordId },
      orderBy: { createdAt: 'desc' },
      take: 15
  });

  if (logs.length === 0) {
      return message.reply('You have no combat logs archived. Type `rpg hunt` to enter combat!');
  }

  const listEmbed = new EmbedBuilder()
      .setColor('#3498DB')
      .setTitle(`${message.author.username}'s Combat Log Archive`)
      .setDescription('Use `rpg logs get [ID]` to view the detailed mathematical transcript of a simulated fight.\n\n' + 
      logs.map(l => {
          const resIcon = l.result === 'Win' ? '🟢' : (l.result === 'Loss' ? '🔴' : '⚪');
          return `**ID: ${l.id}** | ${resIcon} vs ${l.target} - *${l.createdAt.toLocaleDateString()}*`;
      }).join('\n'));

  return message.reply({ embeds: [listEmbed] });
}
