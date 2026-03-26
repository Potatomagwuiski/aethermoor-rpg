import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import redisClient from '../redis.js';

export async function executeFish(message: Message, args: string[]) {
  const discordId = message.author.id;
  // 1. Redis Strict Cooldown Matrix (60 seconds)
  const cdKey = `cd:fish:${discordId}`;
  
  if (redisClient.isReady) {
      const isCooldown = await redisClient.get(cdKey);
      if (isCooldown) {
          return message.reply('🎣 *The fish are spooked. You must wait a minute before casting your line again.*');
      }
  }

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { tools: { where: { type: 'FISHING_ROD', equipped: true } } }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  // Lock the user for 60 seconds
  if (redisClient.isReady) {
      await redisClient.setEx(cdKey, 60, '1');
  }

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  let diceFaces = 2; // Bare Hands / Common Tool
  if (player.tools && player.tools.length > 0) {
    const r = player.tools[0].rarity;
    if (r === 'UNCOMMON') diceFaces = 4;
    else if (r === 'RARE') diceFaces = 5;
    else if (r === 'EPIC') diceFaces = 6;
    else if (r === 'LEGENDARY') diceFaces = 8;
  }

  const d1 = Math.floor(Math.random() * diceFaces) + 1;
  const d2 = Math.floor(Math.random() * diceFaces) + 1;
  const d3 = Math.floor(Math.random() * diceFaces) + 1;
  let slotMultiplier = d1 + d2 + d3;
  let isSlotJackpot = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    slotMultiplier = slotMultiplier * slotMultiplier; // Square the multiplier on three of a kind!
  }

  // Pure RNG fishing node table
  const roll = Math.random();
  let materialDrop = '';
  let dropQuantity = 0;
  let flavorText = '';

  if (roll > 0.95) {
    materialDrop = 'void_bass';
    dropQuantity = 1 * slotMultiplier;
    flavorText = `You wrestled an otherworldly creature from the depths: a ✨ **Void Bass**!`;
  } else if (roll > 0.6) {
    materialDrop = 'river_trout';
    dropQuantity = (Math.floor(Math.random() * 3) + 1) * slotMultiplier;
    flavorText = `Your bobber dipped, and you reeled in **${dropQuantity} River Trout**.`;
  } else {
    materialDrop = 'seaweed';
    dropQuantity = (Math.floor(Math.random() * 5) + 1) * slotMultiplier;
    flavorText = `Your hook got snagged. You pulled up **${dropQuantity} clumps of Seaweed**.`;
  }

  const xpReward = 2 * slotMultiplier;

  // Transaction: Add to inventory, give a tiny bit of XP (Gathering XP)
  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { xp: { increment: xpReward } }
    }),
    prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: materialDrop } },
      update: { quantity: { increment: dropQuantity } },
      create: { playerId: player.id, itemKey: materialDrop, quantity: dropQuantity }
    })
  ]);

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }

  const embed = new EmbedBuilder()
    .setTitle('🎣 Fishing Resolved')
    .setColor(isSlotJackpot ? 0xFFD700 : 0x1E90FF) // DodgerBlue
    .setDescription(`${flavorText}\n\n${slotMachineString}\n\n**Loot Dropped:**\n+${dropQuantity} ${materialDrop.replace('_', ' ').toUpperCase()}\n\n**XP Gained:**\n✨ +${xpReward} EXP`);

  return message.reply({ embeds: [embed] });
}
