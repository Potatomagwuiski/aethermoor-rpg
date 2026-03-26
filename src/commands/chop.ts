import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import redisClient from '../redis.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeChop(message: Message) {
  const discordId = message.author.id;
  
  // 1. Redis Strict Cooldown Matrix (60 seconds)
  const cdKey = `cd:chop:${discordId}`;
  
  if (redisClient.isReady) {
      const isCooldown = await redisClient.get(cdKey);
      if (isCooldown) {
          return message.reply('🪓 *Your hands are splintered. You must wait a minute before swinging your axe again.*');
      }
  }

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { tools: { where: { type: 'AXE', equipped: true } } }
  });

  if (!player) return message.reply('You are not of this world. Type `rpg start`.');
  if (player.hp <= 0) return message.reply('💀 You are dead! Drink a Life Potion before chopping wood.');

  // Lock the user for 60 seconds
  if (redisClient.isReady) {
      await redisClient.setEx(cdKey, 60, '1');
  }

  // 2. Progression Logic
  let yieldMultiplier = 1;
  let hasAxe = false;
  let toolName = 'Bare Hands';

  if (player.tools && player.tools.length > 0) {
    const tool = player.tools[0];
    yieldMultiplier = tool.yieldMultiplier;
    hasAxe = true;
    toolName = `${tool.rarity} AXE (x${yieldMultiplier} Yield)`;
  }

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  let diceFaces = 2; // Bare Hands / Common Tool
  if (hasAxe) {
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

  // 3. Mathematical Drops
  const baseWood = Math.floor(Math.random() * 3) + 1; // 1 to 3 wood
  let baseElderwood = 0;
  let baseMoonHerb = 0;

  if (hasAxe) {
    const roll = Math.random() * 100;
    if (roll > 50) baseElderwood = Math.floor(Math.random() * 2) + 1; // 1 to 2 elderwood
    if (roll > 90) baseMoonHerb = 1; // 10% chance for Moon Herb (Alchemy ingredient)
  }

  const finalWood = Math.floor(baseWood * yieldMultiplier * slotMultiplier);
  const finalElderwood = Math.floor(baseElderwood * yieldMultiplier * slotMultiplier);
  const finalMoonHerb = Math.floor(baseMoonHerb * yieldMultiplier * slotMultiplier);
  
  const xpReward = 5 * slotMultiplier;
  const exhaustionDamage = 2;

  // 4. Database Transactions
  const ops: any[] = [];
  
  if (finalWood > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'wood' } },
    update: { quantity: { increment: finalWood } },
    create: { playerId: player.id, itemKey: 'wood', quantity: finalWood }
  }));

  if (finalElderwood > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'elderwood' } },
    update: { quantity: { increment: finalElderwood } },
    create: { playerId: player.id, itemKey: 'elderwood', quantity: finalElderwood }
  }));

  if (finalMoonHerb > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'moon_herb' } },
    update: { quantity: { increment: finalMoonHerb } },
    create: { playerId: player.id, itemKey: 'moon_herb', quantity: finalMoonHerb }
  }));

  // Leveling Engine
  const currentLevel = player.level;
  let currentXp = player.xp + xpReward;
  let levelsGained = 0;
  let xpNeeded = currentLevel * 100;

  while (currentXp >= xpNeeded) {
    levelsGained++;
    currentXp -= xpNeeded;
    xpNeeded = (currentLevel + levelsGained) * 100;
  }
  
  const updateData: any = { 
    xp: currentXp, 
    level: currentLevel + levelsGained, 
    hp: { decrement: exhaustionDamage } 
  };
  
  if (levelsGained > 0) updateData.pointsAvailable = { increment: levelsGained * 3 };

  ops.push(prisma.player.update({ where: { id: player.id }, data: updateData }));

  await prisma.$transaction(ops);

  // 6. Visual Output
  let dropLog = `${getEmoji('wood')} **+${finalWood} Wood**`;
  if (finalElderwood > 0) dropLog += `\n${getEmoji('elderwood')} **+${finalElderwood} Elderwood**`;
  if (finalMoonHerb > 0) dropLog += `\n${getEmoji('moon_herb')} **+${finalMoonHerb} Moon Herb!** 🌿`;

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`🪓 The Great Forest`)
    .setColor(isSlotJackpot ? 0xFFD700 : 0x27AE60)
    .setDescription(`You slammed your **${toolName}** into the towering pines. The exertion dealt 🩸 **${exhaustionDamage} DMG** to your health.\n\n${slotMachineString}\n\n**Loot Dropped:**\n${dropLog}\n\n**XP Gained:** ✨ ${xpReward}`)
    .setFooter({ text: '60s Cooldown started.' });

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel + levelsGained}**! (+${levelsGained * 3} Stat Points)` });
  }

  return message.reply({ embeds: [embed] });
}
