import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import { prisma } from '../db.js';
import redisClient from '../redis.js';
import { enforceCooldown } from '../utils/cooldown.js';
import { getPinnedTrackerField } from '../utils/tracker.js';
import { BLUEPRINTS } from './forge.js';
import { processQuestProgress } from '../utils/quests.js';

export async function executeHarvest(message: Message, args: string[]) {
  const discordId = message.author.id;
  // 1. Redis Strict Cooldown Matrix (60 seconds)
  const cdKey = `cd:work:${discordId}`;
  const cd = await enforceCooldown(cdKey, 30);
  if (cd.onCooldown) {
       return message.reply(`⛏️ *Your arms are numb. You must wait ${Math.ceil(cd.remainingMs / 1000)} seconds before harvesting again.*`);
  }

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { tools: { where: { type: 'SICKLE', equipped: true } } }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  // Lock handled at top

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  const diceFaces = 10;
  let slotBonus = 0;
  let hasHoe = player.tools && player.tools.length > 0;
  if (hasHoe) {
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
    slotMultiplier = 20; 
  } else if (d1 === d2) {
    isSlotMatch = true;
    // Exactly a 9% chance for this block!
    slotMultiplier = 3; 
  }

  // --- PRE-GATHERING CULINARY BUFF PARSING ---
  let abilityHighlights = '';

  let hasSickle = player.tools && player.tools.length > 0;
  let yieldMultiplier = 1;
  let toolName = 'Bare Hands';
  
  if (hasSickle) {
    const tool = player.tools[0] as any;
    yieldMultiplier = tool.yieldMultiplier || 1.25;
    toolName = `${tool.name} (x${yieldMultiplier} Yield)`;
  }

  let activeAbilities: string[] = [];
  if (hasSickle && (player.tools[0] as any).activeAbilities) {
      activeAbilities = (player.tools[0] as any).activeAbilities as string[];
  }

  let bonusYield = 0;
  let autoEpic = false;
  let isOverload = false;

  let multiBonus = 1;
  let noDamage = false;
  let hiddenGem = false;

  for (const ab of activeAbilities) {
      if (!ab) continue;
      if (ab.includes('Harvester') && !ab.includes('Expert') && !ab.includes('Grand')) { bonusYield += 1; abilityHighlights += `🔹 \`Harvester\` added +1 Base Yield!\n`; }
      if (ab.includes('Expert Harvester')) { bonusYield += 2; abilityHighlights += `🌱 \`Expert Harvester\` added +2 Base Yield!\n`; }
      if (ab.includes('Grand Harvester')) { bonusYield += 3; abilityHighlights += `🌿 \`Grand Harvester\` added +3 Base Yield!\n`; }
      
      if (ab.includes('Reap') && !ab.includes('Efficient') && !ab.includes('Master') && Math.random() > 0.95) { multiBonus *= 2; abilityHighlights += `🔹 \`Reap\` doubled the herbs!\n`; }
      if (ab.includes('Efficient Reap') && Math.random() > 0.90) { multiBonus *= 2; abilityHighlights += `🔹 \`Efficient Reap\` doubled the herbs!\n`; }
      if (ab.includes('Master Reap') && Math.random() > 0.80) { multiBonus *= 2; abilityHighlights += `🔹 \`Master Reap\` doubled the herbs!\n`; }
      
      if (ab.includes('Mother Lode') && Math.random() > 0.99) { multiBonus *= 50; abilityHighlights += `🌟 \`Mother Lode\` found! (50x Yield)\n`; }
      if (ab.includes('Golden Harvest') && Math.random() > 0.98) { multiBonus *= 50; abilityHighlights += `🌟 \`Golden Harvest\` found! (50x Yield)\n`; }
      if (ab.includes('Bountiful Blessing') && Math.random() > 0.95) { multiBonus *= 50; abilityHighlights += `🌟 \`Bountiful Blessing\`! (50x Yield)\n`; }
      
      if (ab.includes('Tireless Swing')) { noDamage = true; abilityHighlights += `💎 \`Tireless Swing\` prevented Exhaustion!\n`; }
      if (ab.includes('Sense') && Math.random() > 0.90) { hiddenGem = true; abilityHighlights += `🌿 \`Earth Sense\` found hidden seeds!\n`; }
  }

  if (player.activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
      if (player.activeBuff === 'GATHER_SLOT_10') { 
          if (isSlotJackpot || isSlotMatch) slotMultiplier += 10; 
          abilityHighlights += `🥧 **Buff Active:** Golden Harvest Pie (+10 Slot Multiplier!)\n`; 
      }
  } else if (player.activeBuff) {
      await prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } });
  }

  // Geographical node table
  const zone = player.location || 'lumina_plains';

  let primaryDropKey = 'basic_herb';
  let secondaryDropKey = 'potato';
  let epicDropKey = 'lumina_berry';

  if (zone === 'whispering_woods') {
      primaryDropKey = 'mooncap_mushroom';
      secondaryDropKey = 'lumina_berry';
      epicDropKey = 'moon_herb';
  } else if (zone === 'ironpeak_mountains') {
      primaryDropKey = 'frost_lotus';
      secondaryDropKey = 'potato';
      epicDropKey = 'cinderbloom';
  } else if (zone === 'ashen_wastes') {
      primaryDropKey = 'cinderbloom';
      secondaryDropKey = 'mooncap_mushroom';
      epicDropKey = 'hellfire_essence';
  } else if (zone === 'abyssal_depths') {
      primaryDropKey = 'nightmare_kelp';
      secondaryDropKey = 'frost_lotus';
      epicDropKey = 'demon_horn';
  }

  const basePrimary = Math.floor(Math.random() * 3) + 1;
  const baseSecondary = Math.random() > 0.5 ? Math.floor(Math.random() * 2) + 1 : 0;
  const baseEpic = Math.random() > 0.95 ? 1 : 0;

  const finalPrimary = Math.floor(((basePrimary + bonusYield) * yieldMultiplier * slotMultiplier) * multiBonus);
  const finalSecondary = Math.floor(((baseSecondary) * yieldMultiplier * slotMultiplier) * multiBonus) + (hiddenGem ? 1 : 0);
  const finalEpic = Math.floor(((baseEpic) * yieldMultiplier * slotMultiplier) * multiBonus) + (autoEpic ? 1 : 0);

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
    slotMachineString += ` = **MATCH!** (${slotMultiplier}x Drop Multiplier) 🔥`;
  }

  let dropOutput = '';
  if (finalPrimary > 0) dropOutput += `+${finalPrimary} ${primaryDropKey.replace(/_/g, ' ').toUpperCase()}\n`;
  if (finalSecondary > 0) dropOutput += `+${finalSecondary} ${secondaryDropKey.replace(/_/g, ' ').toUpperCase()}\n`;
  if (finalEpic > 0) dropOutput += `+${finalEpic} ${epicDropKey.replace(/_/g, ' ').toUpperCase()}\n`;

  const embed = new EmbedBuilder()
    .setTitle('🌾 Harvesting Resolved')
    .setColor(isSlotJackpot ? 0xFFD700 : 0x32CD32) // LimeGreen
    .setDescription(`You tended to the soil and harvested the region's flora.\n\n${slotMachineString}\n${abilityHighlights}\n**Loot Dropped:**\n${dropOutput}\n**XP Gained:**\n✨ +${xpReward} EXP`);

  const questMsg = await processQuestProgress(player.id, 'HARVEST', 1);
  if (questMsg) {
      embed.addFields({ name: '🌟 Bounty Progression', value: questMsg });
  }

  const trackerResult = await getPinnedTrackerField(player.id, (player as any).pinnedForgeItems);
  const row = new ActionRowBuilder<ButtonBuilder>();
  if (trackerResult) {
      embed.addFields(trackerResult.field);
      for (const pin of trackerResult.pinDetails) {
          row.addComponents(
              new ButtonBuilder()
                  .setCustomId(`unpin_${pin.key}_${player.discordId}`)
                  .setLabel(pin.isCompleted ? `✅ Unpin ${BLUEPRINTS[pin.key].name}` : `✖ Unpin ${BLUEPRINTS[pin.key].name}`)
                  .setStyle(pin.isCompleted ? ButtonStyle.Success : ButtonStyle.Secondary)
          );
      }
  }

  const payload: any = { embeds: [embed] };
  if (row.components.length > 0) payload.components = [row];

  return message.reply(payload);
}
