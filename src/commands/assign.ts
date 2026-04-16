import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeAssign(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({
    where: { discordId },
  });

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start`.');
  }

  if (args.length < 2) {
    return message.reply('Usage: `rpg assign <str/dex/int/vit> <amount>` - Example: `rpg assign str 5`');
  }

  const stat = args[0].toLowerCase();
  const amount = parseInt(args[1], 10);

  if (isNaN(amount) || amount <= 0) {
    return message.reply('Please provide a valid positive number for the amount.');
  }

  if (amount > player.statPoints) {
    return message.reply(`You do not have enough stat points! You currently have **${player.statPoints}** points.`);
  }

  const validStats = ['str', 'dex', 'int', 'vit'];
  if (!validStats.includes(stat)) {
    return message.reply('Invalid stat! Available stats are: `str`, `dex`, `int`, `vit`.');
  }

  const updateData: any = {
    statPoints: player.statPoints - amount,
  };
  updateData[stat] = (player as any)[stat] + amount;

  await prisma.player.update({
    where: { discordId },
    data: updateData,
  });

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Attributes Upgraded')
    .setDescription(`Successfully assigned **${amount}** points to **${stat.toUpperCase()}**!`)
    .addFields({ name: 'Remaining Points', value: `${updateData.statPoints}` });

  await message.reply({ embeds: [embed] });
}
