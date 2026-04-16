import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeStart(message: Message) {
  const discordId = message.author.id;

  // Check if player already exists
  const existingPlayer = await prisma.player.findUnique({
    where: { discordId },
  });

  if (existingPlayer) {
    return message.reply('You have already started your journey in Aethermoor!');
  }

  // Create new player
  await prisma.player.create({
    data: {
      discordId,
      level: 1,
      xp: 0,
      gold: 0,
      hp: 100,
      maxHp: 100,
      lastHuntMillis: 0,
    },
  });

  const embed = new EmbedBuilder()
    .setColor('#00FF00')
    .setTitle('Welcome to Aethermoor RPG!')
    .setDescription(`Your journey begins now, <@${discordId}>. You have been granted 100 HP to start. Type \`rpg hunt\` to begin your adventure and earn XP and Gold!`)
    .setThumbnail(message.author.displayAvatarURL());

  await message.reply({ embeds: [embed] });
}
