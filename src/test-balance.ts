import { BLUEPRINTS } from './commands/forge.js';

// Mocked Mob Data for Tier 4 (Ashen Wastes pseudo-boss)
const TIER = 4;
const MOB = { name: 'Fire Elemental' };

function simulateCombat(weaponBlueprint: any, armorBlueprint: any) {
    let playerMaxHp = 1000;
    let playerHp = 1000;
    let playerAgi = 50;
    let playerStr = 50;
    let playerInt = 50;
    let playerEnd = 50;
    let playerLevel = 30;

    let monsterMaxHp = Math.floor((TIER * 40) + (playerLevel * 15 * TIER));
    let monsterHp = monsterMaxHp;
    let monsterAttackPower = Math.floor((TIER * 10) + (playerLevel * 4 * TIER));

    let roundCount = 0;
    const MAX_ROUNDS = 20;

    // Load Weapon
    let weaponClass = weaponBlueprint.outputs?.common?.equipmentClass || 'ANY';
    if (weaponBlueprint.outputs?.legendary?.equipmentClass) weaponClass = weaponBlueprint.outputs.legendary.equipmentClass;
    let gearAtk = weaponBlueprint.outputs?.legendary?.dps || weaponBlueprint.outputs?.epic?.dps || weaponBlueprint.outputs?.rare?.dps || 0;
    
    // Load Armor
    let armorClass = armorBlueprint.outputs?.common?.equipmentClass || 'ANY';
    if (armorBlueprint.outputs?.legendary?.equipmentClass) armorClass = armorBlueprint.outputs.legendary.equipmentClass;
    let gearDef = armorBlueprint.outputs?.legendary?.defense || armorBlueprint.outputs?.epic?.defense || armorBlueprint.outputs?.rare?.defense || 0;

    let gearCrit = 5;
    let gearEvasion = 5;
    let gearLifesteal = 0;

    let totalDamageDealt = 0;
    let activeAbilities = [...(weaponBlueprint.abilities || []), ...(armorBlueprint.abilities || [])];

    let bonusCrit = 0;
    let bonusEvasion = 0;
    let bonusDefPerc = 0;
    let hasUndying = false;
    let undyingTriggered = false;
    let energy = 100;

    // Pre-combat prep
    for (const ab of activeAbilities) {
        if (!ab) continue;
        const pctMatch = ab.match(/[+\s]?(\d+)%/);
        if (pctMatch) {
            const val = parseInt(pctMatch[1]);
            if (ab.includes('Evasion') || ab.includes('Dodge') || ab.includes('Swiftness') || ab.includes('Ethereal')) bonusEvasion += val;
            if (ab.includes('Critical') || ab.includes('Crit') || ab.includes('Focus')) bonusCrit += val;
        }
        const flatDefMatch = ab.match(/grants (\d+) bonus DEF/i) || ab.match(/blocks (\d+) incoming/i);
        if (flatDefMatch) gearDef += parseInt(flatDefMatch[1]);

        const flatHpMatch = ab.match(/\+(\d+) Max HP/i);
        if (flatHpMatch) { playerHp += parseInt(flatHpMatch[1]); playerMaxHp += parseInt(flatHpMatch[1]); }
        
        const reducedDmgMatch = ab.match(/physical damage by (\d+)%/i) || ab.match(/physical damage taken by (\d+)%/i);
        if (reducedDmgMatch) bonusDefPerc += parseInt(reducedDmgMatch[1]);

        if (ab.includes('Undying') || ab.includes('Phylactery')) hasUndying = true;
        
        if (ab.includes('Bloodlust') || ab.includes('Void Touched')) gearLifesteal += 5;
        if (ab.includes('Reap')) gearLifesteal += 10;
        if (ab.includes('Attuned') || ab.includes('Woven Magic')) energy += 5;
        if (ab.includes('Dark Whisper')) playerInt += 5;
        if (ab.includes('Bone Armor')) gearDef += Math.floor(playerInt * 0.5);
        if (ab.includes('Veil of Night')) {
          const evTransfer = Math.floor(gearEvasion * 0.2);
          gearEvasion -= evTransfer;
          gearDef += evTransfer;
        }
    }

    if (armorClass === 'LIGHT_ARMOR') gearEvasion += 15;
    gearCrit += bonusCrit;
    gearEvasion += bonusEvasion;

    let playerBaseOutput = Math.floor(playerLevel * 2);
    if (weaponClass === 'FINESSE_WEAPON') playerBaseOutput += Math.floor(playerAgi * 1.5);
    if (weaponClass === 'HEAVY_WEAPON') playerBaseOutput += Math.floor(playerStr * 2);
    if (weaponClass === 'MAGIC_WEAPON') playerBaseOutput += Math.floor(playerInt * 2.5);

    while (playerHp > 0 && monsterHp > 0 && roundCount < MAX_ROUNDS) {
        roundCount++;
        let roundDps = playerBaseOutput + gearAtk;
        let originalCrit = gearCrit;

        for (const ab of activeAbilities) {
            if (!ab) continue;
            if (ab.includes('Sharpened') || ab.includes('Base Damage')) roundDps += Math.floor(roundDps * 0.05);
            if (ab.includes('Heavy Strike') && roundCount === 1) roundDps += Math.floor(roundDps * 0.10);
            if (ab.includes('Backstab') && roundCount === 1) roundDps += Math.floor(roundDps * 0.25);
            if (ab.includes('Assassin') && weaponClass === 'FINESSE_WEAPON') roundDps += Math.floor(roundDps * 0.10);
            if (ab.includes('Poison') || ab.includes('Venom')) roundDps += (ab.includes('Lethal Dose') && monsterHp < (monsterMaxHp * 0.5)) ? 100 : 50;
            if (ab.includes('Ignite') || ab.includes('Burn')) roundDps += 100;
            if (ab.includes('Serrated Edge') || ab.includes('Bleed')) roundDps += 25;
            
            if (ab.includes('Cleave') && !MOB.name.includes('Boss')) roundDps += Math.floor(roundDps * 0.10);
            if (ab.includes('Beastbane') && MOB.name.includes('Wolf')) roundDps += Math.floor(roundDps * 0.50);
            if (ab.includes('Mythril Edge') || ab.includes('Spectral Edge')) roundDps += Math.floor(roundDps * 0.10);
            if (ab.includes('Armor Breaker') && roundCount === 1) roundDps = Math.floor(roundDps * 1.50);
            if (ab.includes('Alpha Predator') && MOB.name.includes('Wolf')) roundDps += Math.floor(roundDps * 0.25);
            if (ab.includes('Mana Tap') || ab.includes('Serenity')) playerHp = Math.min(playerMaxHp, playerHp + 10);
            if (ab.includes('Ember')) roundDps += 25;
            if (ab.includes('Arcane Overflow') && Math.random() > 0.90) roundDps += 125;
            if (ab.includes('Plague')) monsterAttackPower = Math.floor(monsterAttackPower * 0.90);
            if (ab.includes('Eclipse') && Math.random() > 0.90) monsterAttackPower = Math.floor(monsterAttackPower * 0.50);

            if (ab.includes('Meteor') && Math.random() > 0.90) roundDps += 1500;
            if (ab.includes('Execute') && monsterHp < (monsterMaxHp * (ab.includes('True Death') ? 0.40 : 0.30)) && Math.random() > 0.90) roundDps += 9999;
            if (ab.includes('Event Horizon') && Math.random() > 0.95) monsterHp = 0;
            if (ab.includes('Assassinate') && Math.random() > 0.85) roundDps += 9999;
            if (ab.includes('Void Strike') && Math.random() > 0.85) roundDps += Math.floor(roundDps * 0.50);
            if (ab.includes('Heroic Legacy') && Math.random() > 0.95) roundDps *= 2;
            if (ab.includes('Earthquake') && Math.random() > 0.90) roundDps *= 2;
            if (ab.includes('Shadow Flurry') && Math.random() > 0.85) roundDps *= 3;
            if (ab.includes('Abyssal Echo') && Math.random() > 0.75) roundDps *= 2;
            if (ab.includes('Armageddon') && Math.random() > 0.80) roundDps += 10000;
        }

        if (roundCount <= 3 && activeAbilities.join(',').includes('Full Moon')) gearCrit = 100;
        if (roundCount === 1 && activeAbilities.join(',').includes('Ambush')) gearCrit = 100;

        if (Math.random() * 100 < gearCrit) roundDps *= 2;
        gearCrit = originalCrit;

        if (gearLifesteal > 0) playerHp = Math.min(playerMaxHp, playerHp + Math.floor(roundDps * (gearLifesteal / 100)));

        monsterHp -= roundDps;
        totalDamageDealt += roundDps;

        if (monsterHp <= 0) break;

        let rawIncoming = Math.floor(Math.random() * monsterAttackPower) + Math.floor(monsterAttackPower / 2);
        let mitigation = Math.floor(gearDef * 0.75) + Math.floor(playerEnd * 1);

        for (const ab of activeAbilities) {
            if (!ab) continue;
            if (ab.includes('Mana Shield')) rawIncoming = Math.floor(rawIncoming * 0.90);
            if (ab.includes('Sturdy')) rawIncoming = Math.floor(rawIncoming * 0.99);
            if (ab.includes('Plated')) rawIncoming = Math.floor(rawIncoming * 0.98);
            if (ab.includes('Hardened')) rawIncoming = Math.floor(rawIncoming * 0.97);
            if (ab.includes('Alloyed Armor')) rawIncoming = Math.floor(rawIncoming * 0.95);
            if (ab.includes('Shadow Step') && roundCount === 1) rawIncoming = 0;
            if (ab.includes('Unseen Predator') && roundCount === 1) rawIncoming = 0;
            if (ab.includes('Invulnerability') && roundCount === 1) rawIncoming = 0;
            if (ab.includes('Deflection') && Math.random() > 0.98) rawIncoming = Math.floor(rawIncoming * 0.5);
            if (ab.includes('Smoke Bomb') && Math.random() > 0.85) rawIncoming = 0;
            if (ab.includes('Bulwark') && Math.random() > 0.95) rawIncoming = 0;
            if (ab.includes('Unbreakable') && playerHp < (playerMaxHp * 0.25)) mitigation += 50;
            if (ab.includes('Lord of Death') && roundCount === 1) mitigation += 100;
        }

        if (bonusDefPerc > 0) rawIncoming = Math.floor(rawIncoming * (1 - (bonusDefPerc / 100)));
        if (armorClass === 'HEAVY_ARMOR') rawIncoming = Math.floor(rawIncoming * 0.9);

        if (Math.random() * 100 < gearEvasion || (activeAbilities.join(',').includes('Shadow Realm') && Math.random() > 0.95)) {
            rawIncoming = 0;
        } else {
            rawIncoming -= mitigation;
        }

        if (activeAbilities.join(',').includes('Juggernaut') && Math.random() > 0.90) {
            roundDps += rawIncoming; 
            rawIncoming = 0;
        }

        if (rawIncoming < 0) rawIncoming = 0;

        if (playerHp - rawIncoming <= 0 && hasUndying && !undyingTriggered) {
            undyingTriggered = true;
            playerHp += 100;
            rawIncoming = 0;
        }

        if (playerHp - rawIncoming <= 0 && activeAbilities.join(',').includes('Deathless King') && !undyingTriggered) {
            undyingTriggered = true;
            playerHp += playerMaxHp;
            rawIncoming = 0;
            playerBaseOutput *= 2;
        }

        if (activeAbilities.join(',').includes('Singularity') && Math.random() > 0.90) {
            roundDps += rawIncoming * 3;
            rawIncoming = 0;
        }

        playerHp -= rawIncoming;
    }

    return { win: playerHp > 0, rounds: roundCount, remainingHp: playerHp, totalDamageDealt };
}

