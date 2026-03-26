import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';

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

  // --- THE ADRENALINE SLOT MACHINE ---
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const d3 = Math.floor(Math.random() * 6) + 1;
  let slotMultiplier = d1 + d2 + d3;
  let isSlotJackpot = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    slotMultiplier = slotMultiplier * slotMultiplier; // Square the multiplier on three of a kind!
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

  // Baseline Engine Stats
  let baseDamage = 10;
  let linesOfExecution = 1;
  // --- ECONOMY REWARDS ---
  let baseGold = 5;
  let baseXP = Math.floor(Math.random() * 21) + 15; // 15 to 35
  
  let goldReward = baseGold * slotMultiplier;
  let xpReward = baseXP * slotMultiplier;
  
  let craftingItemDrop: string | null = null;
  let jackpotTriggered = false;
  let jackpotMessage = '';
  
  // The HP Penalty
  let damageTaken = Math.floor(Math.random() * 8) + 3; // 3 to 10 damage per hunt
  
  // Apply Flat Damage Reduction from Armor + Class Armor Passives
  let mitigated = Math.floor(gearDef / 2); // 2 DEF = 1 Damage absorbed
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

      // FINESSE: Combat Style = Fast Crits | Special Thing = Loot Hoarder
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        baseDamage = Math.floor(baseDamage * 2.5); // The satisfying crit
        goldReward = 50 * slotMultiplier; // The Loot Hoarder economy injector
        jackpotMessage = '🗡️ **ASSASSIN\'S CRIT!** You found a massive stash of pure gold!';
      }
      break;
    }
    case 'HEAVY_WEAPON': {
      baseDamage = player.str * 5; 

      // HEAVY: Combat Style = Heavy Hits | Special Thing = Crafting Master
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        baseDamage = 9999;
        craftingItemDrop = "rare_meteorite_ingot"; // The Crafting Master unique drop
        jackpotMessage = '🪓 **DECAPITATION!** You shattered their armor and salvaged a Rare Meteorite Ingot!';
      }
      break;
    }
    case 'MAGIC_WEAPON': {
      const dmgMultiplier = player.int / Math.max(1, player.str);
      baseDamage = Math.floor(20 * dmgMultiplier);

      // MAGIC: Combat Style = Magic | Special Thing = EXP Booster
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        xpReward = 50 * slotMultiplier; // The EXP Booster progression multiplier
        jackpotMessage = '🎇 **WILD MAGIC!** You absorbed the chaotic leylines for a massive EXP Surge!';
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
  const monsters = [
    { name: 'Goblin Scout', emoji: '👺', loot: [{ key: 'goblin_ear', name: 'Goblin Ear', chance: 0.4 }, { key: 'rusty_dagger', name: 'Rusty Dagger', chance: 0.1 }] },
    { name: 'Acid Slime', emoji: '💧', loot: [{ key: 'slime_core', name: 'Slime Core', chance: 0.5 }, { key: 'acid_vial', name: 'Acid Vial', chance: 0.15 }] },
    { name: 'Dire Wolf', emoji: '🐺', loot: [{ key: 'wolf_pelt', name: 'Wolf Pelt', chance: 0.4 }, { key: 'wolf_fang', name: 'Wolf Fang', chance: 0.2 }] },
    { name: 'Cave Bat', emoji: '🦇', loot: [{ key: 'bat_wing', name: 'Bat Wing', chance: 0.4 }, { key: 'guano', name: 'Guano', chance: 0.1 }] },
    { name: 'Skeleton Warrior', emoji: '💀', loot: [{ key: 'bone_shard', name: 'Bone Shard', chance: 0.5 }, { key: 'iron_ingot', name: 'Iron Ingot', chance: 0.05 }] },
    { name: 'Forest Treant', emoji: '🌳', loot: [{ key: 'living_wood', name: 'Living Wood', chance: 0.3 }, { key: 'moon_herb', name: 'Moon Herb', chance: 0.05 }] },
    { name: 'Rock Golem', emoji: '🪨', loot: [{ key: 'stone_core', name: 'Stone Core', chance: 0.3 }, { key: 'gold_ore', name: 'Gold Ore', chance: 0.1 }] },
    { name: 'Lesser Demon', emoji: '👿', loot: [{ key: 'demon_horn', name: 'Demon Horn', chance: 0.2 }, { key: 'hellfire_essence', name: 'Hellfire Essence', chance: 0.05 }] },
    { name: 'Shadow Stalker', emoji: '🌑', loot: [{ key: 'shadow_dust', name: 'Shadow Dust', chance: 0.2 }, { key: 'void_fragment', name: 'Void Fragment', chance: 0.01 }] },
    { name: 'Mythic Drake', emoji: '🐉', loot: [{ key: 'drake_scale', name: 'Drake Scale', chance: 0.1 }, { key: 'mythic_dragon_scale', name: 'Mythic Dragon Scale', chance: 0.02 }] },
  ];
  const mob = monsters[Math.floor(Math.random() * monsters.length)];
  let monsterDropStrings: string[] = [];

  for (const item of mob.loot) {
    if (Math.random() <= item.chance) {
      monsterDropStrings.push(`🦴 \`[1x ${item.name}]\``);
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: item.key } },
        update: { quantity: { increment: 1 } },
        create: { playerId: player.id, itemKey: item.key, quantity: 1 }
      }));
    }
  }
  let monsterDropString = monsterDropStrings.join('\n');

  // --- THE GACHA LOOT SYSTEM ---
  const COMMON_BPS = [{key: 'blueprint_iron_sword', name:'Iron Sword'}, {key:'blueprint_iron_dagger', name:'Iron Dagger'}, {key:'blueprint_wood_staff', name:'Wood Staff'}, {key:'blueprint_bone_scythe', name:'Bone Scythe'}, {key:'blueprint_iron_helmet', name:'Iron Helmet'}, {key:'blueprint_iron_chestplate', name:'Iron Chestplate'}, {key:'blueprint_iron_boots', name:'Iron Boots'}];
  const UNCOMMON_BPS = [{key: 'blueprint_steel_greatsword', name:'Steel Greatsword'}, {key:'blueprint_venom_shiv', name:'Venom Shiv'}, {key:'blueprint_moonlight_staff', name:'Moonlight Staff'}, {key:'blueprint_soul_reaper', name:'Soul Reaper'}];
  const EPIC_BPS = [{key: 'blueprint_mythril_cleaver', name:'Mythril Cleaver'}, {key:'blueprint_shadow_blade', name:'Shadow Blade'}, {key:'blueprint_meteor_staff', name:'Meteor Staff'}, {key:'blueprint_lich_tome', name:'Lich Tome'}, {key:'blueprint_wolf_slayer', name:'Wolf Slayer Sword'}];
  
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

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: ${mob.name}`)
    .setColor(jackpotTriggered || isSlotJackpot ? (weaponClass === 'FINESSE_WEAPON' ? 0xFF0000 : 0xFFD700) : 0x2B2D31)
    .setDescription(`You swung your **${weaponName}** resulting in a rapid clash. The ${mob.emoji} ${mob.name} retaliated against your **${armorName}**.\n\n**Combat Log:**\nDamage Dealt: 💥 ${critText}${baseDamage}${vampText}\nDamage Taken: 🩸 ${damageTaken}${evadedText}\n\n${slotMachineString}\n\n🛍️ **Final Payout:** 🪙 ${goldReward} Gold | ✨ ${xpReward} XP${extraLoot}\n\n`)
    .addFields(
      { name: 'Your Style', value: weaponClass, inline: true },
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
