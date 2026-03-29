const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'commands', 'hunt.ts');
let content = fs.readFileSync(targetPath, 'utf8');

// 1. Pre-combat Evasion buffs
content = content.replace(
    /gearEvasion \+= bonusEvasion \+ Math\.floor\(player\.agi \* 0\.5\);/,
    `gearEvasion += bonusEvasion + Math.floor(player.agi * 0.5);
  const abilitiesStrPre = activeAbilities.join(',');
  if (abilitiesStrPre.includes('Lightweight')) gearEvasion += 5;
  if (abilitiesStrPre.includes('Swiftness')) gearEvasion += 15;
  if (abilitiesStrPre.includes('Lightning Reflexes')) gearEvasion += 20;
  if (abilitiesStrPre.includes('Hawk Eye')) gearCrit += 5;`
);

// 2. The Core Player Strike Abilities
content = content.replace(
    /let isAoE = false;/g,
    `let isStun = false;
        let isAoE = false;`
);

const abilityCheckBlock = `
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
        if (abilitiesStr.includes('Piercing Arrow')) target.affixes = target.affixes.filter((a: string) => a !== 'ARMORED');
        if (abilitiesStr.includes('Blunt Force') || abilitiesStr.includes('Shatter')) {
             if (Math.random() < (abilitiesStr.includes('Shatter') ? 0.2 : 0.1)) target.affixes = target.affixes.filter((a: string) => a !== 'ARMORED');
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
        
        if (abilitiesStr.includes('Moonbeam') && Math.random() < 0.20) { isAoE = true; aoeDamage = Math.floor(roundDps * 0.5); }
        if (abilitiesStr.includes('Meteor Swarm') && Math.random() < 0.15) { isAoE = true; aoeDamage = roundDps * 1.5; }
        if (abilitiesStr.includes('Supernova') && Math.random() < 0.10) { isAoE = true; aoeDamage = 9999; }
        if (abilitiesStr.includes('Whirlwind') && Math.random() < 0.15) { isAoE = true; aoeDamage = Math.floor(roundDps * 0.75); }
        
        let cleaveMod = 0.50;
        if (abilitiesStr.includes('Heavy Blade')) cleaveMod = 0.75;
        if (abilitiesStr.includes('Cleave') && Math.random() < 0.20) isCleave = true;
        if (abilitiesStr.includes('Wide Cleave') && Math.random() < 0.35) isCleave = true;
        if (abilitiesStr.includes('Guaranteed Cleave')) isCleave = true;
        
        if (abilitiesStr.includes('Earthquake') && Math.random() < 0.20) { isAoE = true; aoeDamage = roundDps; isStun = true; }
        if (abilitiesStr.includes('Tremor') && Math.random() < 0.30) isStun = true;
        if (abilitiesStr.includes('Stagger') && Math.random() < 0.20) isStun = true;
        
        if (abilitiesStr.includes('Quick Shot') && Math.random() < 0.15) roundDps *= 2; 
        if (abilitiesStr.includes('Volley') && Math.random() < 0.25) { isAoE = true; aoeDamage = Math.floor(roundDps * 1.0); }
        if (abilitiesStr.includes('Chain Lightning') && Math.random() < 0.30) { isAoE = true; aoeDamage = roundDps; }
        
        if (abilitiesStr.includes('Shooting Star') && target.name.includes('🌟')) {
             if (!isCrit) { roundDps = Math.floor(roundDps * 1.5); isCrit = true; }
        }
        if (abilitiesStr.includes('Phantom Strike') && Math.random() < 0.25) roundDps *= 2;
        if (abilitiesStr.includes('Black Hole')) {
             target.affixes = target.affixes.filter((a: string) => a !== 'EVASIVE');
        }
`;

content = content.replace(
    /if \(abilitiesStr\.includes\('Meteor'\) && Math\.random\(\) < 0\.10\) \{([\s\S]*?)isExecute = true;/m,
    `${abilityCheckBlock}

        if (isExecute) {
            isExecute = true;`
);

// 3. Enemy Defense / Mitigation phase
const mitigationBlock = `
    let emTotalIncoming = rawIncoming;
    if (abilitiesStr.includes('Parry') && Math.random() < 0.1) emTotalIncoming = 0;
    if (abilitiesStr.includes('Master Parry') && Math.random() < 0.25) emTotalIncoming = 0;
    if (abilitiesStr.includes('Heavy Blade')) emTotalIncoming = Math.max(0, emTotalIncoming - 2 * activeEnemies.filter(e=>!e.isDead).length);
    if (abilitiesStr.includes('Unseen') && rounds === 1) emTotalIncoming = 0;
    if (isStun) emTotalIncoming = 0; // Stunned enemies do 0 damage this round!
    
    // Apply final damage
    let finalIncoming = emTotalIncoming - mitigation;
`;

content = content.replace(
    /let finalIncoming = rawIncoming - mitigation;/,
    mitigationBlock
);

// 4. Update the Lifesteal and Siphon at end of round
content = content.replace(
    /if \(abilitiesStr\.includes\('Parasitic Siphon'\)\) \{/g,
    `if (abilitiesStr.includes('Lunar Grace')) {
        playerHp = Math.min(maxHpWithPet, playerHp + 5);
        roundActions.push(\`🌙 Lunar Grace healed 5 HP\`);
    }
    if (abilitiesStr.includes('Parasitic Siphon')) {`
);

content = content.replace(
    /if \(abilitiesStr\.includes\('Grim Memento'\)/g,
    `if (abilitiesStr.includes('Necromancy')) playerHp = Math.min(maxHpWithPet, playerHp + 5);
  if (abilitiesStr.includes('Grim Memento')`
);

content = content.replace(
    /let cleaveDmg = Math\.floor\(roundDps \* 0\.5\);/,
    `let cleaveDmg = Math.floor(roundDps * cleaveMod);`
);

fs.writeFileSync(targetPath, content);
console.log("hunt.ts physics patched for the 25 Weapons successfully.");
