const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'commands', 'hunt.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const tStart = content.indexOf('    for (const ab of activeAbilities) {');
const tEnd = content.indexOf('Armageddon');

if (tStart === -1 || tEnd === -1) {
    console.error("Could not find blocks");
    process.exit(1);
}

const newBlock = `
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
    
    // De-Armor
    if (target && target.affixes) {
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
    if (abilitiesStr.includes('Fissure') && Math.random() < 0.20 && target && target.affixes && target.affixes.includes('ARMORED')) {
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
    if (abilitiesStr.includes('Shooting Star') && target && target.name.includes('🌟')) {
         if (!isCrit) { roundDps = Math.floor(roundDps * 1.5); isCrit = true; }
    }
    if (abilitiesStr.includes('Deadly Aim') && isCrit) roundDps = Math.floor(roundDps * (2.0 / 1.5)); 
    if (abilitiesStr.includes('Skull Crusher') && Math.random() < 0.25) {
         roundDps *= 3;
         isCrit = true;
    }

`;

content = content.slice(0, tStart) + newBlock + content.slice(tEnd);

// Also remove the old `const abilitiesStr = activeAbilities.join(',');` later down since we define it earlier now.
// However we can just let it redefine using \`var\` or safely scope it. Actually we don't need to touch it if they are in different blocks, 
// wait NO, `const` re-declaration in the same block will throw an error!
content = content.replace(/const abilitiesStr = activeAbilities\.join\(',',?\);/g, ''); 
// Re-add one at DoT layer to be safe if scopes break, but it shouldn't because the whole while loop is one block?
// No, while loop is one big block. Removing it via replace regex is safer.

fs.writeFileSync(targetPath, content);
console.log("hunt.ts successfully patched for Player Strike Phase");
