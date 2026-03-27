const TIER = 1;
const HUNTS_PER_HOUR = 60; // Assuming 1 minute cooldown and perfect activity

let totalRawGold = 0;
let totalCores = 0;

for (let i = 0; i < HUNTS_PER_HOUR; i++) {
    // Adrenaline Slot Roll
    const d1 = Math.floor(Math.random() * 10) + 1;
    const d2 = Math.floor(Math.random() * 10) + 1;
    const d3 = Math.floor(Math.random() * 10) + 1;
    
    // Fixed Multipliers!
    let slotMultiplier = 1;
    if (d1 === d2 && d2 === d3) slotMultiplier = 20; // Jackpot
    else if (d1 === d2) slotMultiplier = 3; // Double Match

    // Base Hunt Gold
    totalRawGold += (25 * TIER) * slotMultiplier;
    // Base Core Drop
    totalCores += 1 * slotMultiplier;
}

console.log(`=== LEVEL 1 PLAYER METRICS (With 25 Base Gold & 3x/20x Modifiers) ===`);
console.log(`Total Hunts: ${HUNTS_PER_HOUR}`);
console.log(`-----------------------------------------------------`);
console.log(`Raw Gold Dropped: ${totalRawGold}`);
console.log(`Beast Cores Dropped: ${totalCores} (Sell Value: ${totalCores * 10} Gold)`);
console.log(`-----------------------------------------------------`);
const netWorth = totalRawGold + (totalCores * 10);
console.log(`Total Net Worth Generated hourly: ${netWorth} Gold`);
console.log(`Total Net Worth Generated per 2 hunts: ~${Math.floor(netWorth / 30)} Gold`);
console.log(`Cost of a Life Potion: 50 Gold`);
console.log(`\nANALYSIS: Now with 25 Base Gold, a player earns roughly 25-75 gold on average per hunt. They can easily afford life potions (50g) and save for a starter weapon (200g-300g) within 15 minutes of casual play without being broken.`);
