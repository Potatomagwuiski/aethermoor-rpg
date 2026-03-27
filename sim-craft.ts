function simulateCraftingGoal(targetPrimary: number, targetSecondary: number, targetTertiary: number) {
    let actions = 0;
    
    let primary = 0;
    let secondary = 0;
    let tertiary = 0;
    
    let jackpots = 0;
    let matches = 0;
    
    // Simulate gathering until we hit the targets
    while (primary < targetPrimary || secondary < targetSecondary || tertiary < targetTertiary) {
        actions++;
        
        const d1 = Math.floor(Math.random() * 10) + 1;
        const d2 = Math.floor(Math.random() * 10) + 1;
        const d3 = Math.floor(Math.random() * 10) + 1;
        let mult = 1;
        
        if (d1 === d2 && d2 === d3) {
            mult = 20;
            jackpots++;
        } else if (d1 === d2) {
            mult = 3;
            matches++;
        }
        
        // Base drop is 1 to 3
        const drop = (Math.floor(Math.random() * 3) + 1) * mult;
        
        // Prioritize what we lack
        if (primary < targetPrimary) {
            primary += drop;
        } else if (secondary < targetSecondary) {
            secondary += drop;
        } else {
            tertiary += drop;
        }
    }
    
    return {
        actions,
        timeMinutes: (actions * 30) / 60,
        jackpots,
        matches,
        leftoverPrimary: primary - targetPrimary,
        leftoverSecondary: secondary - targetSecondary,
        leftoverTertiary: tertiary - targetTertiary
    };
}

let totalActions = 0;
let totalTime = 0;
let matchHits = 0;
let jackpotHits = 0;

for (let i = 0; i < 1000; i++) {
    const res = simulateCraftingGoal(15, 5, 2); // Copper Sword Target
    totalActions += res.actions;
    totalTime += res.timeMinutes;
    matchHits += res.matches;
    jackpotHits += res.jackpots;
}

console.log("=== THE CRAFTING PROGRESSION SIMULATION ===");
console.log("Goal: Copper Sword (15 Copper, 5 Wood, 2 Seaweed)");
console.log("- Average Drops Required (No Multiplier): 11 Hits");
console.log(`- Average Simulated Actions Taken: ${(totalActions / 1000).toFixed(1)}`);
console.log(`- Average Time Real-World: ${(totalTime / 1000).toFixed(1)} minutes`);
console.log(`- Probability of pulling a 3x Match during the grind: ~${((matchHits / 1000) * 100).toFixed(0)}%`);
console.log(`- Probability of pulling a 20x Jackpot during the grind: ~${((jackpotHits / 1000) * 100).toFixed(0)}%`);
