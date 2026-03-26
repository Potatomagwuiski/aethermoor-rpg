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

  if (!player) return message.reply('You are not of this world. Type `rpg start <class>`.');
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

  // 3. Mathematical Drops
  const baseIron = Math.floor(Math.random() * 3) + 1; // 1 to 3 iron
  let baseCoal = 0;
  let baseMythril = 0;

  if (hasPickaxe) {
    const roll = Math.random() * 100;
    if (roll > 50) baseCoal = Math.floor(Math.random() * 2) + 1; // 1 to 2 coal
    if (roll > 95) baseMythril = 1; // 5% chance for massive payout
  }

  const finalIron = Math.floor(baseIron * yieldMultiplier);
  const finalCoal = Math.floor(baseCoal * yieldMultiplier);
  const finalMythril = Math.floor(baseMythril * yieldMultiplier);
  
  const xpReward = 5;
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

  await prisma.$transaction(ops);

  // 5. Visual Output
  let dropLog = `${getEmoji('iron')} **+${finalIron} Iron**`;
  if (finalCoal > 0) dropLog += `\n${getEmoji('coal')} **+${finalCoal} Coal**`;
  if (finalMythril > 0) dropLog += `\n${getEmoji('mythril')} **+${finalMythril} Mythril!** ✨`;

  const embed = new EmbedBuilder()
    .setTitle(`⛏️ The Mines`)
    .setColor(0x7F8C8D)
    .setDescription(`You slammed your **${toolName}** into the cavern walls. The exertion dealt 🩸 **${exhaustionDamage} DMG** to your health.\n\n**Loot Dropped:**\n${dropLog}\n\n**XP Gained:** ✨ ${xpReward}`)
    .setFooter({ text: '60s Cooldown started.' });

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel + levelsGained}**! (+${levelsGained * 3} Stat Points)` });
  }

  return message.reply({ embeds: [embed] });
}
