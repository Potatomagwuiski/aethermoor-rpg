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
  const diceFaces = 10;
  let slotBonus = 0;
  if (hasPickaxe) {
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

  const zone = player.location || 'lumina_plains';

  let primaryDropKey = 'copper';
  let secondaryDropKey = 'tin';
  let epicDropKey = 'iron_ore';
  let toolTierRequired = 1;

  if (zone === 'whispering_woods') {
      primaryDropKey = 'iron';
      secondaryDropKey = 'coal';
      epicDropKey = 'copper_ingot';
      toolTierRequired = 2; // Needs Iron Tool
  } else if (zone === 'ironpeak_mountains') {
      primaryDropKey = 'steel_ore';
      secondaryDropKey = 'silver';
      epicDropKey = 'gold_ore';
      toolTierRequired = 3; // Needs Steel Tool
  } else if (zone === 'ashen_wastes') {
      primaryDropKey = 'obsidian';
      secondaryDropKey = 'gold_ore';
      epicDropKey = 'mythril';
      toolTierRequired = 4; // Needs Mythril Tool
  } else if (zone === 'abyssal_depths') {
      primaryDropKey = 'voidstone';
      secondaryDropKey = 'mythril';
      epicDropKey = 'rare_meteorite_ingot';
      toolTierRequired = 5; // Needs Demonic Tool
  }

  // Enforce Tool Rarity Constraint
  let currentToolTier = 1;
  const toolRarity = hasPickaxe ? player.tools[0].rarity : 'NONE';
  if (toolRarity === 'UNCOMMON') currentToolTier = 2; 
  if (toolRarity === 'RARE') currentToolTier = 3; 
  if (toolRarity === 'EPIC') currentToolTier = 4; 
  if (toolRarity === 'LEGENDARY') currentToolTier = 5; 

  if (currentToolTier < toolTierRequired) {
      if (redisClient.isReady) await redisClient.del(cdKey); // Refund cooldown
      return message.reply(`🧱 **Your tool is too weak!** Your ${toolName} shatters against the hardened rocks of this zone. You need a better pickaxe to mine here!`);
  }

  // 3. Mathematical Drops
  let activeAbilities: string[] = [];
  if (hasPickaxe && (player.tools[0] as any).activeAbilities) {
      activeAbilities = (player.tools[0] as any).activeAbilities as string[];
  }

  let bonusYield = 0;
  let autoEpic = false;
  let isOverload = false;
  let abilityHighlights = '';
  
  let multiBonus = 1;
  let noDamage = false;
  let hiddenGem = false;

  for (const ab of activeAbilities) {
      if (!ab) continue;
      if (ab.includes('Miner')) { bonusYield += 1; abilityHighlights += `🔹 \`Miner\` added +1 Base Yield!\n`; }
      if (ab.includes('Prospector') && Math.random() > 0.85) { autoEpic = true; abilityHighlights += `💎 \`Prospector\` unearthed a guaranteed Epic Ore!\n`; }
      
      if (ab.includes('Prospect') && Math.random() > 0.95) { multiBonus *= 2; abilityHighlights += `🔹 \`Prospect\` doubled the ore!\n`; }
      if (ab.includes('Heavy Swing') && Math.random() > 0.90) { multiBonus *= 2; abilityHighlights += `🔹 \`Heavy Swing\` doubled the ore!\n`; }
      if (ab.includes('Pristine Swing') && Math.random() > 0.85) { multiBonus *= 2; abilityHighlights += `🔹 \`Pristine Swing\` doubled the ore!\n`; }
      
      if (ab.includes('Deep Strike') && Math.random() > 0.95) { multiBonus *= 4; abilityHighlights += `🪨 \`Deep Strike\` quadrupled the ore!\n`; }
      
      if (ab.includes('Mother Lode') && Math.random() > 0.99) { multiBonus *= 50; abilityHighlights += `🌟 \`Mother Lode\` found! (50x Yield)\n`; }
      if (ab.includes('Core Drill') && Math.random() > 0.98) { multiBonus *= 100; abilityHighlights += `🌟 \`Core Drill\` struck deep! (100x Yield)\n`; }
      if (ab.includes('Planet Cracker') && Math.random() > 0.95) { multiBonus *= 500; abilityHighlights += `🌟 \`Planet Cracker\` obliterated the zone! (500x Yield)\n`; }
      
      if (ab.includes('Overload') && Math.random() > 0.95) { isOverload = true; abilityHighlights += `🌟 \`Overload\` triggered a massive 10x Yield Boost!\n`; }
      if (ab.includes('Tireless Swing')) { noDamage = true; abilityHighlights += `💎 \`Tireless Swing\` prevented Exhaustion!\n`; }
      if (ab.includes('Earth Sense') && Math.random() > 0.90) { hiddenGem = true; abilityHighlights += `💎 \`Earth Sense\` found hidden gems!\n`; }
  }

  if (isOverload) {
      slotMultiplier *= 10;
      isSlotJackpot = true;
  }

  const basePrimary = Math.floor(Math.random() * 3) + 1 + bonusYield; 
  let baseSecondary = 0;
  let baseEpic = 0;

  if (hasPickaxe) {
    const roll = Math.random() * 100;
    if (roll > 50) baseSecondary = Math.floor(Math.random() * 2) + 1; 
    if (roll > 95 || autoEpic) baseEpic = 1; 
  }

  if (hiddenGem) {
      baseEpic += 1;
  }

  const finalPrimary = Math.floor(basePrimary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalSecondary = Math.floor(baseSecondary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalEpic = Math.floor(baseEpic * yieldMultiplier * slotMultiplier * multiBonus);
  
  const xpReward = 5 * toolTierRequired * slotMultiplier;
  const exhaustionDamage = noDamage ? 0 : 2 * toolTierRequired; 

  // 4. Database Transactions
  const ops: any[] = [];
  
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
  let dropLog = `${getEmoji(primaryDropKey)} **+${finalPrimary} ${primaryDropKey.replace(/_/g, ' ').toUpperCase()}**`;
  if (finalSecondary > 0) dropLog += `\n${getEmoji(secondaryDropKey)} **+${finalSecondary} ${secondaryDropKey.replace(/_/g, ' ').toUpperCase()}**`;
  if (finalEpic > 0) dropLog += `\n${getEmoji(epicDropKey)} **+${finalEpic} ${epicDropKey.replace(/_/g, ' ').toUpperCase()}!** ✨`;

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\``;
  if (isSlotJackpot) {
    slotMachineString += ` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥`;
  } else if (isSlotMatch) {
    slotMachineString += ` = **${slotMultiplier}x MATCH!** 🔥`;
  }
  
  const highlights = abilityHighlights.length > 0 ? `\n**✨ Tool Highlights:**\n${abilityHighlights}` : '';

  const embed = new EmbedBuilder()
    .setTitle(`⛏️ The Mines`)
    .setColor(isSlotJackpot ? 0xFFD700 : 0x7F8C8D)
    .setDescription(`You slammed your **${toolName}** into the cavern walls. The exertion dealt 🩸 **${exhaustionDamage} DMG** to your health.\n\n${slotMachineString}${highlights}\n\n**Loot Dropped:**\n${dropLog}\n\n**XP Gained:** ✨ ${xpReward}`)
    .setFooter({ text: '60s Cooldown started.' });

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel + levelsGained}**! (+${levelsGained * 3} Stat Points)` });
  }

  return message.reply({ embeds: [embed] });
}
