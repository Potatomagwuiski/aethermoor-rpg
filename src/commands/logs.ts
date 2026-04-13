import { Message, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';

export async function handleLogsList(message: Message) {
  const recentLogs = await prisma.combatLog.findMany({
    where: { userId: message.author.id },
    orderBy: { createdAt: 'desc' },
    take: 15
  });

  if (recentLogs.length === 0) {
    return message.reply("You have no combat logs recorded yet. Type `rpg fight boss` to clash!");
  }

  const lines = recentLogs.map(log => 
    `\`[ID: ${log.id}]\` **vs ${log.enemyName}** | ${log.outcome} in ${log.duration} Ticks`
  );

  const embed = new EmbedBuilder()
    .setTitle("Your Recent Combat Timelines")
    .setColor(0x34495e)
    .setDescription(lines.join('\n'))
    .setFooter({ text: "Use 'rpg logs get <ID>' to download a full analysis." });

  await message.reply({ embeds: [embed] });
}

export async function handleLogsGet(message: Message, logIdMatch: string) {
  const logId = parseInt(logIdMatch, 10);
  if (isNaN(logId)) return message.reply("Invalid Log ID! Format: `rpg logs get 123`");

  const logEntry = await prisma.combatLog.findUnique({
    where: { id: logId }
  });

  if (!logEntry) return message.reply(`Could not find a log with ID ${logId}.`);
  if (logEntry.userId !== message.author.id) return message.reply("You cannot peek into another player's timeline.");

  const buffer = Buffer.from(logEntry.content, 'utf8');
  const attachment = new AttachmentBuilder(buffer, { name: `combat_log_${logId}.txt` });

  await message.reply({ 
    content: `Here is the full tick-by-tick timeline parsing of your encounter with **${logEntry.enemyName}**.`, 
    files: [attachment] 
  });
}