function runSimulations() {
    const weapons = Object.keys(BLUEPRINTS).filter(k => BLUEPRINTS[k].outputs?.epic?.dps || BLUEPRINTS[k].outputs?.rare?.dps);
    const armors = Object.keys(BLUEPRINTS).filter(k => BLUEPRINTS[k].outputs?.epic?.defense || BLUEPRINTS[k].outputs?.rare?.defense);

    const matchUps: any[] = [];

    // Test each weapon with a standard mid-tier armor (iron_chestplate)
    for (const w of weapons) {
        let wins = 0;
        let totalRounds = 0;
        let totalDamage = 0;
        const ITERS = 1000;
        for (let i = 0; i < ITERS; i++) {
            const result = simulateCombat(BLUEPRINTS[w], BLUEPRINTS['iron_chestplate']);
            if (result.win) wins++;
            totalRounds += result.rounds;
            totalDamage += result.totalDamageDealt;
        }
        matchUps.push({
            type: 'Weapon',
            name: BLUEPRINTS[w].name,
            winRate: (wins / ITERS * 100).toFixed(1) + '%',
            avgRounds: (totalRounds / ITERS).toFixed(1),
            avgDamage: (totalDamage / ITERS).toFixed(0)
        });
    }

    // Test each armor with a standard mid-tier weapon (bronze_sword)
    for (const a of armors) {
        let wins = 0;
        let totalRounds = 0;
        let totalDamage = 0;
        const ITERS = 1000;
        for (let i = 0; i < ITERS; i++) {
            const result = simulateCombat(BLUEPRINTS['bronze_sword'], BLUEPRINTS[a]);
            if (result.win) wins++;
            totalRounds += result.rounds;
            totalDamage += result.totalDamageDealt;
        }
        matchUps.push({
            type: 'Armor',
            name: BLUEPRINTS[a].name,
            winRate: (wins / ITERS * 100).toFixed(1) + '%',
            avgRounds: (totalRounds / ITERS).toFixed(1),
            avgDamage: (totalDamage / ITERS).toFixed(0)
        });
    }

    console.table(matchUps);
}

runSimulations();
