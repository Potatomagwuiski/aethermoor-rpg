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

  const zone = player.location || 'lumina_plains';

  let primaryDropKey = 'wood';
  let secondaryDropKey = 'basic_herb';
  let epicDropKey = 'ashwood';
  let toolTierRequired = 1;

  if (zone === 'whispering_woods') {
      primaryDropKey = 'ashwood';
      secondaryDropKey = 'mooncap_mushroom';
      epicDropKey = 'elderwood';
      toolTierRequired = 2; // Needs Iron Tool
  } else if (zone === 'ironpeak_mountains') {
      primaryDropKey = 'oakwood';
      secondaryDropKey = 'frost_lotus';
      epicDropKey = 'moon_herb';
      toolTierRequired = 3; // Needs Steel Tool
  } else if (zone === 'ashen_wastes') {
      primaryDropKey = 'elderwood';
      secondaryDropKey = 'cinderbloom';
      epicDropKey = 'aether_wood';
      toolTierRequired = 4; // Needs Mythril Tool
  } else if (zone === 'abyssal_depths') {
      primaryDropKey = 'aether_wood';
      secondaryDropKey = 'nightmare_kelp';
      epicDropKey = 'lich_soul';
      toolTierRequired = 5; // Needs Demonic Tool
  }

  // Enforce Tool Rarity Constraint
  let currentToolTier = 1;
  const toolRarity = hasAxe ? player.tools[0].rarity : 'NONE';
  if (toolRarity === 'UNCOMMON') currentToolTier = 2; 
  if (toolRarity === 'RARE') currentToolTier = 3; 
  if (toolRarity === 'EPIC') currentToolTier = 4; 
  if (toolRarity === 'LEGENDARY') currentToolTier = 5; 

  if (currentToolTier < toolTierRequired) {
      if (redisClient.isReady) await redisClient.del(cdKey); // Refund cooldown
      return message.reply(`🧱 **Your tool is too weak!** Your ${toolName} shatters against the hardened bark of this zone. You need a better axe to chop here!`);
  }

  // 3. Mathematical Drops
  let activeAbilities: string[] = [];
  if (hasAxe && (player.tools[0] as any).activeAbilities) {
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
      if (ab.includes('Lumberjack')) { bonusYield += 1; abilityHighlights += `🔹 \`Lumberjack\` added +1 Base Yield!\n`; }
      if (ab.includes('Arborist') && Math.random() > 0.85) { autoEpic = true; abilityHighlights += `🌳 \`Arborist\` procured a guaranteed Epic Wood!\n`; }
      
      if (ab.includes('Chop') && Math.random() > 0.95) { multiBonus *= 2; abilityHighlights += `🔹 \`Chop\` doubled the wood!\n`; }
      if (ab.includes('Heavy Chop') && Math.random() > 0.90) { multiBonus *= 2; abilityHighlights += `🔹 \`Heavy Chop\` doubled the wood!\n`; }
      if (ab.includes('Pristine Chop') && Math.random() > 0.85) { multiBonus *= 2; abilityHighlights += `🔹 \`Pristine Chop\` doubled the wood!\n`; }
      
      if (ab.includes('Clearcut') && Math.random() > 0.95) { multiBonus *= 4; abilityHighlights += `🌳 \`Clearcut\` quadrupled the wood!\n`; }
      
      if (ab.includes('Timber!') && Math.random() > 0.99) { multiBonus *= 50; abilityHighlights += `🌟 \`Timber!\` felled the forest! (50x Yield)\n`; }
      if (ab.includes('Deforestation') && Math.random() > 0.98) { multiBonus *= 100; abilityHighlights += `🌟 \`Deforestation\` cleared the zone! (100x Yield)\n`; }
      if (ab.includes('World Tree Bane') && Math.random() > 0.95) { multiBonus *= 500; abilityHighlights += `🌟 \`World Tree Bane\` annihilated nature! (500x Yield)\n`; }
      
      if (ab.includes('Overload') && Math.random() > 0.95) { isOverload = true; abilityHighlights += `🌟 \`Overload\` triggered a massive 10x Yield Boost!\n`; }
      if (ab.includes('Sharp Blade')) { noDamage = true; }
      if (ab.includes('Natures Bounty') && Math.random() > 0.90) { hiddenGem = true; abilityHighlights += `🍃 \`Natures Bounty\` found hidden seeds!\n`; }
  }

  if (isOverload) {
      slotMultiplier *= 10;
      isSlotJackpot = true;
  }

  const basePrimary = Math.floor(Math.random() * 3) + 1 + bonusYield; 
  let baseSecondary = 0;
  let baseEpic = 0;

  if (hasAxe) {
    const roll = Math.random() * 100;
    if (roll > 50) baseSecondary = Math.floor(Math.random() * 2) + 1; 
    if (roll > 95 || autoEpic) baseEpic = 1; 
  }

  const finalPrimary = Math.floor(basePrimary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalSecondary = Math.floor(baseSecondary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalEpic = Math.floor(baseEpic * yieldMultiplier * slotMultiplier * multiBonus);
  
  if (hiddenGem) {
      baseEpic += 1;
  }
  
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

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }
  
  const highlights = abilityHighlights.length > 0 ? `\n**✨ Tool Highlights:**\n${abilityHighlights}` : '';

  const embed = new EmbedBuilder()
    .setTitle(`🪓 The Great Forest`)
    .setColor(isSlotJackpot ? 0xFFD700 : 0x27AE60)
    .setDescription(`You slammed your **${toolName}** into the towering pines. The exertion dealt 🩸 **${exhaustionDamage} DMG** to your health.\n\n${slotMachineString}${highlights}\n\n**Loot Dropped:**\n${dropLog}\n\n**XP Gained:** ✨ ${xpReward}`)
    .setFooter({ text: '60s Cooldown started.' });

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel + levelsGained}**! (+${levelsGained * 3} Stat Points)` });
  }

  return message.reply({ embeds: [embed] });
}
