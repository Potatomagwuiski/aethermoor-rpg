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
  const diceFaces = 10;
  let slotBonus = 0;
  let hasFishingRod = player.tools && player.tools.length > 0;
  if (hasFishingRod) {
    const r = player.tools[0].rarity;
    if (r === 'UNCOMMON') slotBonus = 5;
    else if (r === 'RARE') slotBonus = 10;
    else if (r === 'EPIC') slotBonus = 20;
    else if (r === 'LEGENDARY') slotBonus = 50;
  }

  const d1 = Math.floor(Math.random() * diceFaces) + 1;
  const d2 = Math.floor(Math.random() * diceFaces) + 1;
  const d3 = Math.floor(Math.random() * diceFaces) + 1;
  let slotMultiplier = 1;
  let isSlotJackpot = false;
  let isSlotMatch = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    // Keep it massive for the 1%
    slotMultiplier = Math.pow(d1 + d2 + d3 + slotBonus, 2); 
  } else if (d1 === d2) {
    isSlotMatch = true;
    // Exactly a 9% chance for this block!
    slotMultiplier = d1 + d2 + d3 + slotBonus; 
  }

  // Geographical node table
  const zone = player.location || 'lumina_plains';

  let primaryDropKey = 'seaweed';
  let secondaryDropKey = 'river_trout';
  let epicDropKey = 'golden_pearl';

  if (zone === 'whispering_woods') {
      secondaryDropKey = 'golden_koi';
  } else if (zone === 'ironpeak_mountains') {
      secondaryDropKey = 'glacier_cod';
  } else if (zone === 'ashen_wastes') {
      secondaryDropKey = 'lava_eel';
  } else if (zone === 'abyssal_depths') {
      secondaryDropKey = 'void_bass';
  }

  const finalPrimary = Math.floor((Math.random() * 3) + 1) * slotMultiplier;
  let finalSecondary = 0;
  let finalEpic = 0;

  if (Math.random() > 0.5) finalSecondary = Math.floor((Math.random() * 2) + 1) * slotMultiplier;
  if (Math.random() > 0.95) finalEpic = 1 * slotMultiplier;

  const xpReward = 2 * slotMultiplier;

  const ops: any[] = [];
  ops.push(prisma.player.update({
    where: { id: player.id },
    data: { xp: { increment: xpReward } }
  }));

  if (finalPrimary > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: primaryDropKey } },
    update: { quantity: { increment: finalPrimary } },
    create: { playerId: player.id, itemKey: primaryDropKey, quantity: finalPrimary }
  }));

  if (finalSecondary > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: secondaryDropKey } },
    update: { quantity: { increment: finalSecondary } },
    create: { playerId: player.id, itemKey: secondaryDropKey, quantity: finalSecondary }
  }));

  if (finalEpic > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: epicDropKey } },
    update: { quantity: { increment: finalEpic } },
    create: { playerId: player.id, itemKey: epicDropKey, quantity: finalEpic }
  }));

  await prisma.$transaction(ops);

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\``;
  if (isSlotJackpot) {
    slotMachineString += ` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥`;
  } else if (isSlotMatch) {
    slotMachineString += ` = **${slotMultiplier}x MATCH!** 🔥`;
  }

  let dropOutput = '';
  if (finalPrimary > 0) dropOutput += `+${finalPrimary} ${primaryDropKey.replace(/_/g, ' ').toUpperCase()}\n`;
  if (finalSecondary > 0) dropOutput += `+${finalSecondary} ${secondaryDropKey.replace(/_/g, ' ').toUpperCase()}\n`;
  if (finalEpic > 0) dropOutput += `+${finalEpic} ${epicDropKey.replace(/_/g, ' ').toUpperCase()}\n`;

  const embed = new EmbedBuilder()
    .setTitle('🎣 Fishing Resolved')
    .setColor(isSlotJackpot ? 0xFFD700 : 0x1E90FF) // DodgerBlue
    .setDescription(`You cast your line into the regional waters.\n\n${slotMachineString}\n\n**Loot Dropped:**\n${dropOutput}\n**XP Gained:**\n✨ +${xpReward} EXP`);

  return message.reply({ embeds: [embed] });
}
