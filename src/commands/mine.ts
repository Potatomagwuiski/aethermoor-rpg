import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import redisClient from '../redis.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeMine(message: Message) {
  const discordId = message.author.id;
  
  // 1. Redis Strict Cooldown Matrix (60 seconds)
  const cdKey = `cd:mine:${discordId}`;
  
  if (redisClient.isReady) {
      const isCooldown = await redisClient.get(cdKey);
      if (isCooldown) {
          return message.reply(`⛏️ *Your arms are numb. You must wait a minute before swinging your pickaxe again.*`);
      }
  }

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { tools: { where: { type: 'PICKAXE', equipped: true } } }
  });

  if (!player) return message.reply('You are not of this world. Type `rpg start`.');
  if (player.hp <= 0) return message.reply('💀 You are dead! Drink a Life Potion before breaking rocks.');

  // Lock the user for 60 seconds
  if (redisClient.isReady) {
      await redisClient.setEx(cdKey, 60, '1');
  }

  // 2. Progression Logic
  let yieldMultiplier = 1;
  let hasPickaxe = false;
  let toolName = 'Bare Hands';

  if (player.tools && player.tools.length > 0) {
    const tool = player.tools[0];
    yieldMultiplier = tool.yieldMultiplier;
    hasPickaxe = true;
    toolName = `${tool.rarity} PICKAXE (x${yieldMultiplier} Yield)`;
  }

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  let diceFaces = 2; // Bare Hands / Common Tool
  if (hasPickaxe) {
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
  const baseIron = Math.floor(Math.random() * 3) + 1; // 1 to 3 iron
  let baseCoal = 0;
  let baseMythril = 0;

  if (hasPickaxe) {
    const roll = Math.random() * 100;
    if (roll > 50) baseCoal = Math.floor(Math.random() * 2) + 1; // 1 to 2 coal
    if (roll > 95) baseMythril = 1; // 5% chance for massive payout
  }

  const finalIron = Math.floor(baseIron * yieldMultiplier * slotMultiplier);
  const finalCoal = Math.floor(baseCoal * yieldMultiplier * slotMultiplier);
  const finalMythril = Math.floor(baseMythril * yieldMultiplier * slotMultiplier);
  
  const xpReward = 5 * slotMultiplier;
  const exhaustionDamage = 2; // Flat HP drain for grinding

  // 4. Database Transactions
  const ops: any[] = [];
  
  if (finalIron > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'iron' } },
    update: { quantity: { increment: finalIron } },
    create: { playerId: player.id, itemKey: 'iron', quantity: finalIron }
  }));

  if (finalCoal > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'coal' } },
    update: { quantity: { increment: finalCoal } },
    create: { playerId: player.id, itemKey: 'coal', quantity: finalCoal }
  }));

  if (finalMythril > 0) ops.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'mythril' } },
    update: { quantity: { increment: finalMythril } },
    create: { playerId: player.id, itemKey: 'mythril', quantity: finalMythril }
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

  // 5. Blueprint Drops
  let blueprintDropStr = '';
  if (Math.random() <= 0.05) {
    const bps = ['blueprint_iron_pickaxe', 'blueprint_steel_pickaxe', 'blueprint_mythril_pickaxe'];
    const droppedBp = bps[Math.floor(Math.random() * bps.length)];
    const bpName = droppedBp.replace('blueprint_', '').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());
    blueprintDropStr = `\n📜 **BLUEPRINT FOUND:** You unearthed a 🟪 \`[${bpName}]\`!`;
    
    ops.push(prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: droppedBp } },
      update: { quantity: { increment: 1 } },
      create: { playerId: player.id, itemKey: droppedBp, quantity: 1 }
    }));
  }

  await prisma.$transaction(ops);

  // 6. Visual Output
  let dropLog = `${getEmoji('iron')} **+${finalIron} Iron**`;
  if (finalCoal > 0) dropLog += `\n${getEmoji('coal')} **+${finalCoal} Coal**`;
  if (finalMythril > 0) dropLog += `\n${getEmoji('mythril')} **+${finalMythril} Mythril!** ✨`;
  dropLog += blueprintDropStr;

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`⛏️ The Mines`)
    .setColor(isSlotJackpot ? 0xFFD700 : 0x7F8C8D)
    .setDescription(`You slammed your **${toolName}** into the cavern walls. The exertion dealt 🩸 **${exhaustionDamage} DMG** to your health.\n\n${slotMachineString}\n\n**Loot Dropped:**\n${dropLog}\n\n**XP Gained:** ✨ ${xpReward}`)
    .setFooter({ text: '60s Cooldown started.' });

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel + levelsGained}**! (+${levelsGained * 3} Stat Points)` });
  }

  return message.reply({ embeds: [embed] });
}
