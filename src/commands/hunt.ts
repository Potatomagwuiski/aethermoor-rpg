import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import redisClient from '../redis.js';
import { getEmoji } from '../utils/emojis.js';

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

  // Baseline Engine Stats
  let baseDamage = 10;
  let linesOfExecution = 1;
  // --- ECONOMY REWARDS ---
  let baseGold = 5 * tier;
  let baseXP = Math.floor(Math.random() * 21 * tier) + (15 * tier); 
  
  let goldReward = baseGold * slotMultiplier;
  let xpReward = baseXP * slotMultiplier;
  
  let craftingItemDrop: string | null = null;
  let jackpotTriggered = false;
  let jackpotMessage = '';
  
  // The HP Penalty - Monsters now deal damage scaling deeply with Zone Tier & Level
  let baseEnemyThreat = Math.floor(tier * (5 + (player.level * 1.5))); 
  let damageTaken = Math.floor(Math.random() * baseEnemyThreat) + Math.floor(baseEnemyThreat / 2);
  
  // Apply Flat Damage Reduction from Armor + Class Armor Passives
  let mitigated = Math.floor(gearDef * 0.75); // 1 DEF = 0.75 Damage Absorbed
  if (armorClass === 'HEAVY_ARMOR') {
    damageTaken = Math.floor(damageTaken * 0.9); // 10% Flat mitigation
  } else if (armorClass === 'LIGHT_ARMOR') {
    gearEvasion += 15; // +15% Flat Evasion
  } else if (armorClass === 'CLOTH') {
    // Regenerate 5% Max HP at the end of combat (Mana Shield)
    damageTaken -= Math.floor(player.maxHp * 0.05); 
  }
  
  damageTaken -= mitigated;

  let evadedText = '';
  if (Math.random() * 100 < gearEvasion) {
    damageTaken = 0; // Negative damage means heal, but you don't heal if you perfectly evade.
    evadedText = ' 💨 (Dodged!)';
  }

  // Gear-Specific Instant Mathematics & Rewards (The "You Are What You Wear" systemic injection)
  switch (weaponClass) {
    case 'FINESSE_WEAPON': {
      const dmgMultiplier = player.agi / Math.max(1, player.end);
      baseDamage = Math.floor(15 * dmgMultiplier);

      // FINESSE: Combat Style = Fast Crits | Special = Pickpocket
      if (Math.random() > 0.95) {
        jackpotTriggered = true;
        baseDamage = Math.floor(baseDamage * 2.5); 
        goldReward += 15 * slotMultiplier;
        jackpotMessage = '🗡️ **ASSASSIN\'S CRIT!** You found a hidden coin purse on the monster!';
      }
      break;
    }
    case 'HEAVY_WEAPON': {
      baseDamage = player.str * 5; 

      // HEAVY: Combat Style = Heavy Hits | Special = Sunder
      if (Math.random() > 0.95) {
        jackpotTriggered = true;
        baseDamage = Math.floor(baseDamage * 3);
        craftingItemDrop = "gold_ore"; 
        jackpotMessage = '🪓 **SUNDERING STRIKE!** You shattered their defenses and salvaged some Gold Ore!';
      }
      break;
    }
    case 'MAGIC_WEAPON': {
      const dmgMultiplier = player.int / Math.max(1, player.str);
      baseDamage = Math.floor(20 * dmgMultiplier);

      // MAGIC: Combat Style = Magic | Special = EXP Surge
      if (Math.random() > 0.95) {
        jackpotTriggered = true;
        xpReward += 15 * slotMultiplier; 
        jackpotMessage = '🎇 **WILD MAGIC!** You absorbed the chaotic leylines for an EXP Surge!';
      }
      break;
    }
    default:
      baseDamage = 5;
      break;
  }

  // Inject Gear ATK
  baseDamage += gearAtk;

  // Evaluate Crit from Weapons
  let critText = '';
  if (Math.random() * 100 < gearCrit) {
    baseDamage = Math.floor(baseDamage * 2);
    critText = '💥 (CRIT!) ';
  }

  // Evaluate Lifesteal from Weapons
  let lifestealHeal = 0;
  let vampText = '';
  if (gearLifesteal > 0) {
    lifestealHeal = Math.floor(baseDamage * (gearLifesteal / 100));
    if (lifestealHeal > 0) vampText = ` 🦇 (+${lifestealHeal} HP)`;
  }

  // Provide Leveling Engine Logic
  let currentLevel = player.level;
  let currentXp = player.xp + xpReward;
  let pointsGained = 0;

  while (currentXp >= currentLevel * 100) {
    currentXp -= currentLevel * 100;
    currentLevel++;
    pointsGained += 3;
  }

  const levelsGained = currentLevel - player.level;

  // Handle Database Transactions for Real Rewards
  const newHpCalc = Math.min(player.maxHp, player.hp - damageTaken + lifestealHeal);

  const updateData: any = {
    gold: { increment: goldReward },
    level: currentLevel,
    xp: currentXp,
    hp: newHpCalc
  };

  if (levelsGained > 0) {
    updateData.pointsAvailable = { increment: pointsGained };
  }

  const dbOperations = [];
  dbOperations.push(prisma.player.update({
    where: { discordId },
    data: updateData
  }));

  if (craftingItemDrop) {
    dbOperations.push(prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: craftingItemDrop } },
      update: { quantity: { increment: 1 } },
      create: { playerId: player.id, itemKey: craftingItemDrop, quantity: 1 }
    }));
  }


  // --- MONSTER GENERATION & LOOT ---
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
  let monsterDropStrings: string[] = [];

  for (const item of mob.loot) {
    if (Math.random() <= item.chance) {
      monsterDropStrings.push(`${getEmoji(item.key)} \`[${slotMultiplier}x ${item.name}]\``);
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: item.key } },
        update: { quantity: { increment: slotMultiplier } },
        create: { playerId: player.id, itemKey: item.key, quantity: slotMultiplier }
      }));
    }
  }
  let monsterDropString = monsterDropStrings.join('\n');

  // --- THE GACHA LOOT SYSTEM ---
  const COMMON_BPS = [{key: 'blueprint_iron_sword', name:'Iron Sword'}, {key:'blueprint_iron_dagger', name:'Iron Dagger'}, {key:'blueprint_wood_staff', name:'Wood Staff'}, {key:'blueprint_bone_scythe', name:'Bone Scythe'}, {key:'blueprint_iron_helmet', name:'Iron Helmet'}, {key:'blueprint_iron_chestplate', name:'Iron Chestplate'}, {key:'blueprint_iron_boots', name:'Iron Boots'}, {key:'blueprint_iron_pickaxe', name:'Iron Pickaxe'}, {key:'blueprint_iron_axe', name:'Iron Axe'}];
  const UNCOMMON_BPS = [{key: 'blueprint_steel_greatsword', name:'Steel Greatsword'}, {key:'blueprint_venom_shiv', name:'Venom Shiv'}, {key:'blueprint_moonlight_staff', name:'Moonlight Staff'}, {key:'blueprint_soul_reaper', name:'Soul Reaper'}, {key:'blueprint_steel_pickaxe', name:'Steel Pickaxe'}, {key:'blueprint_steel_axe', name:'Steel Axe'}];
  const EPIC_BPS = [{key: 'blueprint_mythril_cleaver', name:'Mythril Cleaver'}, {key:'blueprint_shadow_blade', name:'Shadow Blade'}, {key:'blueprint_meteor_staff', name:'Meteor Staff'}, {key:'blueprint_lich_tome', name:'Lich Tome'}, {key:'blueprint_wolf_slayer', name:'Wolf Slayer Sword'}, {key:'blueprint_mythril_pickaxe', name:'Mythril Pickaxe'}, {key:'blueprint_mythril_axe', name:'Mythril Axe'}];
  
  let gachaLootString = '';
  if (Math.random() <= 0.25) { // 25% chance to trigger an item drop
    const rarityRoll = Math.random();
    let dropKey = '';

    if (rarityRoll > 0.999) {
      gachaLootString = '🟧 `[✨ Blueprint: Void Blade ✨]`';
      dropKey = 'blueprint_void_blade';
    }
    else if (rarityRoll > 0.95) {
      const bp = EPIC_BPS[Math.floor(Math.random() * EPIC_BPS.length)];
      gachaLootString = `🟪 \`[Blueprint: ${bp.name}]\``;
      dropKey = bp.key;
    }
    else if (rarityRoll > 0.90) {
      gachaLootString = '🗝️ `[Dungeon Key]`';
      dropKey = 'dungeon_key';
    }
    else if (rarityRoll > 0.70) {
      const bp = UNCOMMON_BPS[Math.floor(Math.random() * UNCOMMON_BPS.length)];
      gachaLootString = `🟦 \`[Blueprint: ${bp.name}]\``;
      dropKey = bp.key;
    }
    else {
      const bp = COMMON_BPS[Math.floor(Math.random() * COMMON_BPS.length)];
      gachaLootString = `⬜ \`[Blueprint: ${bp.name}]\``;
      dropKey = bp.key;
    }

    if (dropKey) {
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: dropKey } },
        update: { quantity: { increment: 1 } },
        create: { playerId: player.id, itemKey: dropKey, quantity: 1 }
      }));
    }
  }

  // Format the Dopamine Delivery
  let extraLoot = '';
  if (monsterDropString) extraLoot += `\n${monsterDropString}`;

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${slotMultiplier}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }

  const styleDisplay = weaponClass === 'NONE' ? 'Unarmed' : weaponClass.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: ${mob.name}`)
    .setColor(jackpotTriggered || isSlotJackpot ? (weaponClass === 'FINESSE_WEAPON' ? 0xFF0000 : 0xFFD700) : 0x2B2D31)
    .setDescription(`You swung your **${weaponName}** resulting in a rapid clash. The ${mob.emoji} ${mob.name} retaliated against your **${armorName}**.\n\n**Combat Log:**\nDamage Dealt: 💥 ${critText}${baseDamage}${vampText}\nDamage Taken: 🩸 ${damageTaken}${evadedText}\n\n${slotMachineString}\n\n🛍️ **Final Payout:** 🪙 ${goldReward} Gold | ✨ ${xpReward} XP${extraLoot}\n\n`)
    .addFields(
      { name: 'Your Style', value: styleDisplay, inline: true },
      { name: 'Raw Damage Output', value: jackpotTriggered && weaponClass === 'FINESSE_WEAPON' ? `**💥 ${baseDamage} CRIT! 💥**` : `${baseDamage} DMG`, inline: true }
    );

  if (jackpotTriggered) {
    embed.addFields({ name: '!!! JACKPOT !!!', value: jackpotMessage });
    if (weaponClass === 'FINESSE_WEAPON') embed.addFields({ name: 'Loot Stolen', value: `💰 +${goldReward} Gold`});
    if (weaponClass === 'MAGIC_WEAPON') embed.addFields({ name: 'Knowledge Gained', value: `✨ +${xpReward} EXP`});
    if (weaponClass === 'HEAVY_WEAPON') embed.addFields({ name: 'Salvaged Material', value: `🔨 1x Rare Meteorite Ingot`});
  } else {
    embed.addFields({ name: 'Rewards', value: `+${goldReward} Gold, +${xpReward} EXP` });
  }

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel}**! (+${pointsGained} Stat Points). Type \`rpg stat\` to spend them!`});
  }

  // Inject Gacha visual pulling addiction
  if (gachaLootString) {
    embed.addFields({ name: '🎁 MYSTERY LOOT DROP!', value: `You found a rare blueprint schematic:\n${gachaLootString}`});
  }

  await prisma.$transaction(dbOperations);

  return message.reply({ embeds: [embed] });
}
