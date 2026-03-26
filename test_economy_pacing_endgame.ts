async function simulateEndgame() {
  console.log('--- AETHERMOOR RPG: ENDGAME PACING SIMULATION ---');
  console.log('Parameters:');
  console.log('- Moonlight/Meteor Weapons (8-sided dice slot machine)');
  console.log('- 10-second strict Redis cooldown between hunts');
  
  let hp = 5000;
  let maxHp = 5000;
  let gold = 0;
  let xp = 0;
  let level = 50;

  let totalHunts = 0;
  let totalTimeSeconds = 0;
  let deaths = 0;

  // Let's simulate up to Level 60
  while (level <= 60) {
    totalHunts++;
    totalTimeSeconds += 10; // 10 second cooldown
    
    // Slot machine logic (Legendary = d8)
    const d1 = Math.floor(Math.random() * 8) + 1;
    const d2 = Math.floor(Math.random() * 8) + 1;
    const d3 = Math.floor(Math.random() * 8) + 1;
    let slotMultiplier = d1 + d2 + d3;
    if (d1 === d2 && d2 === d3) {
      slotMultiplier = slotMultiplier * slotMultiplier;
    }

    // Combat Math
    const baseDamage = 150; // endgame weapon
    const targetHp = 50 * level; 
    const damageNeeded = targetHp - (baseDamage * slotMultiplier);
    
    let damageTaken = 0;
    if (damageNeeded > 0) {
      // Monster fights back if not one-shotted
      damageTaken = Math.floor((Math.random() * 5 * level) + 50);
      hp -= damageTaken;
    }

    if (hp <= 0) {
      deaths++;
      hp = maxHp; // Resurrection via 100 gold potion
      gold -= 100;
      totalTimeSeconds += 30; // 30s penalty to buy/heal
    } else {
      // Rewards
      xp += 10 * slotMultiplier;
      gold += 5 * slotMultiplier;

      if (xp >= level * 100) {
        xp -= level * 100;
        level++;
        maxHp += 20;
        hp = maxHp; // heal on level up
      }
    }
  }

  const hours = Math.floor(totalTimeSeconds / 3600);
  const mins = Math.floor((totalTimeSeconds % 3600) / 60);

  console.log('\n--- SIMULATION RESULTS (Lv 50 to Lv 61) ---');
  console.log(`Total Hunts Executed: ${totalHunts}`);
  console.log(`Real World Time Required: ${hours}h ${mins}m`);
  console.log(`Total Deaths: ${deaths}`);
  console.log(`Gold Accumulated: ${gold}G`);
  console.log(`Final Status: Level ${level} Player`);
}

simulateEndgame().catch(console.error);
