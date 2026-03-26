function runSlotMachine() {
  const d1 = Math.floor(Math.random() * 6) + 1;
  const d2 = Math.floor(Math.random() * 6) + 1;
  const d3 = Math.floor(Math.random() * 6) + 1;
  let slotMultiplier = d1 + d2 + d3;
  let isSlotJackpot = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    slotMultiplier = slotMultiplier * slotMultiplier;
  }

  let slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **${Math.sqrt(slotMultiplier)}x Multiplier!**`;
  if (isSlotJackpot) {
    slotMachineString = `> 🎰 \`[ 🎲 x${d1} ] [ 🎲 x${d2} ] [ 🎲 x${d3} ]\` = **!!! ${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥`;
  }
  return { multiplier: slotMultiplier, text: slotMachineString, isSlotJackpot };
}

console.log("=== THE HUNT SLOT MACHINE ===");
let totalGold = 0;
for(let i=0; i<10; i++) {
   const res = runSlotMachine();
   const gold = 5 * res.multiplier;
   totalGold += gold;
   console.log(`[Hunt ${i+1}] ${res.text} -> You got ${gold} Gold!`);
}

console.log(`\n=== THE FORGE AFFIX GENERATOR ===`);
function testForge() {
   let finalName = '🟦 [Rare Meteor Staff]';
   let bAtk = 120;
   const prefixes = [
        { name: 'Savage', stat: 'Atk', val: Math.floor(120 * 0.15) || 1 },
        { name: 'Vampiric', stat: 'Lifesteal', val: 5 },
        { name: 'Toxic', stat: 'Crit', val: 10 },
        { name: 'Swift', stat: 'Evasion', val: 5 }
    ];
    const suffixes = [
        { name: 'of the Blood God', stat: 'Lifesteal', val: 10 },
        { name: 'of the Void', stat: 'Crit', val: 15 },
        { name: 'of the Titan', stat: 'Atk', val: Math.floor(120 * 0.25) || 2 },
        { name: 'of the Wind', stat: 'Evasion', val: 10 }
    ];

    if (Math.random() > 0.5) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        finalName = finalName.replace('[', `[${p.name} `);
    }
    if (Math.random() > 0.7) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        finalName = finalName.replace(']', ` ${s.name}]`);
    }
    
    return finalName;
}

for(let i=0; i<10; i++) {
   console.log(`[Forge ${i+1}] You successfully forged: ${testForge()}`);
}
