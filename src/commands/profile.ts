import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeProfile(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
  });

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start` to begin your journey.');
  }

  const xpNeeded = player.level * 100;

  const embed = new EmbedBuilder()
    .setColor('#0099FF')
    .setTitle(`${message.author.username}'s Profile`)
    .setThumbnail(message.author.displayAvatarURL())
    .addFields(
      { name: 'Level', value: `${player.level}`, inline: true },
      { name: 'XP', value: `${player.xp} / ${xpNeeded}`, inline: true },
      { name: 'Gold', value: `${player.gold} 🪙`, inline: true },
      { name: 'Health', value: `${player.hp} / ${player.maxHp} ❤️`, inline: true }
    )
    .setFooter({ text: 'Aethermoor RPG' });

  await message.reply({ embeds: [embed] });
}
