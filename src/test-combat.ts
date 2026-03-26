import { prisma } from './db.js';

async function simulateCombat(level: number, tier: number, gearDef: number, playerEnd: number, hasBuff: boolean) {
  // 1. Calculate Player Core HP
  const maxHp = 100 + (level * 5) + (hasBuff ? 25 : 0); // koi soup gives +25

  // 2. Calculate Enemy Threat
  const baseEnemyThreat = Math.floor(tier * 20) + Math.floor(level * 6) + 15;
  
  // 3. Calculate Damage Taken Bounds
  const minRawDamage = Math.floor(baseEnemyThreat / 2);
  const maxRawDamage = minRawDamage + baseEnemyThreat;

  // 4. Calculate Player Mitigation
  const mitigation = Math.floor(gearDef * 0.75) + Math.floor(playerEnd * 2);

  // 5. Final Effective Damage
  const effectiveMin = Math.max(0, minRawDamage - mitigation);
  const effectiveMax = Math.max(0, maxRawDamage - mitigation);
  
  // 6. Hits to Die
  const minHitsToDie = Math.ceil(maxHp / effectiveMax);
  const maxHitsToDie = effectiveMin === 0 ? "Infinite" : Math.ceil(maxHp / effectiveMin);

  console.log(`\n--- SIMULATION: Level ${level} Player | Tier ${tier} Zone ---`);
  console.log(`Player Stats: ${maxHp} Max HP | ${gearDef} Armor DEF | ${playerEnd} END | Buffed: ${hasBuff}`);
  console.log(`Monster Raw Damage: ${minRawDamage} - ${maxRawDamage}`);
  console.log(`Player Mitigation: -${mitigation} Flat Damage`);
  console.log(`Effective Damage Taken: ${effectiveMin} - ${effectiveMax} per hit`);
  console.log(`🔥 SURVIVABILITY: Player dies in ${minHitsToDie} to ${maxHitsToDie} hits.`);
}

async function run() {
  console.log('======= AETHERMOOR BRUTALITY AUDIT =======');

  // Early Game (Level 1)
  await simulateCombat(1, 1, 0, 5, false);  // Absolute Beginner (0 Armor)
  await simulateCombat(1, 1, 15, 5, false); // Beginner with standard Wood Armor

  // Early-Midgame (Level 10)
  await simulateCombat(10, 1, 0, 5, false); // No armor
  await simulateCombat(10, 1, 25, 5, false); // Bronze Armor

  // Midgame Scenario
  await simulateCombat(30, 3, 0, 15, false); // Rushing to Ironpeak naked
  await simulateCombat(30, 3, 75, 15, true); // Prepared with Steel Armor + Koi Soup Buff

  // Endgame Scenario
  await simulateCombat(60, 5, 50, 20, false); // Undergeared
  await simulateCombat(60, 5, 200, 30, true); // Max Mythril Armor + Buffed
}

run().catch(console.error);
