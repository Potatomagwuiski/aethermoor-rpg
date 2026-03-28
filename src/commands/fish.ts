import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import redisClient from '../redis.js';
import { enforceCooldown } from '../utils/cooldown.js';
import { getPinnedTrackerField } from '../utils/tracker.js';

export async function executeFish(message: Message, args: string[]) {
  const discordId = message.author.id;
  // 1. Redis Strict Cooldown Matrix (60 seconds)
  const cdKey = `cd:work:${discordId}`;
  
  const cd = await enforceCooldown(cdKey, 30);
  if (cd.onCooldown) {
      return message.reply(`🎣 *The fish are spooked. You must wait ${Math.ceil(cd.remainingMs / 1000)} seconds before casting your line again.*`);
  }

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { tools: { where: { type: 'FISHING_ROD', equipped: true } } }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  // Lock handled at top

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  const diceFaces = 10;
  let slotBonus = 0;
  let hasFishingRod = player.tools && player.tools.length > 0;
  let yieldMultiplier = 1;
  if (hasFishingRod) {
    const r = player.tools[0].rarity;
    if (r === 'UNCOMMON') slotBonus = 5;
    else if (r === 'RARE') slotBonus = 10;
    else if (r === 'EPIC') slotBonus = 20;
    else if (r === 'LEGENDARY') slotBonus = 50;
    yieldMultiplier = player.tools[0].yieldMultiplier || 1;
  }

  let activeAbilities: string[] = [];
  if (hasFishingRod && (player.tools[0] as any).activeAbilities) {
      activeAbilities = (player.tools[0] as any).activeAbilities as string[];
  }

  let bonusYield = 0;
  let autoEpic = false;
  let isOverload = false;
  let multiBonus = 1;
  
  let abilityHighlights = '';

  for (const ab of activeAbilities) {
      if (!ab) continue;
      if (ab.includes('Angler')) { bonusYield += 1; abilityHighlights += `🔹 \`${ab.split('**')[1]}\` added Yield!\n`; }
      if (ab.includes("Fisherman's Luck") && Math.random() > 0.85) { autoEpic = true; abilityHighlights += `💎 \`Fisherman's Luck\` brought in an Epic Fish!\n`; }
      
      if (ab.includes('Reel In') && Math.random() > 0.90) { multiBonus *= 2; abilityHighlights += `🔹 \`Reel In\` doubled the fish!\n`; }
      if (ab.includes('Heavy Reel') && Math.random() > 0.90) { multiBonus *= 2; abilityHighlights += `🔹 \`Heavy Reel\` doubled the fish!\n`; }
      if (ab.includes('Pristine Cast') && Math.random() > 0.85) { multiBonus *= 2; abilityHighlights += `🔹 \`Pristine Cast\` doubled the fish!\n`; }
      
      if (ab.includes('Deep Sea Catch') && Math.random() > 0.95) { multiBonus *= 4; abilityHighlights += `🌊 \`Deep Sea Catch\` quadrupled the fish!\n`; }
      
      if (ab.includes('Tidal Wave') && Math.random() > 0.99) { multiBonus *= 50; abilityHighlights += `🌟 \`Tidal Wave\` hit! (50x Yield)\n`; }
      if (ab.includes('Leviathans Bounty') && Math.random() > 0.98) { multiBonus *= 100; abilityHighlights += `🌟 \`Leviathans Bounty\` surfaced! (100x Yield)\n`; }
      if (ab.includes('Poseidons Wrath') && Math.random() > 0.95) { multiBonus *= 500; abilityHighlights += `🌟 \`Poseidons Wrath\` flooded the zone! (500x Yield)\n`; }
      
      if (ab.includes('Overload') && Math.random() > 0.95) { isOverload = true; abilityHighlights += `🌟 \`Overload\` triggered a massive 10x Yield Boost!\n`; }
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
    slotMultiplier = 20; 
  } else if (d1 === d2) {
    isSlotMatch = true;
    // Exactly a 9% chance for this block!
    slotMultiplier = 3; 
  }

  // --- PRE-GATHERING CULINARY BUFF PARSING ---
  let forceEpic = false;
  if (player.activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
      if (player.activeBuff === 'FISH_EPIC') { forceEpic = true; abilityHighlights += `🍺 **Buff Active:** Fisherman's Brew (Guaranteed Epic!)\n`; }
      if (player.activeBuff === 'GATHER_SLOT_10') { 
          if (isSlotJackpot || isSlotMatch) slotMultiplier += 10; 
          abilityHighlights += `🥧 **Buff Active:** Golden Harvest Pie (+10 Slot Multiplier!)\n`; 
      }
  } else if (player.activeBuff) {
      await prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } });
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

  if (isOverload) {
      slotMultiplier *= 10;
      isSlotJackpot = true;
  }

  const basePrimary = Math.floor(Math.random() * 3) + 1 + bonusYield;
  let baseSecondary = 0;
  let baseEpic = 0;

  if (Math.random() > 0.5) baseSecondary = Math.floor(Math.random() * 2) + 1;
  if (Math.random() > 0.95 || forceEpic || autoEpic) baseEpic = 1;

  const finalPrimary = Math.floor(basePrimary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalSecondary = Math.floor(baseSecondary * yieldMultiplier * slotMultiplier * multiBonus);
  const finalEpic = Math.floor(baseEpic * yieldMultiplier * slotMultiplier * multiBonus);

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
    .setDescription(`You cast your line into the regional waters.\n\n${slotMachineString}\n${abilityHighlights}\n**Loot Dropped:**\n${dropOutput}\n**XP Gained:**\n✨ +${xpReward} EXP`);

  const trackerField = await getPinnedTrackerField(player.id, player.pinnedForgeItem);
  if (trackerField) embed.addFields(trackerField);

  return message.reply({ embeds: [embed] });
}
