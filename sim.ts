function simulatePacing(hours: number, strategy: 'balanced' | 'aggressive') {
    let hp = 100;
    let gold = 0;
    let xp = 0;
    let level = 1;
    let actionsTaken = 0;
    let deaths = 0;
    
    let copperDrop = 0;
    
    // 30 second cooldowns = 120 actions per hour
    const totalActions = hours * 120;
    
    for (let i = 0; i < totalActions; i++) {
        // If dead, must heal
        if (hp <= 0) {
            deaths++;
            if (gold >= 50) {
                // Buy & Drink Potion (takes 1 action essentially or 0 actions, let's say 1 action)
                gold -= 50;
                hp = 100 + (level * 10);
                continue;
            } else {
                // Can't afford potion! Must REST (5 minutes = 10 actions skipped)
                i += 9; // skipping 9 more actions
                hp = 100 + (level * 10);
                continue;
            }
        }
        
        actionsTaken++;
        
        let chooseHunt = false;
        if (strategy === 'aggressive') {
            chooseHunt = true; // Always hunt
        } else {
            chooseHunt = i % 2 === 0; // Alternate Hunt and Work
        }
        
        if (chooseHunt) {
            // RPG HUNT Simulation
            // 🩸 Damage taken (Zone 1): 5 to 25
            const dmg = Math.floor(Math.random() * 20) + 5;
            hp -= dmg;
            
            // 🎰 Slots
            const d1 = Math.floor(Math.random() * 10) + 1;
            const d2 = Math.floor(Math.random() * 10) + 1;
            const d3 = Math.floor(Math.random() * 10) + 1;
            let mult = 1;
            if (d1 === d2 && d2 === d3) mult = 20;
            else if (d1 === d2) mult = 3;
            
            // 💰 Base Gold Drop for Zone 1 is Tier 1 = 25 Base
            const baseGold = 25;
            gold += baseGold * mult;
            
            // ✨ XP: 10 * mult
            xp += 10 * mult;
            
        } else {
            // RPG WORK Simulation (e.g. MINE)
            const dmg = 2; // Fixed exhaustion
            hp -= dmg;
            
            // 🎰 Slots
            const d1 = Math.floor(Math.random() * 10) + 1;
            const d2 = Math.floor(Math.random() * 10) + 1;
            const d3 = Math.floor(Math.random() * 10) + 1;
            let mult = 1;
            if (d1 === d2 && d2 === d3) mult = 20;
            else if (d1 === d2) mult = 3;
            
            copperDrop += (Math.floor(Math.random() * 3) + 1) * mult;
            xp += 5 * mult;
        }
        
        // Level up check
        let xpNeeded = level * 100;
        while (xp >= xpNeeded) {
            level++;
            xp -= xpNeeded;
            xpNeeded = level * 100;
        }
    }
    
    return {
        hours, strategy, level, gold, hp, deaths, copperDrop, 
        actionsAttempted: totalActions, 
        actualActionsPlayed: actionsTaken
    };
}

console.log("=== PACING SIMULATION (30s Cooldowns, 5m Rest) ===");
console.log("Player 1: Balanced (Alternating Hunt / Gather for 1 Hour)");
console.log(simulatePacing(1, 'balanced'));

console.log("\nPlayer 2: Aggressive (Only Hunting for 1 Hour)");
console.log(simulatePacing(1, 'aggressive'));

console.log("\nPlayer 3: Aggressive Grinder (Hunting for 3 Hours)");
console.log(simulatePacing(3, 'aggressive'));
