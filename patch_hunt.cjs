const fs = require('fs');

const path = './src/commands/hunt.ts';
let content = fs.readFileSync(path, 'utf8');

// 1. Remove the old pack naming logic so they remain singular
content = content.replace(
`  if (packSize > 1) {
      mob.name = \`Pack of \${packSize} \${mob.name}s\`;
  }`,
`// pack name mapping moved to entity initialization`
);

// 2. Extract the block to replace
const startMarker = `// --- THE AUTO-BATTLER PHYSICS LOOP ---`;
const endMarker = `// --- UNIFIED COMBAT AGGREGATOR ---`;

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
    console.error("Markers not found");
    process.exit(1);
}

const newLogic = `// --- THE AUTO-BATTLER PHYSICS LOOP (V2 MULTI-TARGET ENGINE) ---
  let baseHp = Math.floor((tier * 25) + (player.level * 10 * tier));
  if (packSize > 1) baseHp = Math.floor(baseHp * 0.8);
  
  let baseAtk = Math.floor((tier * 5) + (player.level * 2 * tier));
  if (packSize > 1) baseAtk = Math.floor(baseAtk * 0.8);

  let activeEnemies = Array.from({length: packSize}).map((_, i) => ({
      id: i + 1,
      name: packSize > 1 ? \`\${mob.name} #\${i+1}\` : mob.name,
      hp: baseHp,
      maxHp: baseHp,
      atk: baseAtk,
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
      const pctMatch = ab.match(/[+\\s]?(\\d+)%/);
      if (pctMatch) {
          const val = parseInt(pctMatch[1]);
          if (ab.includes('Evasion') || ab.includes('Dodge') || ab.includes('Swiftness')) bonusEvasion += val;
          if (ab.includes('Critical') || ab.includes('Crit') || ab.includes('Focus')) bonusCrit += val;
      }
      
      const flatDefMatch = ab.match(/grants (\\d+) bonus DEF/i) || ab.match(/blocks (\\d+) incoming/i);
      if (flatDefMatch) gearDef += parseInt(flatDefMatch[1]);
      if (ab.includes('Stalwart')) gearDef += 5;

      const flatHpMatch = ab.match(/\\+(\\d+) Max HP/i);
      if (flatHpMatch) playerHp += parseInt(flatHpMatch[1]);
      
      const reducedDmgMatch = ab.match(/physical damage by (\\d+)%/i) || ab.match(/physical damage taken by (\\d+)%/i);
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
    let roundTitle = \`**Round \${rounds}**\`;
    let roundActions: string[] = [];

    // --- PLAYER PHASE ---
    let roundDps = playerBaseOutput + gearAtk;
    if (activeAbilities.join(',').includes('Relentless')) {
        momentumBonus += 0.10;
        roundDps = Math.floor(roundDps * momentumBonus);
    }
    
    let abilityMsg = '';
    let isAoE = false;
    let aoeDamage = 0;
    let isCleave = false;

    for (const ab of activeAbilities) {
        if (!ab) continue;
        if (ab.includes('Sharpened') || ab.includes('Base Damage')) roundDps += Math.floor(roundDps * 0.05);
        if (ab.includes('Heavy Strike') && rounds === 1) roundDps += Math.floor(roundDps * 0.10);
        if (ab.includes('Fleetfoot') && rounds === 1) { 
            const tgt = activeEnemies.find(e => !e.isDead);
            if (tgt) { tgt.hp -= 5; totalDamageDealt += 5; }
        }
        if (ab.includes('Lone Wolf')) roundDps += Math.floor(roundDps * 0.15);
        if (ab.includes('Backstab') && rounds === 1) roundDps += Math.floor(roundDps * 0.25);
        
        if (ab.includes('Assassin') && weaponClass === 'FINESSE_WEAPON') {
            const pctMatch = ab.match(/(\\d+)%/);
            const amt = pctMatch ? parseInt(pctMatch[1]) / 100 : 0.10;
            roundDps += Math.floor(roundDps * amt);
        }
        if (ab.includes('Poison') || ab.includes('Venom')) {
             roundActions.push('🧪 Added Poison Stacks');
        }
        if (ab.includes('Ignite') || ab.includes('Burn')) {
            const b = 100; roundDps += b; totalBurnDamage += b;
        }
        if (ab.includes('Cleave') && !mob.name.includes('Boss')) {
            isCleave = true;
        }
        if (ab.includes('Armor Breaker') && rounds === 1) {
            roundDps = Math.floor(roundDps * 1.50);
            abilityMsg += '🌟 \`Armor Breaker\` shattered enemy defenses!';
        }
        if (ab.includes('Mana Tap') || ab.includes('Serenity')) {
            playerHp = Math.min(player.maxHp, playerHp + 10);
        }
        if (ab.includes('Ember') || ab.includes('Molten Core')) roundDps += 25;
        if (ab.includes('Arcane Overflow') && Math.random() > 0.90) {
            roundDps += 125;
            abilityMsg += '🌟 \`Arcane Overflow\` triggered!';
        }
        if (ab.includes('Meteor') && Math.random() > 0.90) {
            isAoE = true;
            aoeDamage += 1500;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌋 **METEOR IMPACT!** (1500 AoE DMG)'; }
        }
        if (ab.includes('Event Horizon') && Math.random() > 0.95 && !mob.name.includes('Boss')) {
            isAoE = true; aoeDamage += 99999;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌑 **EVENT HORIZON!** (Banished all)'; }
        }
        if (ab.includes('Assassinate') && Math.random() > 0.85) {
            roundDps += 9999;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🔪 **ASSASSINATED!**'; }
        }
        if (ab.includes('Heroic Legacy') && Math.random() > 0.95) {
            roundDps *= 2;
            if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '🌟 **HEROIC LEGACY!** (Damage Doubled!)'; }
        }
        if (ab.includes('Shadow Flurry') && Math.random() > 0.85) { roundDps *= 3; }
        if (ab.includes('Windrunner') && Math.random() > 0.85) { roundDps *= 2; }
    }

    if (activeAbilities.join(',').includes('Armageddon') && Math.random() > 0.80) {
        isAoE = true; aoeDamage += 10000;
        if (!jackpotTriggered) { jackpotTriggered = true; jackpotMessage = '☄️ **ARMAGEDDON!** (10,000 AoE DMG)'; }
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

    if (gearLifesteal > 0) {
      const heal = Math.floor(roundDps * (gearLifesteal / 100));
      playerHp = Math.min(player.maxHp, playerHp + heal);
      totalLifesteal += heal;
    }

    // Identify Primary Target
    let target = activeEnemies.find(e => !e.isDead);
    if (!target) break;

    // Apply AoE / Cleave / Single Target Damage
    let damageString = '';
    const wName = weaponName || 'Bare Hands';
    
    if (isAoE) {
        activeEnemies.forEach(e => {
           if (!e.isDead) { e.hp -= aoeDamage; totalDamageDealt += aoeDamage; if(e.hp <= 0) e.isDead = true; }
        });
        damageString = \`☄️ You unleashed your **\${wName}** dealing **\${aoeDamage} AoE DMG** to all enemies!\`;
    } else {
        target.hp -= roundDps;
        totalDamageDealt += roundDps;
        damageString = \`🗡️ You swung your **\${wName}** at the **\${target.name}** for **\${roundDps}** DMG\`;
        
        if (isExecute) damageString = \`💥 **CRITICAL EXECUTION!** You obliterated the **\${target.name}** with your **\${wName}** for **\${roundDps}** DMG\`;
        else if (isCrit) damageString = \`💥 **CRITICAL HIT!** You viciously struck the **\${target.name}** with your **\${wName}** for **\${roundDps}** DMG\`;
        
        if (target.hp <= 0) {
            target.isDead = true;
            damageString += \`, instantly **SLAYING** it! 💀\`;
        }

        if (isCleave && activeEnemies.filter(e => !e.isDead).length > 0) {
            let nextTarget = activeEnemies.find(e => !e.isDead);
            if (nextTarget) {
                let cleaveDmg = Math.floor(roundDps * 0.5);
                nextTarget.hp -= cleaveDmg;
                totalDamageDealt += cleaveDmg;
                cleaveTriggered = true;
                damageString += \`\\n↳ 🌪️ Your cleave carried through, hitting **\${nextTarget.name}** for **\${cleaveDmg}** DMG!\`;
                if (nextTarget.hp <= 0) { nextTarget.isDead = true; damageString += \` 💀\`; }
            }
        }
    }

    // Apply DoTs
    const abilitiesStr = activeAbilities.join(',');
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
            dotString += \`\\n↳ 🩸 **\${e.name}** bled for \${tick} True DMG\`;
            if (e.hp <= 0) e.isDead = true;
        }
        if (e.poisonStacks > 0 && abilitiesStr.includes('Venom Pop') && e.poisonStacks >= 5) {
            const burst = Math.floor(player.maxHp * 0.15 * e.poisonStacks);
            e.hp -= burst; e.poisonStacks = 0;
            dotString += \`\\n↳ 💥 **VENOM POP!** \${e.name} detonated for \${burst} True DMG\`;
            if (e.hp <= 0) e.isDead = true;
        }
    });

    if (dotString !== '') damageString += dotString;
    combatLog.push(roundTitle + '\\n' + \`> \${damageString}\`);

    // Check if all enemies are dead
    if (activeEnemies.every(e => e.isDead)) break;

    // --- ENEMY PHASE (Multi-Target Incoming) ---
    let rawIncoming = 0;
    let poisonMitigatedThisRound = 0;

    for (const em of activeEnemies) {
        if (em.isDead) continue;
        
        let emAtk = em.atk;
        if (abilitiesStr.includes('Plague')) emAtk = Math.floor(emAtk * 0.90);
        if (abilitiesStr.includes('Eclipse') && Math.random() > 0.90) emAtk = Math.floor(emAtk * 0.50);
        
        // Attack Roll
        let swing = Math.floor(Math.random() * emAtk) + Math.floor(emAtk / 2);
        
        if (em.poisonStacks > 0 && !abilitiesStr.includes('Venom Pop')) {
             const reduction = Math.floor(swing * (0.05 * em.poisonStacks));
             swing -= reduction;
             poisonMitigatedThisRound += reduction;
        }
        rawIncoming += swing;
    }
    
    totalPoisonMitigated += poisonMitigatedThisRound;

    if (abilitiesStr.includes('Parasitic Siphon')) {
        let totalStacks = activeEnemies.reduce((acc, e) => acc + e.poisonStacks, 0);
        if (totalStacks > 0) {
            const leech = Math.floor(player.maxHp * 0.01 * totalStacks);
            playerHp = Math.min(player.maxHp, playerHp + leech);
            roundActions.push(\`🧛 Siphoned \${leech} HP from poisoned enemies\`);
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
      abilityHighlights += \`🌟 \\\`Juggernaut\\\` reflected \${rawIncoming} DMG back! 🔄\\n\`;
      rawIncoming = 0;
    }

    if (rawIncoming < 0) rawIncoming = 0;

    if (playerHp - rawIncoming <= 0 && hasUndying && !undyingTriggered) {
        undyingTriggered = true; playerHp += 100; rawIncoming = 0; 
        abilityHighlights += \`✨ \\\`Undying\\\` saved you from a fatal blow!\\n\`;
    }
    
    if (playerHp - rawIncoming <= 0 && activeAbilities.join(',').includes('Deathless King') && !undyingTriggered) {
        undyingTriggered = true; playerHp += player.maxHp; rawIncoming = 0; playerBaseOutput *= 2; 
        abilityHighlights += \`🌟 \\\`Deathless King\\\` revived you at FULL HP and Doubled your ATK!\\n\`;
    }

    if (activeAbilities.join(',').includes('Singularity') && Math.random() > 0.90 && rawIncoming > 0) {
        if (activeEnemies[0] && !activeEnemies[0].isDead) activeEnemies[0].hp -= (rawIncoming * 3);
        abilityHighlights += \`🌟 \\\`Singularity\\\` absorbed \${rawIncoming} DMG and reflected it! 🔄\\n\`;
        rawIncoming = 0;
    }

    playerHp -= rawIncoming;
    totalDamageTaken += rawIncoming;
    
    let eStr = '';
    if (evaded) {
        eStr = \`> 💨 The enemy pack swarmed you, but you completely **evaded** their attacks!\`;
    } else {
        let preMit = rawIncoming + mitigation;
        let pTxt = packSize > 1 ? 'The pack retaliated' : 'The enemy retaliated';
        eStr = \`> 🛡️ \${pTxt} dealing **\${rawIncoming}** DMG to you.\`;
        
        let tags = [];
        if (mitigation > 0) tags.push(\`🛡️ \${Math.min(mitigation, preMit)} Blocked\`);
        if (poisonMitigatedThisRound > 0) tags.push(\`🧪 Poison Weakened\`);
        if (tags.length > 0) eStr += \` *[\${tags.join(' | ')}]*\`;
    }
    
    if (activeHot > 0 && playerHp > 0) {
        playerHp = Math.min(maxHpWithPet, playerHp + activeHot);
    }
    
    // Add enemy counter-attack log below player log
    combatLog[combatLog.length - 1] += '\\n' + eStr;
    
    if (roundActions.length > 0) {
       combatLog[combatLog.length - 1] += '\\n' + roundActions.join('\\n');
    }
  }
  
  // Calculate remaining monster HP for failure states
  let monsterHp = activeEnemies.reduce((acc, e) => acc + e.hp, 0);
  let monsterMaxHp = activeEnemies.reduce((acc, e) => acc + e.maxHp, 0);

  // --- UNIFIED COMBAT AGGREGATOR ---`;

const finalContent = content.slice(0, startIndex) + newLogic + content.slice(endIndex + endMarker.length);
fs.writeFileSync(path, finalContent);
console.log("hunt.ts successfully patched for MULTI-TARGET v2.");
