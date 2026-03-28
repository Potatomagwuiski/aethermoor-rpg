import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import redisClient from '../redis.js';
import { enforceCooldown } from '../utils/cooldown.js';

export const aliases = ['rest', 'campfire'];

export async function executeRest(message: Message) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) return message.reply(`You are but a whisper in the void. Type \`rpg start\`.`);
  if (player.hp >= player.maxHp) return message.reply(`🔥 You are already at maximum health! Get back into the fray!`);

  // Define 2-Minute (120s) Global Lockout
  const LOCKOUT_SECONDS = 120;
  
  // Set cooldowns on all Gathering and Combat nodes
  if (redisClient.isReady) {
    await redisClient.setEx(`cooldown:hunt:${discordId}`, LOCKOUT_SECONDS, '1');
    await redisClient.setEx(`cd:mine:${discordId}`, LOCKOUT_SECONDS, '1');
    await redisClient.setEx(`cd:chop:${discordId}`, LOCKOUT_SECONDS, '1');
    await redisClient.setEx(`cd:harvest:${discordId}`, LOCKOUT_SECONDS, '1');
    await redisClient.setEx(`cd:fish:${discordId}`, LOCKOUT_SECONDS, '1');
  }

  // Restore HP
  await prisma.player.update({
    where: { discordId },
    data: { hp: player.maxHp }
  });

  const embed = new EmbedBuilder()
    .setTitle('🔥 At The Campfire')
    .setColor(0xE67E22)
    .setDescription(`You sit by the fire and bandage your wounds. Your Health is fully restored. \n\n**HP:** ❤️ **${player.maxHp} / ${player.maxHp}**\n\n*You are resting and cannot Hunt or Gather for the next **2 Minutes**. Take this time to forge new gear, allocate stats, or manage your inventory!*`);

  return message.reply({ embeds: [embed] });
}
