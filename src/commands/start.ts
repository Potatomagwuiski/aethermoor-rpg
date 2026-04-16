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
      gold: 100,
      hp: 100,
      maxHp: 100,
      lastHuntMillis: 0n,
      statPoints: 5,
      str: 10,
      dex: 10,
      int: 10,
      vit: 10,
      equipment: {
        create: {}
      }
    },
  });

  const embed = new EmbedBuilder()
    .setColor('#F1C40F')
    .setTitle('Welcome to Aethermoor RPG!')
    .setDescription(`Your journey begins now, <@${discordId}>!\n\nYou have been granted **🪙 100 Gold** as a starting stipend.\nHead over to the \`rpg shop\` to purchase a structural weapon and armor configuration before venturing into the wilds!\n\n*(Type \`rpg hunt\` to begin your adventure and earn more XP and Gold)*`)
    .setThumbnail(message.author.displayAvatarURL());

  await message.reply({ embeds: [embed] });
}
