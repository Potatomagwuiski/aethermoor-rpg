// test-gold.ts
const TIER = 1;
const HUNTS_PER_HOUR = 60; // Assuming 1 minute cooldown and perfect activity

let totalRawGold = 0;
let totalCores = 0;
let totalOres = 0;
let totalWood = 0;

for (let i = 0; i < HUNTS_PER_HOUR; i++) {
    // Simulate 1 Hunt
    // Adrenaline Slot Roll
    const d1 = Math.floor(Math.random() * 10) + 1;
    const d2 = Math.floor(Math.random() * 10) + 1;
    const d3 = Math.floor(Math.random() * 10) + 1;
    let slotMultiplier = 1;
    if (d1 === d2 && d2 === d3) slotMultiplier = Math.pow(d1 + d2 + d3, 2);
    else if (d1 === d2) slotMultiplier = d1 + d2 + d3;

    // Base Hunt Gold
    totalRawGold += (5 * TIER) * slotMultiplier;
    // Base Core Drop
    totalCores += 1 * slotMultiplier;

    // Simulate 1 Gather (Mine/Chop)
    // Cooldown is separate? Actually, in a 60 min period, they might do Hunt -> Mine -> Chop. Let's assume they only Hunt to test Hunt output.
}

console.log(`=== LEVEL 1 PLAYER METRICS (1 Hour of pure Hunting) ===`);
console.log(`Total Hunts: ${HUNTS_PER_HOUR}`);
console.log(`-----------------------------------------------------`);
console.log(`Raw Gold Dropped: ${totalRawGold}`);
console.log(`Beast Cores Dropped: ${totalCores} (Sell Value: ${totalCores * 10} Gold)`);
console.log(`-----------------------------------------------------`);
console.log(`Total Net Worth Generated: ${totalRawGold + (totalCores * 10)} Gold`);
console.log(`Time to afford Bronze Weapon (Costs 100g to build from Shop materials roughly): ~${Math.ceil(100 / ((totalRawGold + (totalCores * 10))/60))} minutes`);
