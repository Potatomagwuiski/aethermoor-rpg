import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import redisClient from '../redis.js';
import { getEmoji } from '../utils/emojis.js';
import { BLUEPRINTS } from './forge.js';

export async function execute(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
        equipment: {
            where: { equipped: true }
        }
    }
  });

  if (!player) {
    return message.reply('You have not created a character yet!');
  }

  if (player.hp <= 0) {
    return message.reply('💀 **YOU ARE DEAD.**\nYou cannot hunt until your body is restored. Buy a 🧪 **[Life Potion]** from the `rpg shop` and type `rpg heal`.');
  }

  const cdKey = `cooldown:hunt:${discordId}`;
  if (redisClient.isReady) {
    try {
      const isCooldown = await redisClient.get(cdKey);
      if (isCooldown) {
        return message.reply('⏳ **Exhausted!** You are still recovering from your last hunt. Wait a few seconds!');
      }
      await redisClient.setEx(cdKey, 10, '1'); // 10 second combat cooldown
    } catch (e) {
      console.error('Redis error', e);
    }
  }

  // Fetch Equipped Gear
  let gearAtk = 0;
  let gearDef = 0;
  let gearCrit = 0;
  let gearLifesteal = 0;
  let gearEvasion = 0;
  let weaponName = 'Fists';
  let armorName = 'Casual Clothes';
  let weaponClass = 'NONE';
  let armorClass = 'NONE';

  for (const eq of player.equipment || []) {
    gearAtk += eq.bonusAtk;
    gearDef += eq.bonusDef;
    gearCrit += eq.bonusCrit;
    gearLifesteal += eq.bonusLifesteal;
    gearEvasion += eq.bonusEvasion;

    // Phase 26 Auto-Battler Fix: Dynamically Fetch Base Stats from Forge Registry
    let baseKey = eq.baseItemKey;
    let rarityLabel = 'common';
    if (baseKey.includes('_')) {
        const parts = baseKey.split('_');
        if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(parts[0])) {
            rarityLabel = parts.shift() as string;
            baseKey = parts.join('_');
        }
    }

    if (BLUEPRINTS[baseKey] && BLUEPRINTS[baseKey].outputs[rarityLabel]) {
        const baseStats = BLUEPRINTS[baseKey].outputs[rarityLabel];
        if (baseStats.dps) gearAtk += baseStats.dps;
        if (baseStats.defense) gearDef += baseStats.defense;
    }

    if (eq.slot === 'WEAPON') {
      weaponName = eq.name || weaponName;
      weaponClass = eq.equipmentClass;
    }
    if (eq.slot === 'ARMOR') {
      armorName = eq.name || armorName;
      armorClass = eq.equipmentClass;
    }
  }

  // --- THE ADRENALINE SLOT MACHINE (RARITY LOADED) ---
  let diceFaces = 2; // Basic/Wood (Humble Beginnings)
  const lowerName = weaponName.toLowerCase();
  
  if (lowerName.includes('iron') || lowerName.includes('bone') || lowerName.includes('rusty')) diceFaces = 4;
  else if (lowerName.includes('steel') || lowerName.includes('venom') || lowerName.includes('soul')) diceFaces = 5;
  else if (lowerName.includes('mythril') || lowerName.includes('shadow') || lowerName.includes('lich')) diceFaces = 6;
  else if (lowerName.includes('moonlight') || lowerName.includes('meteor') || lowerName.includes('void')) diceFaces = 8;

  const d1 = Math.floor(Math.random() * diceFaces) + 1;
  const d2 = Math.floor(Math.random() * diceFaces) + 1;
  const d3 = Math.floor(Math.random() * diceFaces) + 1;
  let slotMultiplier = d1 + d2 + d3;
  let isSlotJackpot = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    slotMultiplier = slotMultiplier * slotMultiplier; // Square the multiplier on three of a kind!
  }


  const currentZone = player.location || 'lumina_plains';
  const zoneTiers: Record<string, number> = { lumina_plains: 1, whispering_woods: 2, ironpeak_mountains: 3, ashen_wastes: 5, abyssal_depths: 10 };
  const tier = zoneTiers[currentZone] || 1;

  // --- MONSTER GENERATION HOIST ---
  const ZONED_MOBS: Record<string, any[]> = {
    lumina_plains: [
      { name: 'Acid Slime', emoji: '💧', loot: [{ key: 'slime_core', name: 'Slime Core', chance: 0.5 }, { key: 'acid_vial', name: 'Acid Vial', chance: 0.15 }] },
      { name: 'Goblin Scout', emoji: '👺', loot: [{ key: 'goblin_ear', name: 'Goblin Ear', chance: 0.4 }, { key: 'rusty_dagger', name: 'Rusty Dagger', chance: 0.1 }] },
      { name: 'Cave Bat', emoji: '🦇', loot: [{ key: 'bat_wing', name: 'Bat Wing', chance: 0.4 }, { key: 'guano', name: 'Guano', chance: 0.1 }] }
    ],
    whispering_woods: [
      { name: 'Dire Wolf', emoji: '🐺', loot: [{ key: 'wolf_pelt', name: 'Wolf Pelt', chance: 0.4 }, { key: 'wolf_fang', name: 'Wolf Fang', chance: 0.2 }] },
      { name: 'Forest Treant', emoji: '🌳', loot: [{ key: 'living_wood', name: 'Living Wood', chance: 0.3 }, { key: 'moon_herb', name: 'Moon Herb', chance: 0.05 }] }
    ],
    ironpeak_mountains: [
      { name: 'Skeleton Warrior', emoji: '💀', loot: [{ key: 'bone_shard', name: 'Bone Shard', chance: 0.5 }, { key: 'iron_ingot', name: 'Iron Ingot', chance: 0.05 }] },
      { name: 'Rock Golem', emoji: '🪨', loot: [{ key: 'stone_core', name: 'Stone Core', chance: 0.3 }, { key: 'gold_ore', name: 'Gold Ore', chance: 0.1 }] }
    ],
    ashen_wastes: [
      { name: 'Lesser Demon', emoji: '👿', loot: [{ key: 'demon_horn', name: 'Demon Horn', chance: 0.2 }, { key: 'hellfire_essence', name: 'Hellfire Essence', chance: 0.05 }] },
      { name: 'Shadow Stalker', emoji: '🌑', loot: [{ key: 'shadow_dust', name: 'Shadow Dust', chance: 0.2 }, { key: 'void_fragment', name: 'Void Fragment', chance: 0.01 }] }
    ],
    abyssal_depths: [
      { name: 'Mythic Drake', emoji: '🐉', loot: [{ key: 'drake_scale', name: 'Drake Scale', chance: 0.1 }, { key: 'mythic_dragon_scale', name: 'Mythic Dragon Scale', chance: 0.02 }] },
      { name: 'Abyssal Lich', emoji: '🧙‍♂️', loot: [{ key: 'void_fragment', name: 'Void Fragment', chance: 0.2 }, { key: 'lich_tome', name: 'Lich Tome', chance: 0.01 }] }
    ]
  };

  const monsters = ZONED_MOBS[currentZone] || ZONED_MOBS['lumina_plains'];
  const mob = monsters[Math.floor(Math.random() * monsters.length)];

  // --- PRE-COMBAT CULINARY BUFF PARSING ---
  let buffMessage = '';
  let activeBuff = player.activeBuff;
  if (activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
    if (activeBuff === 'ATK_10') { gearAtk += 10; buffMessage = '✨ **Buff Active:** Roasted Trout (+10 ATK)'; }
    if (activeBuff === 'HP_25') { player.maxHp += 25; player.hp += 25; buffMessage = '✨ **Buff Active:** Koi Soup (+25 MAX HP)'; }
    if (activeBuff === 'DEF_50') { gearDef += 50; buffMessage = '✨ **Buff Active:** Glacial Filet (+50 DEF)'; }
    if (activeBuff === 'CRIT_15') { gearCrit += 15; buffMessage = '✨ **Buff Active:** Spicy Eel (+15% CRIT)'; }
    if (activeBuff === 'ATK_100_LS_10') { gearAtk += 100; gearLifesteal += 10; buffMessage = '✨ **Buff Active:** Void Sashimi (+100 ATK, 10% LIFESTEAL)'; }
  } else if (activeBuff) {
    await prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } });
    activeBuff = null;
  }

  // --- THE AUTO-BATTLER PHYSICS LOOP ---
  // Phase 27 Early-Game Rebalance: Removed massive baseline bloating.
  // Original HP (Tier*150) caused Level 1 soft-locks. New Baseline: (Tier*40 + 10x Level)
  let monsterMaxHp = Math.floor(tier * 40) + Math.floor(player.level * 10);
  let monsterHp = monsterMaxHp;
  // Original ATK (Tier*20 + 6x Level + 15) one-shot players. New Baseline: (Tier*8 + 3x Level)
  let monsterAttackPower = Math.floor(tier * 8) + Math.floor(player.level * 3);

  let playerHp = player.hp;
  if (playerHp <= 0) playerHp = 1;

  let jackpotTriggered = false;
  let jackpotMessage = '';
  let craftingItemDrop: string | null = null;
  
  // Base Damage Injection via Class Type
  let playerBaseOutput = 10;
  if (weaponClass === 'FINESSE_WEAPON') playerBaseOutput = player.agi * 4;
  if (weaponClass === 'HEAVY_WEAPON') playerBaseOutput = player.str * 5;
  if (weaponClass === 'MAGIC_WEAPON') playerBaseOutput = player.int * 6;

  // Class Passives prep
  if (armorClass === 'LIGHT_ARMOR') gearEvasion += 15;

  let rounds = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let totalLifesteal = 0;
  let totalEvades = 0;
  let totalCrits = 0;
  let totalMitigated = 0;

  const MAX_ROUNDS = 20;

  while (playerHp > 0 && monsterHp > 0 && rounds < MAX_ROUNDS) {
    rounds++;

    // 1. Player Attacks!
    let roundDps = playerBaseOutput + gearAtk;
    
    // Weapon Procs
    if (weaponClass === 'FINESSE_WEAPON' && Math.random() > 0.95 && rounds === 1) {
      jackpotTriggered = true;
      roundDps = Math.floor(roundDps * 2.5);
      jackpotMessage = '🗡️ **ASSASSIN\'S STRIKE!** You found a hidden coin purse on the monster!';
    } else if (weaponClass === 'HEAVY_WEAPON' && Math.random() > 0.95 && rounds === 1) {
      jackpotTriggered = true;
      roundDps = Math.floor(roundDps * 3);
      craftingItemDrop = "gold_ore"; 
      jackpotMessage = '🪓 **SUNDERING STRIKE!** You shattered their defenses and salvaged some Gold Ore!';
    } else if (weaponClass === 'MAGIC_WEAPON' && Math.random() > 0.95 && rounds === 1) {
      jackpotTriggered = true;
      jackpotMessage = '🎇 **WILD MAGIC!** You absorbed the chaotic leylines for an EXP Surge!';
    }

    if (Math.random() * 100 < gearCrit) {
      roundDps = Math.floor(roundDps * 2);
      totalCrits++;
    }

    // Lifesteal calculation
    if (gearLifesteal > 0) {
      const heal = Math.floor(roundDps * (gearLifesteal / 100));
      playerHp = Math.min(player.maxHp, playerHp + heal);
      totalLifesteal += heal;
    }

    monsterHp -= roundDps;
    totalDamageDealt += roundDps;

    if (monsterHp <= 0) break; // Monster SLAIN!

    // 2. Monster Counter-Attacks!
    let rawIncoming = Math.floor(Math.random() * monsterAttackPower) + Math.floor(monsterAttackPower / 2);
    
    // Mitigation Engine
    let mitigation = Math.floor(gearDef * 0.75) + Math.floor(player.end * 2);
    if (armorClass === 'HEAVY_ARMOR') rawIncoming = Math.floor(rawIncoming * 0.9); // 10% Flat mitigation

    if (Math.random() * 100 < gearEvasion) {
      rawIncoming = 0;
      totalEvades++;
    } else {
      totalMitigated += Math.min(mitigation, rawIncoming);
      rawIncoming -= mitigation;
    }

    if (rawIncoming < 0) rawIncoming = 0;

    playerHp -= rawIncoming;
    totalDamageTaken += rawIncoming;
  }

  // --- FAILURE STATE (DEATH PENALTY) ---
  if (playerHp <= 0 || rounds >= MAX_ROUNDS) {
    const goldLost = Math.floor(player.gold * 0.1);
    await prisma.player.update({
      where: { discordId },
      data: { hp: 1, gold: { decrement: goldLost } }
    });

    const averageDps = rounds > 0 ? Math.floor(totalDamageDealt / rounds) : 0;
    const mitigationPerRound = Math.floor(gearDef * 0.75) + Math.floor(player.end * 2);

    let tip = '';
    if (monsterHp > (monsterMaxHp * 0.5)) {
        tip = `💡 *Tip: You barely scratched it! You need a much stronger Weapon or an ATK Potion.*`;
    } else if ((totalDamageTaken / (rounds || 1)) > (player.maxHp * 0.2)) {
        tip = `💡 *Tip: You took massive damage per round. Upgrade your Armor or boost your END!*`;
    } else {
        tip = `💡 *Tip: It was a close fight! You just ran out of HP. Drink a Health Potion before hunting!*`;
    }

    const deathEmbed = new EmbedBuilder()
      .setTitle(`☠️ DEFEAT: SLAIN BY ${mob.name.toUpperCase()}`)
      .setColor(0x8B0000)
      .setDescription(`You swung your **${weaponName}** but you lacked the DPS and Defenses to survive the ${currentZone.replace('_', ' ')}.\n\nThe ${mob.emoji} ${mob.name} overwhelmed you after **${rounds} Rounds** of combat.\n\n🔻 **You lost ${goldLost} Gold (10%).**\n❤️ **You are heavily injured. Use Potions to heal before hunting again.**`)
      .addFields(
        { name: 'Damage Dealt', value: `${totalDamageDealt} DMG`, inline: true },
        { name: 'Damage Taken', value: `${totalDamageTaken} DMG`, inline: true },
        { name: '🔬 Combat Analysis', value: `**Avg Output**: ${averageDps} DMG/Round\n**Armor Mitigated**: ${mitigationPerRound} DMG/Round\n\n${tip}` }
      );
    return message.reply({ embeds: [deathEmbed] });
  }

  // --- VICTORY STATE (REWARDS) ---
  if (armorClass === 'CLOTH') {
    playerHp = Math.min(player.maxHp, playerHp + Math.floor(player.maxHp * 0.05)); // Mana Shield regen
  }

  let baseGold = 5 * tier;
  let baseXP = Math.floor(Math.random() * 21 * tier) + (15 * tier); 
  let goldReward = baseGold * slotMultiplier;
  let xpReward = baseXP * slotMultiplier;

  if (jackpotTriggered && weaponClass === 'FINESSE_WEAPON') goldReward += 15 * slotMultiplier;
  if (jackpotTriggered && weaponClass === 'MAGIC_WEAPON') xpReward += 15 * slotMultiplier;

  let dbOperations = [];
  
  // Loot Drops
  interface MobDrop {
    key: string;
    name: string;
    qty: number;
  }
  let mobDrops: MobDrop[] = [];
  for (const item of mob.loot) {
    if (Math.random() <= item.chance) {
      const quantity = slotMultiplier;
      mobDrops.push({ key: item.key, name: item.name, qty: quantity });
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: item.key } },
        update: { quantity: { increment: quantity } },
        create: { playerId: player.id, itemKey: item.key, quantity: quantity }
      }));
    }
  }

  if (craftingItemDrop) {
    dbOperations.push(prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: craftingItemDrop } },
      update: { quantity: { increment: 1 } },
      create: { playerId: player.id, itemKey: craftingItemDrop, quantity: 1 }
    }));
  }

  // THE GACHA SYSTEM
  const COMMON_BPS = [{key: 'blueprint_bronze_sword', name:'Bronze Sword'}, {key:'blueprint_bronze_dagger', name:'Bronze Dagger'}, {key:'blueprint_wood_staff', name:'Wood Staff'}, {key:'blueprint_bone_scythe', name:'Bone Scythe'}, {key:'blueprint_bronze_helmet', name:'Bronze Helmet'}, {key:'blueprint_bronze_chestplate', name:'Bronze Chestplate'}, {key:'blueprint_bronze_boots', name:'Bronze Boots'}];
  const UNCOMMON_BPS = [{key: 'blueprint_iron_greatsword', name:'Iron Greatsword'}, {key:'blueprint_venom_shiv', name:'Venom Shiv'}, {key:'blueprint_moonlight_staff', name:'Moonlight Staff'}, {key:'blueprint_soul_reaper', name:'Soul Reaper'}, {key: 'blueprint_iron_pickaxe', name: 'Iron Pickaxe' }, { key: 'blueprint_iron_axe', name: 'Iron Axe' }];
  const EPIC_BPS = [{key: 'blueprint_mythril_cleaver', name:'Mythril Cleaver'}, {key:'blueprint_shadow_blade', name:'Shadow Blade'}, {key:'blueprint_meteor_staff', name:'Meteor Staff'}, {key:'blueprint_lich_tome', name:'Lich Tome'}, {key:'blueprint_wolf_slayer', name:'Wolf Slayer Sword'}, { key: 'blueprint_mythril_pickaxe', name: 'Mythril Pickaxe' }, { key: 'blueprint_mythril_axe', name: 'Mythril Axe' }];
  
  let gachaLootString = '';
  if (Math.random() <= 0.25) { 
    const rarityRoll = Math.random();
    let dropKey = '';
    if (rarityRoll > 0.999) { gachaLootString = '🟧 `[✨ Blueprint: Void Blade ✨]`'; dropKey = 'blueprint_void_blade'; }
    else if (rarityRoll > 0.95) { const bp = EPIC_BPS[Math.floor(Math.random() * EPIC_BPS.length)]; gachaLootString = `🟪 \`[Blueprint: ${bp.name}]\``; dropKey = bp.key; }
    else if (rarityRoll > 0.90) { gachaLootString = '🗝️ `[Dungeon Key]`'; dropKey = 'dungeon_key'; }
    else if (rarityRoll > 0.70) { const bp = UNCOMMON_BPS[Math.floor(Math.random() * UNCOMMON_BPS.length)]; gachaLootString = `🟦 \`[Blueprint: ${bp.name}]\``; dropKey = bp.key; }
    else { const bp = COMMON_BPS[Math.floor(Math.random() * COMMON_BPS.length)]; gachaLootString = `⬜ \`[Blueprint: ${bp.name}]\``; dropKey = bp.key; }

    if (dropKey) {
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: dropKey } },
        update: { quantity: { increment: 1 } },
        create: { playerId: player.id, itemKey: dropKey, quantity: 1 }
      }));
    }
  }

  // Leveling Engine
  let currentLevel = player.level;
  let currentXp = player.xp + xpReward;
  let pointsGained = 0;

  while (currentXp >= currentLevel * 100) {
    currentXp -= currentLevel * 100;
    currentLevel++;
    pointsGained += 3;
  }
  const levelsGained = currentLevel - player.level;

  const updateData: any = { gold: { increment: goldReward }, level: currentLevel, xp: currentXp, hp: playerHp };
  if (levelsGained > 0) {
    updateData.pointsAvailable = { increment: pointsGained };
    updateData.maxHp = { increment: levelsGained * 5 };
    updateData.hp = { increment: levelsGained * 5 };
  }

  dbOperations.push(prisma.player.update({ where: { discordId }, data: updateData }));

  // Discord Embed Presentation
  let extraLoot = '';
  if (buffMessage) extraLoot += `\n${buffMessage}`;

  // Dynamic Highlight Reel Compilation
  let highlights = '';
  if (totalEvades > 0) highlights += `💨 Evaded **${totalEvades}** Attacks\n`;
  if (totalMitigated > 0) highlights += `🛡️ Blocked **${totalMitigated}** Damage\n`;
  if (totalLifesteal > 0) highlights += `🦇 Siphoned **${totalLifesteal}** HP\n`;
  if (totalCrits > 0) highlights += `💥 Landed **${totalCrits}** Critical Hits\n`;
  if (jackpotTriggered) highlights += `${jackpotMessage}\n`;

  let responseBody = `You swung your **${weaponName}** leading to an intense exchange. The ${mob.emoji} ${mob.name} retaliated against your **${armorName}**.\n\n**Combat Log (${rounds} Rounds):**\nDamage Dealt: 💥 ${totalDamageDealt}\nDamage Taken: 🩸 ${totalDamageTaken}\n\n`;

  if (highlights.length > 0) {
    responseBody += `**✨ Build Highlights:**\n${highlights}\n`;
  }

  responseBody += `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!** ${slotMultiplier >= 3 ? '🔥' : ''}\n\n🛍️ **Final Payout:** 🪙 ${goldReward} Gold | ✨ ${xpReward} XP\n`;

  if (mobDrops.length > 0) {
    let dropStrings = mobDrops.map(d => `${getEmoji(d.key)} \`[${d.qty}x ${d.name}]\``).join('\n');
    responseBody += dropStrings + '\n';
  }

  const styleDisplay = weaponClass === 'NONE' ? 'Unarmed' : weaponClass.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: ${mob.name}`)
    .setColor(jackpotTriggered || isSlotJackpot ? (weaponClass === 'FINESSE_WEAPON' ? 0xFF0000 : 0xFFD700) : 0x2B2D31)
    .setDescription(responseBody)
    .addFields(
      { name: 'Your Style', value: styleDisplay, inline: true },
      { name: 'Total Damage Output', value: `${totalDamageDealt} DMG`, inline: true }
    );

  if (buffMessage) embed.addFields({ name: 'Active Buff', value: buffMessage, inline: false });
  if (levelsGained > 0) embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel}**! (+${pointsGained} Stat Points). Type \`rpg stat\` to spend them!`});
  if (gachaLootString) embed.addFields({ name: '🎁 MYSTERY LOOT DROP!', value: `You found a rare blueprint schematic:\n${gachaLootString}`});

  await prisma.$transaction(dbOperations);

  return message.reply({ embeds: [embed] });
}
