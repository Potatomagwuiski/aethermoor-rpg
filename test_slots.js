let totalRolls = 10000;
let baseRolls = 0;
let doubleMatches = 0;
let tripleMatches = 0;

let sampleDouble = null;
let sampleTriple = null;

for(let i=0; i<totalRolls; i++) {
  const d1 = Math.floor(Math.random() * 10) + 1;
  const d2 = Math.floor(Math.random() * 10) + 1;
  const d3 = Math.floor(Math.random() * 10) + 1;

  if (d1 === d2 && d2 === d3) {
    tripleMatches++;
    if (!sampleTriple) sampleTriple = `[${d1}] [${d2}] [${d3}] = Math.pow(${d1+d2+d3}, 2) = ${Math.pow(d1+d2+d3, 2)}x JACKPOT!`;
  } else if (d1 === d2) {
    doubleMatches++;
    if (!sampleDouble) sampleDouble = `[${d1}] [${d2}] [${d3}] = ${d1+d2+d3}x MATCH!`;
  } else {
    baseRolls++;
  }
}

console.log(`=== ADRENALINE SLOT MACHINE SIMULATION (10,000 Pulls) ===`);
console.log(`No Match (1x Multiplier Standard Loot): ${(baseRolls / totalRolls * 100).toFixed(2)}%`);
console.log(`Double Matches (d1 === d2): ${(doubleMatches / totalRolls * 100).toFixed(2)}%    >> Example: ${sampleDouble}`);
console.log(`Triple Jackpots (d1 === d2 === d3): ${(tripleMatches / totalRolls * 100).toFixed(2)}%   >> Example: ${sampleTriple}`);
