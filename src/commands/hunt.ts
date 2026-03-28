import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import redisClient from '../redis.js';
import { enforceCooldown } from '../utils/cooldown.js';
import { getEmoji } from '../utils/emojis.js';
import { BLUEPRINTS } from './forge.js';
import { getPinnedTrackerField } from '../utils/tracker.js';

export async function execute(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
        equipment: {
            where: { equipped: true }
        },
        recipes: true
    }
  });

  if (!player) {
    return message.reply('You have not created a character yet!');
  }

  if (player.hp <= 0) {
    return message.reply('💀 **YOU ARE DEAD.**\nYou cannot hunt until your body is restored. Buy a 🧪 **[Life Potion]** from the `rpg shop` and type `rpg heal`.');
  }

  const cdKey = `cooldown:hunt:${discordId}`;
  const cd = await enforceCooldown(cdKey, 30);
  if (cd.onCooldown) {
    return message.reply(`⏳ **Exhausted!** You are still recovering from your last hunt. Wait ${Math.ceil(cd.remainingMs / 1000)} seconds!`);
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
  let hasWeapon = false;
  let weaponRarity = 'COMMON';
  let activeAbilities: string[] = [];

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

    if (BLUEPRINTS[baseKey]) {
        const bp = BLUEPRINTS[baseKey];
        if (bp.outputs[rarityLabel]) {
            const baseStats = bp.outputs[rarityLabel];
            if (baseStats.dps) gearAtk += baseStats.dps;
            if (baseStats.defense) gearDef += baseStats.defense;
        }

        if (bp.abilities) {
            if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarityLabel) && bp.abilities.length > 0) activeAbilities.push(bp.abilities[0]);
            if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarityLabel) && bp.abilities.length > 1) activeAbilities.push(bp.abilities[1]);
            if (['rare', 'epic', 'legendary'].includes(rarityLabel) && bp.abilities.length > 2) activeAbilities.push(bp.abilities[2]);
            if (['epic', 'legendary'].includes(rarityLabel) && bp.abilities.length > 3) activeAbilities.push(bp.abilities[3]);
            if (['legendary'].includes(rarityLabel) && bp.abilities.length > 4) activeAbilities.push(bp.abilities[4]);
        }
    }

    if (eq.slot === 'WEAPON') {
      weaponName = eq.name || weaponName;
      weaponClass = eq.equipmentClass;
      hasWeapon = true;
      weaponRarity = rarityLabel.toUpperCase();
    }
    if (eq.slot === 'ARMOR') {
      armorName = eq.name || armorName;
      armorClass = eq.equipmentClass;
    }
  }

  // --- THE ADRENALINE SLOT MACHINE (1% JACKPOT CAP) ---
  const diceFaces = 10;
  let slotBonus = 0;
  
  if (hasWeapon) {
      if (weaponRarity === 'UNCOMMON') slotBonus = 5;
      else if (weaponRarity === 'RARE') slotBonus = 10;
      else if (weaponRarity === 'EPIC') slotBonus = 20;
      else if (weaponRarity === 'LEGENDARY') slotBonus = 50;
  }

  const d1 = Math.floor(Math.random() * diceFaces) + 1;
  let d2 = Math.floor(Math.random() * diceFaces) + 1;
  let d3 = Math.floor(Math.random() * diceFaces) + 1;

  // The Rarity Rig: Powerful weapons manipulate RNG fabric
  if (Math.random() * 100 < slotBonus) {
      d2 = d1; // Guaranteed 3x Match
      // Tame the endgame inflation: 1/4th chance to jump from a Match to a full Jackpot
      if (Math.random() * 100 < (slotBonus / 4)) d3 = d1;
  }
  let slotMultiplier = 1;
  let isSlotJackpot = false;
  let isSlotMatch = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    // Keep it massive for the 1%
    slotMultiplier = 20; 
  } else if (d1 === d2 || d2 === d3 || d1 === d3) {
    isSlotMatch = true;
    // A 27% natural baseline chance, making the slot machine bounce constantly!
    slotMultiplier = 3; 
  }


  const currentZone = player.location || 'lumina_plains';
  const zoneTiers: Record<string, number> = { lumina_plains: 1, whispering_woods: 2, ironpeak_mountains: 3, ashen_wastes: 5, abyssal_depths: 10 };
  const tier = zoneTiers[currentZone] || 1;

  // --- MONSTER GENERATION HOIST ---
  const ZONED_MOBS: Record<string, any[]> = {
    lumina_plains: [
      { name: 'Acid Slime', emoji: '💧', loot: [{ key: 'slime_gel', name: 'Slime Gel', chance: 0.5 }] },
      { name: 'Goblin Scout', emoji: '👺', loot: [{ key: 'goblin_ear', name: 'Goblin Ear', chance: 0.4 }] },
      { name: 'Cave Bat', emoji: '🦇', loot: [{ key: 'bat_wing', name: 'Bat Wing', chance: 0.4 }] }
    ],
    whispering_woods: [
      { name: 'Dire Wolf', emoji: '🐺', loot: [{ key: 'wolf_pelt', name: 'Wolf Pelt', chance: 0.4 }] },
      { name: 'Forest Treant', emoji: '🌳', loot: [{ key: 'living_bark', name: 'Living Bark', chance: 0.3 }] }
    ],
    ironpeak_mountains: [
      { name: 'Skeleton Warrior', emoji: '💀', loot: [{ key: 'brittle_bone', name: 'Brittle Bone', chance: 0.5 }] },
      { name: 'Rock Golem', emoji: '🪨', loot: [{ key: 'golem_rubble', name: 'Golem Rubble', chance: 0.3 }] }
    ],
    ashen_wastes: [
      { name: 'Lesser Demon', emoji: '👿', loot: [{ key: 'demon_horn', name: 'Demon Horn', chance: 0.4 }] },
      { name: 'Shadow Stalker', emoji: '🌑', loot: [{ key: 'shadow_dust', name: 'Shadow Dust', chance: 0.3 }] }
    ],
    abyssal_depths: [
      { name: 'Mythic Drake', emoji: '🐉', loot: [{ key: 'drake_scale', name: 'Drake Scale', chance: 0.5 }] },
      { name: 'Abyssal Lich', emoji: '🧙‍♂️', loot: [{ key: 'lich_phylactery', name: 'Lich Phylactery', chance: 0.4 }] }
    ]
  };

  const monsters = ZONED_MOBS[currentZone] || ZONED_MOBS['lumina_plains'];
  const mob = monsters[Math.floor(Math.random() * monsters.length)];

  // --- PRE-COMBAT CULINARY BUFF PARSING ---
  let buffMessage = '';
  let activeBuff = player.activeBuff;
  let activeHot = 0;
  let activeEot = 0;
  if (activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
    if (activeBuff === 'ATK_10_HOT_5') { gearAtk += 10; activeHot = 5; buffMessage = '✨ **Buff Active:** Roasted Trout (+10 ATK, Heals 5 HP / Round)'; }
    if (activeBuff === 'ATK_25_HOT_10') { gearAtk += 25; activeHot = 10; buffMessage = '✨ **Buff Active:** Golden Skewer (+25 ATK, Heals 10 HP / Round)'; }
    if (activeBuff === 'ATK_60_HOT_20') { gearAtk += 60; activeHot = 20; buffMessage = '✨ **Buff Active:** Glacier Stew (+60 ATK, Heals 20 HP / Round)'; }
    if (activeBuff === 'ATK_120_HOT_40') { gearAtk += 120; activeHot = 40; buffMessage = '✨ **Buff Active:** Lava-Seared Eel (+120 ATK, Heals 40 HP / Round)'; }
    if (activeBuff === 'ATK_250_HOT_80') { gearAtk += 250; activeHot = 80; buffMessage = '✨ **Buff Active:** Abyssal Feast (+250 ATK, Heals 80 HP / Round)'; }
    if (activeBuff === 'HP_25') { player.maxHp += 25; player.hp += 25; buffMessage = '✨ **Buff Active:** Koi Soup (+25 MAX HP)'; }
    if (activeBuff === 'DEF_50') { gearDef += 50; buffMessage = '✨ **Buff Active:** Glacial Filet (+50 DEF)'; }
    if (activeBuff === 'CRIT_15') { gearCrit += 15; buffMessage = '✨ **Buff Active:** Spicy Eel (+15% CRIT)'; }
    if (activeBuff === 'ATK_100_LS_10') { gearAtk += 100; gearLifesteal += 10; buffMessage = '✨ **Buff Active:** Void Sashimi (+100 ATK, 10% LIFESTEAL)'; }
    if (activeBuff === 'HOT_10') { activeHot = 10; buffMessage = '✨ **Buff Active:** Moonlight Brew (Heals 10 HP / Round)'; }
    if (activeBuff === 'EOT_5') { activeEot = 5; buffMessage = '✨ **Buff Active:** Starlight Infusion (+5 Energy / Round)'; }
  } else if (activeBuff) {
    await prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } });
    activeBuff = null;
  }

  // --- THE AUTO-BATTLER PHYSICS LOOP ---
  // Phase 27 Early-Game Rebalance: Removed massive baseline bloating.
  // Phase 35 Late-Game Rebalance: Monsters now scale exponentially with their Tier.
  let monsterMaxHp = Math.floor((tier * 25) + (player.level * 10 * tier));
  let monsterHp = monsterMaxHp;
  // Attack Power also scales logarithmically by geographic region.
  let monsterAttackPower = Math.floor((tier * 5) + (player.level * 2 * tier));

  let playerHp = player.hp;
  if (playerHp <= 0) playerHp = 1;

  let jackpotTriggered = false;
  let jackpotMessage = '';
  let craftingItemDrop: string | null = null;
  
  // Base Damage Injection via Class Type (Heavily nerfed to force reliance on gear)
  let playerBaseOutput = Math.floor(player.level * 2);
  if (weaponClass === 'FINESSE_WEAPON') playerBaseOutput += Math.floor(player.agi * 1.5);
  if (weaponClass === 'HEAVY_WEAPON') playerBaseOutput += Math.floor(player.str * 2);
  if (weaponClass === 'MAGIC_WEAPON') playerBaseOutput += Math.floor(player.int * 2.5);

  // --- ABILITY INJECTION (PRE-COMBAT) ---
  let bonusCrit = 0;
  let bonusEvasion = 0;
  let bonusDefPerc = 0;
  let lifestealGained = 0;
  let abilityHighlights = '';

  let hasUndying = false;
  let undyingTriggered = false;
  let totalBurnDamage = 0;
  let totalPoisonDamage = 0;
  let totalBleedDamage = 0;
  let hasLichKing = false;

  for (const ab of activeAbilities) {
      if (!ab) continue;
      
      const pctMatch = ab.match(/[+\s]?(\d+)%/);
      if (pctMatch) {
          const val = parseInt(pctMatch[1]);
          if (ab.includes('Evasion') || ab.includes('Dodge') || ab.includes('Swiftness')) bonusEvasion += val;
          if (ab.includes('Critical') || ab.includes('Crit') || ab.includes('Focus')) bonusCrit += val;
      }
      
      const flatDefMatch = ab.match(/grants (\d+) bonus DEF/i) || ab.match(/blocks (\d+) incoming/i);
      if (flatDefMatch) gearDef += parseInt(flatDefMatch[1]);
      if (ab.includes('Stalwart')) gearDef += 5;

      const flatHpMatch = ab.match(/\+(\d+) Max HP/i);
      if (flatHpMatch) playerHp += parseInt(flatHpMatch[1]);
      
      const reducedDmgMatch = ab.match(/physical damage by (\d+)%/i) || ab.match(/physical damage taken by (\d+)%/i);
      if (reducedDmgMatch) bonusDefPerc += parseInt(reducedDmgMatch[1]);

      if (ab.includes('Undying') || ab.includes('Phylactery')) hasUndying = true;
      if (ab.includes('Lich King')) hasLichKing = true;
      
      // New Pre-Combat Abilities
      if (ab.includes('Bloodlust')) gearLifesteal += 5;
      if (ab.includes('Void Touched')) gearLifesteal += 5;
      if (ab.includes('Reap')) gearLifesteal += 10;
      if (ab.includes('Attuned')) player.energy += 5;
      if (ab.includes('Woven Magic')) player.energy += 5;
      if (ab.includes('Light Fabric')) player.energy += 1;
      if (ab.includes('Archmage')) player.energy += 15;
      if (ab.includes('Dark Whisper')) player.int += 5;
      if (ab.includes('Soul Devourer')) gearLifesteal += 15;
      if (ab.includes('Bone Armor')) gearDef += Math.floor(player.int * 0.5);
      if (ab.includes('Veil of Night')) {
          const evTransfer = Math.floor(gearEvasion * 0.2);
          gearEvasion -= evTransfer;
          gearDef += evTransfer;
      }
  }

  // Class Passives prep
  if (armorClass === 'LIGHT_ARMOR') gearEvasion += 15;
  
  // Base Stat Natural Scaling
  gearCrit += bonusCrit + Math.floor(player.int * 0.5); // Every 2 INT = 1% Crit
  gearEvasion += bonusEvasion + Math.floor(player.agi * 0.5); // Every 2 AGI = 1% Dodge
  let baseMitigation = Math.floor(gearDef * 0.75) + Math.floor(player.end * 1); // Natural block

  let rounds = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let totalLifesteal = 0;
  let totalEvades = 0;
  let totalCrits = 0;
  let totalMitigated = 0;

  let bleedStacks = 0;
  let poisonStacks = 0;
  let momentumBonus = 1.0;
  let totalPoisonMitigated = 0;
  let totalExecutionerBurst = 0;

  const MAX_ROUNDS = 20;
  let combatLog: string[] = [];

  while (playerHp > 0 && monsterHp > 0 && rounds < MAX_ROUNDS) {
    rounds++;
    let roundTitle = `**Round ${rounds}**`;
    let roundActions: string[] = [];

    // 1. Player Attacks!
    let roundDps = playerBaseOutput + gearAtk;
    
    // Ramp-up Build
    if (activeAbilities.join(',').includes('Relentless')) {
        momentumBonus += 0.10;
        roundDps = Math.floor(roundDps * momentumBonus);
    }
    
    // Process Active Weapon Abilities!
    let abilityMsg = '';
    for (const ab of activeAbilities) {
        if (!ab) continue;
        if (ab.includes('Sharpened') || ab.includes('Base Damage')) roundDps += Math.floor(roundDps * 0.05);
        if (ab.includes('Heavy Strike') && rounds === 1) roundDps += Math.floor(roundDps * 0.10);
        if (ab.includes('Fleetfoot') && rounds === 1) { monsterHp -= 5; totalDamageDealt += 5; }
        if (ab.includes('Lone Wolf')) roundDps += Math.floor(roundDps * 0.15);
        if (ab.includes('Backstab') && rounds === 1) roundDps += Math.floor(roundDps * 0.25);
        
        if (ab.includes('Assassin') && weaponClass === 'FINESSE_WEAPON') {
            const pctMatch = ab.match(/(\d+)%/);
            const amt = pctMatch ? parseInt(pctMatch[1]) / 100 : 0.10;
            roundDps += Math.floor(roundDps * amt);
        }
        
        if (ab.includes('Poison') || ab.includes('Venom')) {
            const p = ab.includes('Lethal Dose') && monsterHp < (monsterMaxHp * 0.5) ? 100 : 50;
            roundDps += p; totalPoisonDamage += p;
        }
        if (ab.includes('Ignite') || ab.includes('Burn')) {
            const b = 100; roundDps += b; totalBurnDamage += b;
        }
        if (ab.includes('Serrated Edge') || ab.includes('Rend') || ab.includes('Bleed') || ab.includes('Deep Wounds') || ab.includes('Grievous')) {
            const dmgMatch = ab.match(/(\d+) DMG/);
            const bl = dmgMatch ? parseInt(dmgMatch[1]) : 25;
            roundDps += bl; totalBleedDamage += bl;
        }
        
        // --- NEW WEAPON ABILITIES ---
        if (ab.includes('Cleave') && !mob.name.includes('Boss')) {
            roundDps += Math.floor(roundDps * 0.10);
        }
        if (ab.includes('Beastbane') && (mob.name.includes('Wolf') || mob.name.includes('Beast') || mob.name.includes('Bear'))) {
            roundDps += Math.floor(roundDps * 0.50);
        }
        if (ab.includes('Grave Digger') && (mob.name.includes('Lich') || mob.name.includes('Skeleton') || mob.name.includes('Ghoul'))) {
            roundDps += Math.floor(roundDps * 0.25);
        }
        if (ab.includes('Mythril Edge') || ab.includes('Spectral Edge')) {
            roundDps += Math.floor(roundDps * 0.10);
        }
        if (ab.includes('Armor Breaker') && rounds === 1) {
            roundDps = Math.floor(roundDps * 1.50);
            abilityMsg += '🌟 `Armor Breaker` shattered enemy defenses!';
        }
        if (ab.includes('Alpha Predator') && (mob.name.includes('Wolf') || mob.name.includes('Beast') || mob.name.includes('Bear'))) {
            roundDps += Math.floor(roundDps * 0.25);
        }
        if (ab.includes('Mana Tap') || ab.includes('Serenity')) {
            playerHp = Math.min(player.maxHp, playerHp + 10);
        }
        if (ab.includes('Ember') || ab.includes('Molten Core')) {
            roundDps += 25;
        }
        if (ab.includes('Arcane Overflow') && Math.random() > 0.90) {
            roundDps += 125;
            abilityMsg += '🌟 `Arcane Overflow` triggered 5x Embers!';
        }
        if (ab.includes('Plague')) {
            monsterAttackPower = Math.floor(monsterAttackPower * 0.90);
        }
        if (ab.includes('Eclipse') && Math.random() > 0.90) {
            monsterAttackPower = Math.floor(monsterAttackPower * 0.50);
        }
        
        let meteorChance = ab.includes('Apocalypse') && (mob.name.includes('Drake') || mob.name.includes('Lich')) ? 0.70 : 0.90;
        if (ab.includes('Meteor') && Math.random() > meteorChance) {
            roundDps += 1500;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌋 **METEOR IMPACT!** (1500 DMG)'; }
        }
        let executeThreshold = ab.includes('True Death') ? 0.40 : 0.30;
        if (ab.includes('Execute') && monsterHp < (monsterMaxHp * executeThreshold) && Math.random() > 0.90) {
            roundDps += 9999;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '💀 **EXECUTED!**'; }
        }
        if (ab.includes('Event Horizon') && Math.random() > 0.95 && !mob.name.includes('Boss')) {
            monsterHp = 0;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌑 **EVENT HORIZON!** (Banished)'; }
        }
        if (ab.includes('Assassinate') && Math.random() > 0.85) {
            roundDps += 9999;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🔪 **ASSASSINATED!**'; }
        }
        if (ab.includes('Void Strike') && Math.random() > 0.85) {
            roundDps += Math.floor(roundDps * 0.50);
        }
        if (ab.includes('Heroic Legacy') && Math.random() > 0.95) {
            roundDps *= 2;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌟 **HEROIC LEGACY!** (Damage Doubled!)'; }
        }
        if (ab.includes('Earthquake') && Math.random() > 0.90) {
            roundDps *= 2;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌟 **EARTHQUAKE STUN!** (Massive Damage)'; }
        }
        if (ab.includes('Shadow Flurry') && Math.random() > 0.85) {
            roundDps *= 3;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌟 **SHADOW FLURRY!** (Attacked 3x)'; }
        }
        if (ab.includes('Abyssal Echo') && Math.random() > 0.75) {
            roundDps *= 2;
        }
        if (ab.includes('Windrunner') && Math.random() > 0.85) {
            roundDps *= 2;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌟 **WINDRUNNER!** (Attacked Twice!)'; }
        }
    }

    if (activeAbilities.join(',').includes('Armageddon') && Math.random() > 0.80) {
        roundDps += 10000;
        if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '☄️ **ARMAGEDDON!** (10,000 DMG)'; }
    }

    if (abilityMsg && !jackpotTriggered) {
        jackpotTriggered = true;
        jackpotMessage = abilityMsg;
    }

    if (rounds <= 3 && activeAbilities.join(',').includes('Full Moon')) gearCrit = 100;
    if (rounds === 1 && activeAbilities.join(',').includes('Ambush')) gearCrit = 100;
    
    let isCrit = false;
    let isExecute = false;
    if (Math.random() * 100 < gearCrit) {
      isCrit = true;
      if (activeAbilities.join(',').includes('Executioner')) {
          const baseCrit = Math.floor(roundDps * 2);
          const executionerCrit = Math.floor(roundDps * 3.5);
          roundDps = executionerCrit;
          totalExecutionerBurst += (executionerCrit - baseCrit);
          isExecute = true;
      } else {
          roundDps = Math.floor(roundDps * 2);
      }
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

    let pAttackStr = `🗡️ You dealt **${roundDps}** DMG.`;
    if (isExecute) pAttackStr = `💥 **CRITICAL EXECUTION!** You dealt **${roundDps}** DMG.`;
    else if (isCrit) pAttackStr = `💥 **CRIT!** You dealt **${roundDps}** DMG.`;

    // DoT Execution
    if (activeAbilities.join(',').includes('Hemorrhage')) bleedStacks++;
    if (bleedStacks > 0) {
        let tickTrueDmg = Math.floor(player.maxHp * 0.02 * bleedStacks);
        if (tickTrueDmg < 1) tickTrueDmg = 1;
        monsterHp -= tickTrueDmg;
        totalBleedDamage += tickTrueDmg;
        pAttackStr += ` 🩸 *[Hemorrhage: ${tickTrueDmg} true DMG]*`;
    }
    
    roundActions.push(`> ${pAttackStr}`);

    if (monsterHp <= 0) {
        roundActions.push(`> 💀 **${mob.name.toUpperCase()} WAS SLAIN!**`);
        combatLog.push(roundTitle + '\n' + roundActions.join('\n'));
        break; // Monster SLAIN!
    }

    // 2. Monster Counter-Attacks!
    let rawIncoming = Math.floor(Math.random() * monsterAttackPower) + Math.floor(monsterAttackPower / 2);

    // Debuff Logic
    if (activeAbilities.join(',').includes('Neurotoxin') && Math.random() < 0.30) {
        poisonStacks = Math.min(10, poisonStacks + 1); // 50% max reduction
    }
    if (poisonStacks > 0) {
        const poisonMitigation = Math.floor(rawIncoming * (0.05 * poisonStacks));
        rawIncoming -= poisonMitigation;
        totalPoisonMitigated += poisonMitigation;
    }
    
    // Mitigation Engine (END multiplier halved from x2 to x1 to prevent immortality)
    let mitigation = baseMitigation;
    
    // Armor Abilities!
    for (const ab of activeAbilities) {
        if (!ab) continue;
        if (ab.includes('Mana Shield')) rawIncoming = Math.floor(rawIncoming * 0.90);
        if (ab.includes('Sturdy')) rawIncoming = Math.floor(rawIncoming * 0.99);
        if (ab.includes('Plated')) rawIncoming = Math.floor(rawIncoming * 0.98);
        if (ab.includes('Hardened')) rawIncoming = Math.floor(rawIncoming * 0.97);
        if (ab.includes('Alloyed Armor')) rawIncoming = Math.floor(rawIncoming * 0.95);
        if (ab.includes('Shadow Step') && rounds === 1) rawIncoming = 0;
        if (ab.includes('Unseen Predator') && rounds === 1) rawIncoming = 0;
        if (ab.includes('Invulnerability') && rounds === 1) rawIncoming = 0;
        if (ab.includes('Deflection') && Math.random() > 0.98) rawIncoming = Math.floor(rawIncoming * 0.5);
        if (ab.includes('Smoke Bomb') && Math.random() > 0.85) rawIncoming = 0;
        if (ab.includes('Bulwark') && Math.random() > 0.95) rawIncoming = 0;
        if (ab.includes('Unbreakable') && playerHp < (player.maxHp * 0.25)) mitigation += 50;
        if (ab.includes('Lord of Death') && rounds === 1) mitigation += 100;
        if (ab.includes('Parry') && Math.random() > 0.95) rawIncoming = 0;
        if (ab.includes('Fireproof')) rawIncoming = Math.floor(rawIncoming * 0.95);
        if (ab.includes('Steel Resolve')) rawIncoming = Math.floor(rawIncoming * 0.85);
    }

    if (bonusDefPerc > 0) {
        rawIncoming = Math.floor(rawIncoming * (1 - (bonusDefPerc / 100)));
    }

    if (armorClass === 'HEAVY_ARMOR') rawIncoming = Math.floor(rawIncoming * 0.9); // flat 10% Legacy mitigation

    let evaded = false;
    if (Math.random() * 100 < gearEvasion || (activeAbilities.join(',').includes('Shadow Realm') && Math.random() > 0.95)) {
      rawIncoming = 0;
      totalEvades++;
      evaded = true;
    } else {
      totalMitigated += Math.min(mitigation, rawIncoming);
      rawIncoming -= mitigation;
    }

    if (activeAbilities.join(',').includes('Juggernaut') && Math.random() > 0.90) {
      roundDps += rawIncoming; 
      abilityHighlights += `🌟 \`Juggernaut\` reflected ${rawIncoming} DMG back! 🔄\n`;
      rawIncoming = 0;
    }

    if (rawIncoming < 0) rawIncoming = 0;

    if (playerHp - rawIncoming <= 0 && hasUndying && !undyingTriggered) {
        undyingTriggered = true;
        playerHp += 100;
        rawIncoming = 0; // Negate the fatal blow
        abilityHighlights += `✨ \`Undying\` saved you from a fatal blow!\n`;
    }
    
    if (playerHp - rawIncoming <= 0 && activeAbilities.join(',').includes('Deathless King') && !undyingTriggered) {
        undyingTriggered = true;
        playerHp += player.maxHp;
        rawIncoming = 0; 
        playerBaseOutput *= 2; 
        abilityHighlights += `🌟 \`Deathless King\` revived you at FULL HP and Doubled your ATK for the rest of battle!\n`;
    }

    if (activeAbilities.join(',').includes('Singularity') && Math.random() > 0.90) {
        roundDps += rawIncoming * 3;
        abilityHighlights += `🌟 \`Singularity\` absorbed ${rawIncoming} DMG and reflected it! 🔄\n`;
        rawIncoming = 0;
    }

    playerHp -= rawIncoming;
    totalDamageTaken += rawIncoming;
    
    if (evaded) {
        roundActions.push(`> 💨 You evaded the enemy's attack!`);
    } else {
        let preMit = rawIncoming + mitigation;
        let eStr = `> 👹 ${mob.name} struck you for **${rawIncoming}** DMG.`;
        if (mitigation > 0) eStr += ` 🛡️ *[${Math.min(mitigation, preMit)} Blocked]*`;
        if (poisonStacks > 0) eStr += ` 🧪 *[Poison Weakened]*`;
        roundActions.push(eStr);
    }
    
    if (activeHot > 0 && playerHp > 0) {
        playerHp = Math.min(player.maxHp, playerHp + activeHot);
    }
    
    combatLog.push(roundTitle + '\n' + roundActions.join('\n'));
  }

  // --- UNIFIED COMBAT AGGREGATOR ---
  let buildAnalysisString = '';

  let buildIdentity = `🛡️ **${baseMitigation}** Block | 💥 **${Math.min(100, gearCrit)}%** Crit | 💨 **${Math.min(100, gearEvasion)}%** Dodge`;
  if (gearLifesteal > 0) buildIdentity += ` | 🦇 **${gearLifesteal}%** Lifesteal`;
  const abStr = activeAbilities.join(',');
  if (abStr.includes('Hemorrhage')) buildIdentity += ` | 🩸 Bleed`;
  if (abStr.includes('Neurotoxin')) buildIdentity += ` | 🧪 Poison`;
  if (abStr.includes('Relentless')) buildIdentity += ` | 📈 Momentum`;
  if (abStr.includes('Executioner')) buildIdentity += ` | 🗡️ Burst`;
  if (hasUndying || hasLichKing) buildIdentity += ` | ✨ Revive`;
  
  buildAnalysisString += `💠 **Build Architecture:** ${buildIdentity}\n`;

  let coreStats = [];
  if (totalEvades > 0) coreStats.push(`💨 ${totalEvades} Evades`);
  if (totalMitigated > 0) coreStats.push(`🛡️ ${totalMitigated} Blocked`);
  if (totalLifesteal > 0) coreStats.push(`🦇 ${totalLifesteal} Siphoned`);
  if (totalCrits > 0) coreStats.push(`💥 ${totalCrits} Crits`);
  
  if (coreStats.length > 0) buildAnalysisString += `⚙️ **Core Combat:** ${coreStats.join(' | ')}\n`;

  if (totalBleedDamage > 0) buildAnalysisString += `🩸 **Hemorrhage:** Dealt **${totalBleedDamage}** True DMG over ${rounds} rounds\n`;
  if (totalPoisonMitigated > 0) buildAnalysisString += `🧪 **Neurotoxin:** Prevented **${totalPoisonMitigated}** incoming DMG\n`;
  if (totalExecutionerBurst > 0) buildAnalysisString += `💥 **Executioner:** Triggered **${totalExecutionerBurst}** extra Burst DMG\n`;
  if (momentumBonus > 1.0) buildAnalysisString += `📈 **Relentless:** Ramped Attack to **+${Math.floor((momentumBonus - 1.0)*100)}%** Bonus DMG\n`;
  if (totalBurnDamage > 0) buildAnalysisString += `🔥 **Ignite:** Burned enemy for **${totalBurnDamage} DMG**\n`;
  if (totalPoisonDamage > 0) buildAnalysisString += `🧪 **Toxin:** Poisoned enemy for **${totalPoisonDamage} DMG**\n`;

  if (jackpotTriggered && jackpotMessage.length > 0) abilityHighlights += `${jackpotMessage}\n`;

  if (abilityHighlights.length > 0) {
      const uniqueHighlights = [...new Set(abilityHighlights.split('\n').filter(s => s.trim() !== ''))];
      buildAnalysisString += `✨ **Spell/Ability Procs:**\n${uniqueHighlights.join('\n')}\n`;
  }

  // Fallback for basic builds
  if (buildAnalysisString.length === 0) {
      const dpsFromStats = playerBaseOutput * rounds;
      const defFromStats = Math.floor(player.end * 1) * rounds;
      buildAnalysisString += `⚖️ **Raw Stat Analysis**\nYour Attributes contributed **${dpsFromStats} Base Damage** and mitigated **${defFromStats} Damage**.\n*Tip: Seek out forged weapons to unlock synergistic abilities!*`;
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

    let deathDesc = `You swung your **${weaponName}** but you lacked the DPS and Defenses to survive the ${currentZone.replace(/_/g, ' ')}.\n\n`;
    if (combatLog.length > 6) {
        const firstFew = combatLog.slice(0, 3);
        const lastFew = combatLog.slice(-2);
        deathDesc += firstFew.join('\n\n') + `\n\n... *[ ${combatLog.length - 5} Rounds Omitted for brevity ]* ...\n\n` + lastFew.join('\n\n') + '\n\n';
    } else {
        deathDesc += combatLog.join('\n\n') + '\n\n';
    }
    deathDesc += `The ${mob.emoji} ${mob.name} overwhelmed you after **${rounds} Rounds** of combat.\n\n🔻 **You lost ${goldLost} Gold (10%).**\n❤️ **You are heavily injured. Use Potions to heal before hunting again.**`;

    const deathEmbed = new EmbedBuilder()
      .setTitle(`☠️ DEFEAT: SLAIN BY ${mob.name.toUpperCase()}`)
      .setColor(0x8B0000)
      .setDescription(deathDesc)
      .addFields(
        { name: 'Damage Dealt', value: `${totalDamageDealt} DMG`, inline: true },
        { name: 'Damage Taken', value: `${totalDamageTaken} DMG`, inline: true },
        { name: '🔬 Combat Analysis', value: `**Avg Output**: ${averageDps} DMG/Round\n**Armor Mitigated**: ${mitigationPerRound} DMG/Round\n\n${tip}` }
      );
      
    if (buildAnalysisString.length > 0) {
        deathEmbed.addFields({ name: '🛠️ Build Performance Analysis', value: buildAnalysisString });
    }
    return message.reply({ embeds: [deathEmbed] });
  }

  // --- VICTORY STATE (REWARDS) ---
  if (armorClass === 'CLOTH') {
    playerHp = Math.min(player.maxHp, playerHp + Math.floor(player.maxHp * 0.05)); // Mana Shield regen
  }
  if (activeAbilities.join(',').includes('Arcane Recovery')) {
    playerHp = Math.min(player.maxHp, playerHp + Math.floor(player.maxHp * 0.05));
  }

  let baseGold = 25 * tier;
  let baseXP = Math.floor(Math.random() * 21 * tier) + (15 * tier); 
  let goldReward = baseGold * slotMultiplier;
  let xpReward = baseXP * slotMultiplier;
  
  if (activeAbilities.join(',').includes('Harvest')) goldReward = Math.floor(goldReward * 1.05);
  if (activeAbilities.join(',').includes('Tracker') && (mob.name.includes('Wolf') || mob.name.includes('Beast') || mob.name.includes('Bear') || mob.name.includes('Slime'))) xpReward = Math.floor(xpReward * 1.05);
  if (activeAbilities.join(',').includes('Grim Memento') && (mob.name.includes('Lich') || mob.name.includes('Undead') || mob.name.includes('Skeleton') || mob.name.includes('Ghoul'))) xpReward = Math.floor(xpReward * 1.50);

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
  const TIER2_BPS = [
    { key: 'blueprint_iron_pickaxe', name: 'Iron Pickaxe' },
    { key: 'blueprint_iron_axe', name: 'Iron Axe' },
    { key: 'blueprint_iron_sickle', name: 'Iron Sickle' },
    { key: 'blueprint_iron_greatsword', name: 'Iron Greatsword' },
    { key: 'blueprint_wolf_slayer', name: 'Wolf Slayer Sword' },
    { key: 'blueprint_venom_shiv', name: 'Venom Shiv' },
    { key: 'blueprint_mystic_robe', name: 'Mystic Robe' },
    { key: 'blueprint_iron_chestplate', name: 'Iron Chestplate' },
    { key: 'blueprint_steel_chestplate', name: 'Steel Chestplate' }
  ];
  const TIER3_BPS = [
    { key: 'blueprint_mythril_pickaxe', name: 'Mythril Pickaxe' },
    { key: 'blueprint_mythril_axe', name: 'Mythril Axe' },
    { key: 'blueprint_mythril_sickle', name: 'Mythril Sickle' },
    { key: 'blueprint_mythril_cleaver', name: 'Mythril Cleaver' },
    { key: 'blueprint_shadow_blade', name: 'Shadow Blade' },
    { key: 'blueprint_moonlight_staff', name: 'Moonlight Staff' },
    { key: 'blueprint_meteor_staff', name: 'Meteor Staff' },
    { key: 'blueprint_soul_reaper', name: 'Soul Reaper' },
    { key: 'blueprint_lich_tome', name: 'Lich Tome' },
    { key: 'blueprint_lich_mantle', name: 'Lich Mantle' },
    { key: 'blueprint_shadow_tunic', name: 'Shadow Tunic' }
  ];
  const TIER4_BPS = [
    { key: 'blueprint_void_blade', name: 'Void Blade' }
  ];
  
  let gachaLootString = '';
  if (Math.random() <= 0.25) { 
    const rarityRoll = Math.random();
    let dropKey = '';
    
    // Geographical Tier Locking Match
    let BP_POOL: any[] | null = null;
    let rankColor = '⬜';
    if (tier === 2) { BP_POOL = TIER2_BPS; rankColor = '🟦'; }
    if (tier === 3) { BP_POOL = TIER3_BPS; rankColor = '🟪'; }
    if (tier >= 4) { BP_POOL = TIER4_BPS; rankColor = '🟧'; }

    if (rarityRoll > 0.95) {
      gachaLootString = '🗝️ `[Dungeon Key]`'; dropKey = 'dungeon_key';
    } else if (BP_POOL !== null) {
      const bp = BP_POOL[Math.floor(Math.random() * BP_POOL.length)]; 
      gachaLootString = `${rankColor} \`[Blueprint: ${bp.name}]\``; 
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

  // --- RECIPE DISCOVERY (10% CHANCE / ZONE GACHA) ---
  const ZONE_RECIPES: Record<string, string[]> = {
      lumina_plains: ['koi_soup', 'lumberjack_pancakes'],
      whispering_woods: ['golden_skewer', 'moonlight_brew'],
      ironpeak_mountains: ['glacier_stew', 'glacial_filet', 'miner_goulash'],
      ashen_wastes: ['lava_seared_eel', 'spicy_eel', 'starlight_infusion'],
      abyssal_depths: ['abyssal_feast', 'void_sashimi', 'fisherman_brew', 'golden_harvest_pie']
  };

  if (Math.random() <= 0.10) {
      const gachaPool = ZONE_RECIPES[player.location || 'lumina_plains'] || ZONE_RECIPES['lumina_plains'];
      const droppedRecipe = gachaPool[Math.floor(Math.random() * gachaPool.length)];
      const alreadyHas = player.recipes && player.recipes.find((r: any) => r.recipeKey === droppedRecipe);
      if (!alreadyHas) {
          if (gachaLootString) gachaLootString += '\n';
          gachaLootString += `📜 \`[Ancient Recipe: ${droppedRecipe.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}]\``;
          dbOperations.push(prisma.unlockedRecipe.upsert({
              where: { playerId_recipeKey: { playerId: player.id, recipeKey: droppedRecipe } },
              update: {},
              create: { playerId: player.id, recipeKey: droppedRecipe }
          }));
          if (!player.recipes) player.recipes = [];
          player.recipes.push({ recipeKey: droppedRecipe } as any);
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

  if (activeHot > 0 && rounds > 0) abilityHighlights += `🍵 Meal Regeneration restored **${activeHot * rounds}** HP!\n`;
  if (activeEot > 0 && rounds > 0) {
      const energyRegen = activeEot * rounds;
      player.energy = Math.min(100, player.energy + energyRegen);
      abilityHighlights += `✨ Meal Energization restored **${energyRegen}** Energy!\n`;
  }

  const updateData: any = { gold: { increment: goldReward }, level: currentLevel, xp: currentXp, hp: playerHp, energy: player.energy };
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
  let responseBody = `You swung your **${weaponName}** leading to an intense exchange. The ${mob.emoji} ${mob.name} retaliated against your **${armorName}**.\n\n`;

  if (combatLog.length > 6) {
      const firstFew = combatLog.slice(0, 3);
      const lastFew = combatLog.slice(-2);
      responseBody += firstFew.join('\n\n') + `\n\n... *[ ${combatLog.length - 5} Rounds Omitted for brevity ]* ...\n\n` + lastFew.join('\n\n') + '\n\n';
  } else {
      responseBody += combatLog.join('\n\n') + '\n\n';
  }
  
  responseBody += `**Final Combat Stats:** 💥 ${totalDamageDealt} Output | 🩸 ${totalDamageTaken} Taken\n\n`;

  let slotStr = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\``;
  if (isSlotJackpot) slotStr += ` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥`;
  else if (isSlotMatch) slotStr += ` = **${slotMultiplier}x MATCH!** 🔥`;
  responseBody += `${slotStr}\n\n🛍️ **Final Payout:** 🪙 ${goldReward} Gold | ✨ ${xpReward} XP\n`;

  if (mobDrops.length > 0) {
    let dropStrings = mobDrops.map(d => `${getEmoji(d.key)} \`[${d.qty}x ${d.name}]\``).join('\n');
    responseBody += dropStrings + '\n';
  }

  const styleDisplay = weaponClass === 'NONE' ? 'Unarmed' : weaponClass.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(' ');

  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: ${mob.name}`)
    .setColor(jackpotTriggered || isSlotJackpot ? (weaponClass === 'FINESSE_WEAPON' ? 0x8A2BE2 : 0xFFD700) : 0x2B2D31)
    .setDescription(responseBody)
    .addFields(
      { name: 'Your Style', value: styleDisplay, inline: true },
      { name: 'Total Damage Output', value: `${totalDamageDealt} DMG`, inline: true }
    );

  if (buildAnalysisString.length > 0) embed.addFields({ name: '🛠️ Build Performance Analysis', value: buildAnalysisString, inline: false });
  if (buffMessage) embed.addFields({ name: 'Active Buff', value: buffMessage, inline: false });
  if (levelsGained > 0) embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel}**! (+${pointsGained} Stat Points). Type \`rpg stat\` to spend them!`});
  if (gachaLootString) embed.addFields({ name: '🎁 MYSTERY LOOT DROP!', value: `You found a rare blueprint schematic:\n${gachaLootString}`});

  await prisma.$transaction(dbOperations);

  const trackerField = await getPinnedTrackerField(player.id, (player as any).pinnedForgeItems);
  if (trackerField) embed.addFields(trackerField);

  return message.reply({ embeds: [embed] });
}
