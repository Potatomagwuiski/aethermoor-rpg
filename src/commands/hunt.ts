import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle } from 'discord.js';
import prisma from '../db.js';
import { processQuestProgress } from '../utils/quests.js';
import redisClient from '../redis.js';
import { enforceCooldown } from '../utils/cooldown.js';
import { getEmoji } from '../utils/emojis.js';
import { BLUEPRINTS } from './forge.js';
import { getPinnedTrackerField } from '../utils/tracker.js';
import { calculateBuildArchitecture } from '../utils/stats.js';

export async function execute(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
        equipment: {
            where: { equipped: true }
        },
        recipes: true,
        pets: {
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
        if (bp.outputs.base) {
            const baseStats = bp.outputs.base;
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
      { name: 'Acid Slime', emoji: '💧', affixes: ['ACIDIC'], loot: [{ key: 'slime_gel', name: 'Slime Gel', chance: 0.5 }] },
      { name: 'Goblin Scout', emoji: '👺', affixes: ['PACK_TACTICS'], loot: [{ key: 'goblin_ear', name: 'Goblin Ear', chance: 0.4 }] },
      { name: 'Cave Bat', emoji: '🦇', affixes: ['EVASIVE'], loot: [{ key: 'bat_wing', name: 'Bat Wing', chance: 0.4 }] }
    ],
    whispering_woods: [
      { name: 'Dire Wolf', emoji: '🐺', affixes: ['PACK_TACTICS'], loot: [{ key: 'wolf_pelt', name: 'Wolf Pelt', chance: 0.4 }] },
      { name: 'Forest Treant', emoji: '🌳', affixes: ['REGENERATING'], loot: [{ key: 'living_bark', name: 'Living Bark', chance: 0.3 }] }
    ],
    ironpeak_mountains: [
      { name: 'Skeleton Warrior', emoji: '💀', affixes: ['ARMORED'], loot: [{ key: 'brittle_bone', name: 'Brittle Bone', chance: 0.5 }] },
      { name: 'Rock Golem', emoji: '🪨', affixes: ['ARMORED', 'ENRAGED'], loot: [{ key: 'golem_rubble', name: 'Golem Rubble', chance: 0.3 }] }
    ],
    ashen_wastes: [
      { name: 'Lesser Demon', emoji: '👿', affixes: ['ENRAGED'], loot: [{ key: 'demon_horn', name: 'Demon Horn', chance: 0.4 }] },
      { name: 'Shadow Stalker', emoji: '🌑', affixes: ['EVASIVE'], loot: [{ key: 'shadow_dust', name: 'Shadow Dust', chance: 0.3 }] }
    ],
    abyssal_depths: [
      { name: 'Mythic Drake', emoji: '🐉', affixes: ['ARMORED', 'ENRAGED'], loot: [{ key: 'drake_scale', name: 'Drake Scale', chance: 0.5 }] },
      { name: 'Abyssal Lich', emoji: '🧙‍♂️', affixes: ['REGENERATING', 'EVASIVE'], loot: [{ key: 'lich_phylactery', name: 'Lich Phylactery', chance: 0.4 }] }
    ]
  };

  const monsters = ZONED_MOBS[currentZone] || ZONED_MOBS['lumina_plains'];
  const baseMob = monsters[Math.floor(Math.random() * monsters.length)];
  const mob = { ...baseMob };

  if (Math.random() > 0.85) {
      const eliteMods = ['VAMPIRIC', 'JUGGERNAUT', 'EXPLOSIVE'];
      const chosen = eliteMods[Math.floor(Math.random() * eliteMods.length)];
      mob.affixes = [...(mob.affixes || []), chosen];
      mob.name = `${chosen === 'VAMPIRIC' ? 'Vampiric' : chosen === 'JUGGERNAUT' ? 'Juggernaut' : 'Explosive'} ${mob.name}`;
      mob.emoji = '🌟';
  }

  let packSize = 1;
  const packRoll = Math.random();
  if (packRoll > 0.95) packSize = 3;
  else if (packRoll > 0.85) packSize = 2;
  
// pack name mapping moved to entity initialization


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
    if (activeBuff === 'HP_150') { player.maxHp += 150; player.hp += 150; buffMessage = '✨ **Buff Active:** Koi Soup (+150 MAX HP)'; }
    if (activeBuff === 'DEF_120') { gearDef += 120; buffMessage = '✨ **Buff Active:** Glacial Filet (+120 DEF)'; }
    if (activeBuff === 'CRIT_15') { gearCrit += 15; buffMessage = '✨ **Buff Active:** Spicy Eel (+15% CRIT)'; }
    if (activeBuff === 'ATK_100_LS_10') { gearAtk += 100; gearLifesteal += 10; buffMessage = '✨ **Buff Active:** Void Sashimi (+100 ATK, 10% LIFESTEAL)'; }
    if (activeBuff === 'HOT_75') { activeHot = 75; buffMessage = '✨ **Buff Active:** Moonlight Brew (Heals 75 HP / Round)'; }
    if (activeBuff === 'EVASION_35') { gearEvasion += 35; buffMessage = '✨ **Buff Active:** Starlight Infusion (+35% Evasion)'; }
  } else if (activeBuff) {
    await prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } });
    activeBuff = null;
  }

  // --- THE AUTO-BATTLER PHYSICS LOOP (V2 MULTI-TARGET ENGINE) ---
  let baseHp = Math.floor((tier * 25) + (player.level * 10 * tier));
  if (packSize > 1) baseHp = Math.floor(baseHp * 0.8);
  
  let baseAtk = Math.floor((tier * 5) + (player.level * 2 * tier));
  if (packSize > 1) baseAtk = Math.floor(baseAtk * 0.8);

  let activeEnemies = Array.from({length: packSize}).map((_, i) => ({
      id: i + 1,
      name: packSize > 1 ? `${mob.name} #${i+1}` : mob.name,
      hp: baseHp,
      maxHp: baseHp,
      atk: baseAtk,
      affixes: mob.affixes || [],
      isDead: false,
      poisonStacks: 0,
      bleedStacks: 0
  }));

  let playerHp = player.hp;
  if (playerHp <= 0) playerHp = 1;
  const activePet = player.pets && player.pets.length > 0 ? player.pets[0] : null;
  const maxHpWithPet = player.maxHp + (activePet ? activePet.bonusHp : 0);

  let jackpotTriggered = false;
  let jackpotMessage = '';
  let craftingItemDrop = null;
  
  let playerBaseOutput = Math.floor(player.level * 2) + (activePet ? activePet.bonusAtk : 0);
  if (weaponClass === 'FINESSE_WEAPON') playerBaseOutput += Math.floor(player.agi * 1.5);
  if (weaponClass === 'HEAVY_WEAPON') playerBaseOutput += Math.floor(player.str * 2);
  if (weaponClass === 'MAGIC_WEAPON') playerBaseOutput += Math.floor(player.int * 2.5);
  
  if (weaponClass === 'HUNTER_WEAPON') playerBaseOutput += Math.floor((player.str * 1.25) + (player.agi * 1.25));
  if (weaponClass === 'SPELLBLADE_WEAPON') playerBaseOutput += Math.floor((player.str * 1.5) + (player.int * 1.0));
  if (weaponClass === 'VANGUARD_WEAPON') playerBaseOutput += Math.floor((player.str * 1.5) + (player.end * 1.0));

  let hasGaleStrike = false;
  let hasExecutioner = false;
  let hasSniper = false;
  let hasVampire = false;

  for (const ab of activeAbilities) {
      if (!ab) continue;
      // Armors
      if (ab.includes('[Spellweaver]') && (weaponClass === 'SPELLBLADE_WEAPON' || weaponClass === 'MAGIC_WEAPON')) playerBaseOutput = Math.floor(playerBaseOutput * 1.15);
      if (ab.includes('[Swift Draw]') && (weaponClass === 'HUNTER_WEAPON' || weaponClass === 'FINESSE_WEAPON')) {
          playerBaseOutput = Math.floor(playerBaseOutput * 1.15);
      }
      if (ab.includes('Assassin:') && weaponClass === 'FINESSE_WEAPON') playerBaseOutput = Math.floor(playerBaseOutput * 1.15);
      
      // Weapons
      if (ab.includes('[Jagged Edge]')) playerBaseOutput = Math.floor(playerBaseOutput * 1.05);
      if (ab.includes('[Heavy Blade]')) playerBaseOutput = Math.floor(playerBaseOutput * 1.10);

      // Flags for active loop triggers
      if (ab.includes('[Gale Strike]')) hasGaleStrike = true;
      if (ab.includes('[Execute]') || ab.includes('[Decapitate]')) hasExecutioner = true;
      if (ab.includes('[Headshot]')) hasSniper = true;
      if (ab.includes('[Feast]') || ab.includes('[Vampire]')) hasVampire = true;
  }

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

  if (armorClass === 'LIGHT_ARMOR') gearEvasion += 15;
  
  gearCrit += bonusCrit + Math.floor(player.int * 0.5); 
  gearEvasion += bonusEvasion + Math.floor(player.agi * 0.5);
  const abilitiesStrPre = activeAbilities.join(',');
  if (abilitiesStrPre.includes('Lightweight')) gearEvasion += 5;
  if (abilitiesStrPre.includes('Swiftness')) gearEvasion += 15;
  if (abilitiesStrPre.includes('Lightning Reflexes')) gearEvasion += 20;
  if (abilitiesStrPre.includes('Hawk Eye')) gearCrit += 5; 
  let baseMitigation = Math.floor(gearDef * 0.75) + Math.floor(player.end * 1); 

  let rounds = 0;
  let totalDamageDealt = 0;
  let totalDamageTaken = 0;
  let totalLifesteal = 0;
  let totalEvades = 0;
  let totalCrits = 0;
  let totalMitigated = 0;

  let cleaveTriggered = false;
  let momentumBonus = 1.0;
  let totalPoisonMitigated = 0;
  let totalExecutionerBurst = 0;

  const MAX_ROUNDS = 20;
  let combatLog: string[] = [];

  while (playerHp > 0 && activeEnemies.some(e => !e.isDead) && rounds < MAX_ROUNDS) {
    rounds++;
    let roundTitle = `**Round ${rounds}**`;
    let roundActions: string[] = [];

    // --- PLAYER PHASE ---
    let roundDps = playerBaseOutput + gearAtk;
    if (activeAbilities.join(',').includes('Relentless')) {
        momentumBonus += 0.10;
        roundDps = Math.floor(roundDps * momentumBonus);
    }
    
    let target = activeEnemies.find(e => !e.isDead);
    if (!target) break;

    let isStun = false;
    let isAoE = false;
    let aoeDamage = 0;
    let isCleave = false;
    let isCrit = false;
    let isExecute = false;

    if (Math.random() * 100 < gearCrit) {
      isCrit = true;
      roundDps = Math.floor(roundDps * 2);
      totalCrits++;
    }

    const abilitiesStr = activeAbilities.join(',');
        
    // --- Passives ---
    if (abilitiesStr.includes('First Strike') && rounds === 1) roundDps = Math.floor(roundDps * 1.5);
    if (abilitiesStr.includes('Relentless')) roundDps = Math.floor(roundDps * (1 + (rounds * 0.1)));
    if (abilitiesStr.includes('Momentum')) roundDps += (rounds * 5);
    if (abilitiesStr.includes('Colossal') && mob.name.includes('🌟')) roundDps *= 2; 
    if (abilitiesStr.includes('Tectonic')) {
        const missingPct = 1 - (playerHp / maxHpWithPet);
        roundDps = Math.floor(roundDps * (1 + missingPct));
    }
    if (abilitiesStr.includes('Deadly Aim') && isCrit) roundDps = Math.floor(roundDps * (2.0 / 1.5)); 
    
    // De-Armor
    if (target.affixes) {
        if (abilitiesStr.includes('Piercing Arrow')) target.affixes = target.affixes.filter((a: string) => a !== 'ARMORED');
        if (abilitiesStr.includes('Blunt Force') || abilitiesStr.includes('Shatter')) {
             if (Math.random() < (abilitiesStr.includes('Shatter') ? 0.2 : 0.1)) target.affixes = target.affixes.filter((a: string) => a !== 'ARMORED');
        }
        if (abilitiesStr.includes('Black Hole')) {
             target.affixes = target.affixes.filter((a: string) => a !== 'EVASIVE');
        }
    }

    // --- Actives (Procs) ---
    if (abilitiesStr.includes('Assassinate') && Math.random() < 0.15 && !mob.name.includes('Boss')) {
        isExecute = true; roundDps = 9999;
    }
    if (abilitiesStr.includes('Fissure') && Math.random() < 0.20 && target.affixes.includes('ARMORED')) {
        isExecute = true; roundDps = 9999;
    }
    if (abilitiesStr.includes('Ember') && Math.random() < 0.15) roundDps += 25; 
    
    if (abilitiesStr.includes('Drain Life') && Math.random() < 0.25) playerHp = Math.min(maxHpWithPet, playerHp + 20);
    
    // AoE Block
    if (abilitiesStr.includes('Moonbeam') && Math.random() < 0.20) { isAoE = true; aoeDamage = Math.floor(roundDps * 0.5); }
    if (abilitiesStr.includes('Meteor Swarm') && Math.random() < 0.15) { isAoE = true; aoeDamage = roundDps * 1.5; jackpotTriggered = true; jackpotMessage = '🌋 **METEOR SWARM!**'; }
    if (abilitiesStr.includes('Supernova') && Math.random() < 0.10) { isAoE = true; aoeDamage = 9999; jackpotTriggered = true; jackpotMessage = '🌑 **SUPERNOVA!**'; }
    if (abilitiesStr.includes('Whirlwind') && Math.random() < 0.15) { isAoE = true; aoeDamage = Math.floor(roundDps * 0.75); }
    if (abilitiesStr.includes('Volley') && Math.random() < 0.25) { isAoE = true; aoeDamage = Math.floor(roundDps * 1.0); }
    if (abilitiesStr.includes('Chain Lightning') && Math.random() < 0.30) { isAoE = true; aoeDamage = roundDps; }
    
    // Cleave Block
    let cleaveMod = 0.50;
    if (abilitiesStr.includes('Heavy Blade')) cleaveMod = 0.75;
    if (abilitiesStr.includes('Cleave') && Math.random() < 0.20) isCleave = true;
    if (abilitiesStr.includes('Wide Cleave') && Math.random() < 0.35) isCleave = true;
    if (abilitiesStr.includes('Guaranteed Cleave')) isCleave = true;
    
    // Stun Block
    if (abilitiesStr.includes('Earthquake') && Math.random() < 0.20) { isAoE = true; aoeDamage = roundDps; isStun = true; }
    if (abilitiesStr.includes('Tremor') && Math.random() < 0.30) isStun = true;
    if (abilitiesStr.includes('Stagger') && Math.random() < 0.20) isStun = true;
    
    // Multi-attack or Crit overrides
    if (abilitiesStr.includes('Quick Shot') && Math.random() < 0.15) roundDps *= 2; 
    if (abilitiesStr.includes('Phantom Strike') && Math.random() < 0.25) roundDps *= 2;
    if (abilitiesStr.includes('Shooting Star') && target.name.includes('🌟')) {
         if (!isCrit) { roundDps = Math.floor(roundDps * 1.5); isCrit = true; }
    }
    if (abilitiesStr.includes('Skull Crusher') && Math.random() < 0.25) {
         roundDps *= 3;
         isCrit = true;
    }

    // --- LATERAL NEW WEAPON HOOKS ---
    if (abilitiesStr.includes('Execute') && target.hp < target.maxHp * 0.3) {
         roundDps *= 3;
         isCrit = true;
    }
    if (abilitiesStr.includes('Decapitate') && target.hp < target.maxHp * 0.20 && !target.name.includes('Boss')) {
         roundDps *= 10;
         isCrit = true;
         isExecute = true;
    }
    if (abilitiesStr.includes('Headshot') && Math.random() < 0.15) {
         roundDps *= 2;
         isCrit = true;
    }
    if (abilitiesStr.includes('Gale Strike') && Math.random() < 0.20) roundDps *= 2;
    if (abilitiesStr.includes('Hemorrhage') && Math.random() < 0.25) {
         target.bleedStacks = (target.bleedStacks || 0) + 3;
    }

    if (gearLifesteal > 0 || (abilitiesStr.includes('Vampire') && Math.random() < 0.15)) {
      const l_scale = abilitiesStr.includes('Vampire') ? 1.0 : (gearLifesteal / 100);
      const heal = Math.floor(roundDps * l_scale);
      playerHp = Math.min(player.maxHp, playerHp + heal);
      totalLifesteal += heal;
    }

    // Apply AoE / Cleave / Single Target Damage
    let damageString = '';
    const wName = weaponName || 'Bare Hands';
    
    if (isAoE) {
        activeEnemies.forEach(e => {
           if (!e.isDead) { e.hp -= aoeDamage; totalDamageDealt += aoeDamage; if(e.hp <= 0) e.isDead = true; }
        });
        damageString = `☄️ You unleashed your **${wName}** dealing **${aoeDamage} AoE DMG** to all enemies!`;
    } else {
        if (target.affixes.includes('EVASIVE') && Math.random() < 0.25) {
            damageString = `💨 The **${target.name}** effortlessly evaded your attack!`;
        } else {
            if (target.affixes.includes('ARMORED')) {
                roundDps = Math.floor(roundDps * 0.70);
            }
            target.hp -= roundDps;
            totalDamageDealt += roundDps;
            
            let modStr = target.affixes.includes('ARMORED') ? ` (🛡️ Armored)` : '';
            if (isExecute) damageString = `💥 **CRITICAL EXECUTION!** You obliterated the **${target.name}** with your **${wName}** for **${roundDps}** DMG${modStr}`;
            else if (isCrit) damageString = `💥 **CRITICAL HIT!** You viciously struck the **${target.name}** with your **${wName}** for **${roundDps}** DMG${modStr}`;
            else damageString = `🗡️ You swung your **${wName}** at the **${target.name}** for **${roundDps}** DMG${modStr}`;
            
            if (target.affixes.includes('ACIDIC')) {
                 const recoil = Math.floor(roundDps * 0.15) || 1;
                 if (recoil > 0) { playerHp -= recoil; damageString += `\n↳ 🧪 Acidic Recoil burned you for ${recoil} DMG!`; }
            }
        
        if (target.hp <= 0) {
            target.isDead = true;
            damageString += `, instantly **SLAYING** it! 💀`;
        }

            if (isCleave && activeEnemies.filter(e => !e.isDead).length > 0) {
                let nextTarget = activeEnemies.find(e => !e.isDead);
                if (nextTarget) {
                    let cleaveMod = abilitiesStr.includes('Heavy Blade') ? 0.75 : 0.50;
                    let cleaveDmg = Math.floor(roundDps * cleaveMod);
                    if (nextTarget.affixes.includes('ARMORED')) cleaveDmg = Math.floor(cleaveDmg * 0.70);
                    nextTarget.hp -= cleaveDmg;
                    totalDamageDealt += cleaveDmg;
                    cleaveTriggered = true;
                    damageString += `\n↳ 🌪️ Your cleave hit **${nextTarget.name}** for **${cleaveDmg}** DMG!`;
                    if (nextTarget.hp <= 0) { nextTarget.isDead = true; damageString += ` 💀`; }
                }
            }
        }
    }

    // Apply DoTs
    if (abilitiesStr.includes('Hemorrhage') || abilitiesStr.includes('Serrated Edge')) {
        activeEnemies.forEach(e => { if (!e.isDead) e.bleedStacks++; });
    }
    
    // Apply Plague Carrier
    if (abilitiesStr.includes('Plague Carrier') && rounds === 0) {
        activeEnemies.forEach(e => { if (!e.isDead) e.poisonStacks += 5; });
    }
    if ((abilitiesStr.includes('Neurotoxin') || abilitiesStr.includes('Venomous Strike')) && Math.random() < 0.30) {
        activeEnemies.forEach(e => { if (!e.isDead) e.poisonStacks = Math.min(10, e.poisonStacks + 1); });
    }

    let dotString = '';
    activeEnemies.forEach(e => {
        if (e.isDead) return;
        if (e.bleedStacks > 0) {
            let tick = Math.floor(player.maxHp * 0.02 * e.bleedStacks) || 1;
            e.hp -= tick; totalBleedDamage += tick;
            dotString += `\n↳ 🩸 **${e.name}** bled for ${tick} True DMG`;
            if (e.hp <= 0) e.isDead = true;
        }
        if (e.poisonStacks > 0 && abilitiesStr.includes('Venom Pop') && e.poisonStacks >= 5) {
            const burst = Math.floor(player.maxHp * 0.15 * e.poisonStacks);
            e.hp -= burst; e.poisonStacks = 0;
            dotString += `\n↳ 💥 **VENOM POP!** ${e.name} detonated for ${burst} True DMG`;
            if (e.hp <= 0) e.isDead = true;
        }
    });

    if (dotString !== '') damageString += dotString;
    combatLog.push(roundTitle + '\n' + `> ${damageString}`);

    // Check if all enemies are dead
    if (activeEnemies.every(e => e.isDead)) break;

    // --- ENEMY PHASE (Multi-Target Incoming) ---
    let rawIncoming = 0;
    let poisonMitigatedThisRound = 0;

    for (const em of activeEnemies) {
        if (em.isDead) continue;
        
        let emAtk = em.atk;
        if (em.affixes.includes('ENRAGED')) emAtk = Math.floor(emAtk * (1.0 + (rounds * 0.10)));
        if (em.affixes.includes('PACK_TACTICS')) emAtk = Math.floor(emAtk * (1.0 + (activeEnemies.filter(x => !x.isDead).length * 0.3)));
        if (abilitiesStr.includes('Plague')) emAtk = Math.floor(emAtk * 0.90);
        if (abilitiesStr.includes('Eclipse') && Math.random() > 0.90) emAtk = Math.floor(emAtk * 0.50);
        
        let swing = Math.floor(Math.random() * emAtk) + Math.floor(emAtk / 2);
        if (em.affixes.includes('EXPLOSIVE') && rounds === 1) swing *= 2;
        
        if (em.affixes.includes('VAMPIRIC') && swing > 0) {
             const leech = Math.floor(swing * 0.2);
             em.hp += leech;
        }
        if (em.affixes.includes('REGENERATING')) {
             const regen = Math.floor(em.maxHp * 0.1);
             em.hp = Math.min(em.maxHp, em.hp + regen);
        }
        
        if (em.poisonStacks > 0 && !abilitiesStr.includes('Venom Pop')) {
             const reduction = Math.floor(swing * (0.05 * em.poisonStacks));
             swing -= reduction;
             poisonMitigatedThisRound += reduction;
        }
        rawIncoming += swing;
    }
    
    totalPoisonMitigated += poisonMitigatedThisRound;

    if (abilitiesStr.includes('Lunar Grace')) {
        playerHp = Math.min(maxHpWithPet, playerHp + 5);
        roundActions.push(`🌙 Lunar Grace healed 5 HP`);
    }
    if (abilitiesStr.includes('Parasitic Siphon')) {
        let totalStacks = activeEnemies.reduce((acc, e) => acc + e.poisonStacks, 0);
        if (totalStacks > 0) {
            const leech = Math.floor(player.maxHp * 0.01 * totalStacks);
            playerHp = Math.min(player.maxHp, playerHp + leech);
            roundActions.push(`🧛 Siphoned ${leech} HP from poisoned enemies`);
        }
    }

    let mitigation = baseMitigation;
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

    if (bonusDefPerc > 0) rawIncoming = Math.floor(rawIncoming * (1 - (bonusDefPerc / 100)));
    if (armorClass === 'HEAVY_ARMOR') rawIncoming = Math.floor(rawIncoming * 0.9); 

    let evaded = false;
    if (Math.random() * 100 < gearEvasion || (activeAbilities.join(',').includes('Shadow Realm') && Math.random() > 0.95)) {
      rawIncoming = 0;
      totalEvades++;
      evaded = true;
    } else {
      totalMitigated += Math.min(mitigation, rawIncoming);
      rawIncoming -= mitigation;
    }

    if (activeAbilities.join(',').includes('Juggernaut') && Math.random() > 0.90 && rawIncoming > 0) {
      if (activeEnemies[0] && !activeEnemies[0].isDead) activeEnemies[0].hp -= rawIncoming; 
      abilityHighlights += `🌟 \`Juggernaut\` reflected ${rawIncoming} DMG back! 🔄\n`;
      rawIncoming = 0;
    }

    if (rawIncoming < 0) rawIncoming = 0;

    if (playerHp - rawIncoming <= 0 && hasUndying && !undyingTriggered) {
        undyingTriggered = true; playerHp += 100; rawIncoming = 0; 
        abilityHighlights += `✨ \`Undying\` saved you from a fatal blow!\n`;
    }
    
    if (playerHp - rawIncoming <= 0 && activeAbilities.join(',').includes('Deathless King') && !undyingTriggered) {
        undyingTriggered = true; playerHp += player.maxHp; rawIncoming = 0; playerBaseOutput *= 2; 
        abilityHighlights += `🌟 \`Deathless King\` revived you at FULL HP and Doubled your ATK!\n`;
    }

    if (activeAbilities.join(',').includes('Singularity') && Math.random() > 0.90 && rawIncoming > 0) {
        if (activeEnemies[0] && !activeEnemies[0].isDead) activeEnemies[0].hp -= (rawIncoming * 3);
        abilityHighlights += `🌟 \`Singularity\` absorbed ${rawIncoming} DMG and reflected it! 🔄\n`;
        rawIncoming = 0;
    }

    playerHp -= rawIncoming;
    totalDamageTaken += rawIncoming;
    
    let eStr = '';
    if (evaded) {
        const evadeTxt = packSize > 1 ? 'pack swarmed you, but you completely **evaded** their' : 'enemy struck, but you effortlessly **evaded** its';
        eStr = `> 💨 The ${evadeTxt} attacks!`;
    } else {
        let preMit = rawIncoming + mitigation;
        let pTxt = packSize > 1 ? 'The pack retaliated' : 'The enemy retaliated';
        eStr = `> 🛡️ ${pTxt} dealing **${rawIncoming}** DMG to you.`;
        
        let tags = [];
        if (mitigation > 0) tags.push(`🛡️ ${Math.min(mitigation, preMit)} Blocked`);
        if (poisonMitigatedThisRound > 0) tags.push(`🧪 Poison Weakened`);
        if (tags.length > 0) eStr += ` *[${tags.join(' | ')}]*`;
    }
    
    if (activeHot > 0 && playerHp > 0) {
        playerHp = Math.min(maxHpWithPet, playerHp + activeHot);
    }
    
    // Add enemy counter-attack log below player log
    combatLog[combatLog.length - 1] += '\n' + eStr;
    
    if (roundActions.length > 0) {
       combatLog[combatLog.length - 1] += '\n' + roundActions.join('\n');
    }
  }
  
  // Calculate remaining monster HP for failure states
  let monsterHp = activeEnemies.reduce((acc, e) => acc + e.hp, 0);
  let monsterMaxHp = activeEnemies.reduce((acc, e) => acc + e.maxHp, 0);

  // --- UNIFIED COMBAT AGGREGATOR ---
  let buildAnalysisString = '';

  const buildData = calculateBuildArchitecture(player);
  buildAnalysisString += `💠 **Build Architecture:** ${buildData.buildIdentity}\n`;

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

  if (activeHot > 0 && rounds > 0) abilityHighlights += `🍵 Meal Regeneration restored **${activeHot * rounds}** HP!\n`;
  if (activeEot > 0 && rounds > 0) {
      const energyRegen = activeEot * rounds;
      player.energy = Math.min(100, player.energy + energyRegen);
      abilityHighlights += `✨ Meal Energization restored **${energyRegen}** Energy!\n`;
  }

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

  if (packSize > 1) {
      goldReward = Math.floor(goldReward * packSize);
      xpReward = Math.floor(xpReward * packSize);
      combatLog.push(`💰 **PACK BONUS!** Defeating multiple enemies granted x${packSize} XP & Gold!`);
  }

  if (cleaveTriggered) {
      goldReward *= 2;
      xpReward *= 2;
      combatLog.push('🌪️ **CLEAVE MULTI-KILL!** Your sweeping strike defeated a secondary ambient monster! (x2 XP & Gold)');
  }
  
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
      const quantity = slotMultiplier * packSize;
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
    { key: 'blueprint_steel_chestplate', name: 'Steel Chestplate' },
    { key: 'blueprint_iron_spellblade', name: 'Iron Spellblade' },
    { key: 'blueprint_steel_bulwark', name: 'Steel Bulwark' },
    { key: 'blueprint_compound_longbow', name: 'Compound Longbow' },
    { key: 'blueprint_serrated_dirk', name: 'Serrated Dirk' },
    { key: 'blueprint_broadsword', name: 'Broadsword' }
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
    { key: 'blueprint_shadow_tunic', name: 'Shadow Tunic' },
    { key: 'blueprint_bloodthirster_kukri', name: 'Bloodthirster Kukri' },
    { key: 'blueprint_windrunner_shiv', name: 'Windrunner Shiv' },
    { key: 'blueprint_flamberge', name: 'Flamberge' },
    { key: 'blueprint_executioners_axe', name: 'Executioner\'s Axe' },
    { key: 'blueprint_recurve_bow', name: 'Recurve Bow' },
    { key: 'blueprint_spellweaver_robe', name: 'Spellweaver Robe' },
    { key: 'blueprint_ranger_hauberk', name: 'Ranger Hauberk' }
  ];
  const TIER4_BPS = [
    { key: 'blueprint_void_blade', name: 'Void Blade' },
    { key: 'blueprint_heartseeker', name: 'Heartseeker' },
    { key: 'blueprint_titan_mace', name: 'Titan Mace' },
    { key: 'blueprint_snipers_crossbow', name: 'Sniper\'s Crossbow' },
    { key: 'blueprint_juggernaut_plate', name: 'Juggernaut Plate' }
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

    if (rarityRoll > 0.80) {
      gachaLootString = '🗝️ `[Dungeon Key]`'; dropKey = 'dungeon_key';
    } else if (rarityRoll > 0.70) {
      gachaLootString = '📦 `[Aethermoor Lootbox]`'; dropKey = 'premium_lootbox';
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
  else if (isSlotMatch) slotStr += ` = **MATCH!** (${slotMultiplier}x Drop Multiplier) 🔥`;
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

  const questMsg = await processQuestProgress(player.id, 'HUNT');
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
