const NUM_RUNS = 10000;
let keysDropped = 0;

for (let i = 0; i < NUM_RUNS; i++) {
  // Gacha phase logic from hunt.ts
  if (Math.random() <= 0.25) {
    const rarityRoll = Math.random();
    // > 0.95 means exactly top 5% of the 25% pool
    if (rarityRoll > 0.95) {
      keysDropped++;
    }
  }
}

const dropRate = (keysDropped / NUM_RUNS) * 100;
console.log(`\n--- DUNGEON KEY DROP RATE TEST ---`);
console.log(`Simulated Hunts: ${NUM_RUNS.toLocaleString()}`);
console.log(`Dungeon Keys Dropped: ${keysDropped}`);
console.log(`Effective Drop Rate: ${dropRate.toFixed(2)}% per hunt.`);

// Assuming 1 hunt every 15 seconds (typical RPG bot cooldown)
const huntsPerHour = (60 * 60) / 15;
const expectedKeysPerHour = huntsPerHour * (dropRate / 100);
console.log(`\nAt 1 hunt every 15 seconds (${huntsPerHour} hunts/hr), expected keys per hour: ${expectedKeysPerHour.toFixed(2)}`);
