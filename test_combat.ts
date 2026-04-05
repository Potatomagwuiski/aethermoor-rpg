import { simulateCombat } from './src/engine/combat.js';
import { initializeFightEntity } from './src/engine/stats.js';
import { EntityData } from './src/engine/types.js';

const playerData: EntityData = {
    id: 'player_1',
    name: 'skyris6678',
    hp: 113,
    maxHp: 113,
    mana: 13,
    maxMana: 13,
    baseStats: { str: 16, dex: 21, int: 11 },
    defenses: { ac: 29, ev: 16, sh: 9 },
    damages: [{ type: 'physical', minAmount: 6, maxAmount: 23 }],
    attackSpeed: 0.89,
    meleeAccuracy: 10,
    hpRegen: 1.0,
    mpRegen: 0.0
};

const lonomiaData: EntityData = {
    id: 'mob_lonomia',
    name: 'Lonomia',
    hp: 200,
    maxHp: 200,
    mana: 0,
    maxMana: 0,
    baseStats: { str: 10, dex: 10, int: 5 },
    defenses: { ac: 8, ev: 50, sh: 2 },
    damages: [{ type: 'physical', minAmount: 4, maxAmount: 15 }],
    attackSpeed: 1.0,
    meleeAccuracy: 0,
    hpRegen: 0.0,
    mpRegen: 0.0
};

async function run() {
    console.log("Initializing combat test...\n");
    
    // Create stateful entities for this combat instance
    const p1 = initializeFightEntity(playerData);
    const m1 = initializeFightEntity(lonomiaData);

    const result = simulateCombat(p1, m1, 8);
    
    console.log(`Combat finished in ${result.turns} turns.`);
    console.log(`Winner: ${result.winner}`);
    console.log(`Final HP Left: ${result.finalHpLeft}`);
    
    console.log("\n--- EXCERPT LOGS ---");
    // Show first 15 logs (closing distance mostly) and last 30 logs (the kill)
    const preview = result.logs.slice(0, 15).concat(['...omitted for brevity...']).concat(result.logs.slice(-30));
    console.log(preview.join('\n'));
}

run().catch(console.error);
