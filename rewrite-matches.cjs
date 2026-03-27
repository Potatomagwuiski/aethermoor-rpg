const fs = require('fs');
const path = require('path');

const cmdsDir = path.join(__dirname, 'src', 'commands');
const files = ['mine.ts', 'chop.ts', 'harvest.ts', 'fish.ts', 'hunt.ts'];

const mathTarget = `let slotMultiplier = 1;
  let isSlotJackpot = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    slotMultiplier = Math.pow(d1 + d2 + d3 + Math.floor(slotBonus / 2), 2); 
  }`;

const mathReplacement = `let slotMultiplier = 1;
  let isSlotJackpot = false;
  let isSlotMatch = false;

  if (d1 === d2 && d2 === d3) {
    isSlotJackpot = true;
    // Keep it massive for the 1%
    slotMultiplier = Math.pow(d1 + d2 + d3 + slotBonus, 2); 
  } else if (d1 === d2) {
    isSlotMatch = true;
    // Exactly a 9% chance for this block!
    slotMultiplier = d1 + d2 + d3 + slotBonus; 
  }`;

const uiTargetGathering = `let slotMachineString = \`> 🎰 \\\`[ 🎲 x\${d1} ] [ 🎲 x\${d2} ] [ 🎲 x\${d3} ]\\\`\`;
  if (isSlotJackpot) {
    slotMachineString += \` = **!!! \${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥\`;
  }`;

const uiReplacementGathering = `let slotMachineString = \`> 🎰 \\\`[ 🎲 x\${d1} ] [ 🎲 x\${d2} ] [ 🎲 x\${d3} ]\\\`\`;
  if (isSlotJackpot) {
    slotMachineString += \` = **!!! \${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥\`;
  } else if (isSlotMatch) {
    slotMachineString += \` = **\${slotMultiplier}x MATCH!** 🔥\`;
  }`;

const uiTargetHunt = `let slotStr = \`> 🎰 \\\`[ 🎲 x\${d1} ] [ 🎲 x\${d2} ] [ 🎲 x\${d3} ]\\\`\`;
  if (isSlotJackpot) slotStr += \` = **!!! \${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥\`;
  responseBody += \`\${slotStr}\\n\\n🛍️ **Final Payout:** 🪙 \${goldReward} Gold | ✨ \${xpReward} XP\\n\`;`;

const uiReplacementHunt = `let slotStr = \`> 🎰 \\\`[ 🎲 x\${d1} ] [ 🎲 x\${d2} ] [ 🎲 x\${d3} ]\\\`\`;
  if (isSlotJackpot) slotStr += \` = **!!! \${slotMultiplier}x JACKPOT MULTIPLIER !!!** 🔥🔥🔥\`;
  else if (isSlotMatch) slotStr += \` = **\${slotMultiplier}x MATCH!** 🔥\`;
  responseBody += \`\${slotStr}\\n\\n🛍️ **Final Payout:** 🪙 \${goldReward} Gold | ✨ \${xpReward} XP\\n\`;`;


for (const maxFile of files) {
    let p = path.join(cmdsDir, maxFile);
    let content = fs.readFileSync(p, 'utf8');

    // Math substitution for all 5 files
    content = content.replace(mathTarget, mathReplacement);

    if (maxFile !== 'hunt.ts') {
        content = content.replace(uiTargetGathering, uiReplacementGathering);
    } else {
        content = content.replace(uiTargetHunt, uiReplacementHunt);
    }

    fs.writeFileSync(p, content, 'utf8');
}
console.log('Script completed. 9% Double Match properly reinjected.');
