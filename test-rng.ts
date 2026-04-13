import { MATERIALS, Material } from './src/game/materials';

// Gathering RNG Core logic exact copy from src/commands/gather.ts
function simulateGather() {
  const availableMats = Object.values(MATERIALS) as Material[];
  const numTypes = Math.min(availableMats.length, Math.floor(Math.random() * 4) + 1);
  
  availableMats.sort(() => Math.random() - 0.5);
  const gatheredMats = availableMats.slice(0, numTypes);
  
  const results = [];
  for (const mat of gatheredMats) {
    const baseAmount = Math.floor(Math.random() * 15) + 5; // 5 to 19 roughly
    const quantity = Math.max(1, Math.floor(baseAmount * mat.dropChanceMultiplier));
    results.push({ id: mat.id, name: mat.name, quantity });
  }
  return results;
}

const ITERATIONS = 100000;
const stats: Record<string, { totalQuantity: number; appearanceCount: number }> = {};

for (const mat of Object.values(MATERIALS) as Material[]) {
  stats[mat.id] = { totalQuantity: 0, appearanceCount: 0 };
}

for (let i = 0; i < ITERATIONS; i++) {
  const gatherResults = simulateGather();
  for (const res of gatherResults) {
    stats[res.id].totalQuantity += res.quantity;
    stats[res.id].appearanceCount++;
  }
}

console.log(`Simulation over ${ITERATIONS} gathers:\n`);
console.log("=== Item Frequency (Chance to appear in a single gather) ===");
for (const mat of Object.values(MATERIALS) as Material[]) {
  const appearanceRate = ((stats[mat.id].appearanceCount / ITERATIONS) * 100).toFixed(1);
  console.log(`${mat.name} (${mat.rarity}): ${appearanceRate}%`);
}

console.log("\n=== Average Quantity Gained per Appearance ===");
for (const mat of Object.values(MATERIALS) as Material[]) {
  const avgQ = (stats[mat.id].totalQuantity / stats[mat.id].appearanceCount).toFixed(2);
  console.log(`${mat.name} (${mat.rarity}): ~${avgQ} units`);
}

console.log("\n=== Average Value Gained Per Gather Action (across all possible rolls) ===");
for (const mat of Object.values(MATERIALS) as Material[]) {
  const avgTotal = (stats[mat.id].totalQuantity / ITERATIONS).toFixed(2);
  console.log(`${mat.name} (${mat.rarity}): ${avgTotal} units per gather`);
}
