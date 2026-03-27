const fs = require('fs');

const gatherings = [
  {p: 'src/commands/mine.ts', name: 'Mine'},
  {p: 'src/commands/chop.ts', name: 'Chop'},
  {p: 'src/commands/harvest.ts', name: 'Harvest'},
  {p: 'src/commands/fish.ts', name: 'Fish'}
];

for(const f of gatherings) {
  let c = fs.readFileSync(f.p, 'utf8');

  // Change individual cdKeys to unified cd:work
  c = c.replace(/const cdKey = \`cd:[a-z]+:\$\{discordId\}\`;/g, 'const cdKey = `cd:work:${discordId}`;');

  // Change 60 to 30 in enforceCooldown
  c = c.replace(/if \(await enforceCooldown\(cdKey, 60\)\) \{/, 'if (await enforceCooldown(cdKey, 30)) {');

  // Replace error message text from "wait a minute" or "wait 2 minutes" to "wait 30 seconds"
  // Example: ⛏️ *Your arms are numb. You must wait a minute before swinging your pickaxe again.*
  c = c.replace(/You must wait a minute before/g, 'You must wait 30 seconds before');
  c = c.replace(/You must wait 2 minutes before/g, 'You must wait 30 seconds before');

  // Replace footer
  c = c.replace(/60s Cooldown started./g, '30s Cooldown started.');

  fs.writeFileSync(f.p, c);
}

// Hunt.ts
let hunt = fs.readFileSync('src/commands/hunt.ts', 'utf8');
hunt = hunt.replace(/await enforceCooldown\(cdKey, 60\)/, 'await enforceCooldown(cdKey, 30)');
hunt = hunt.replace(/60s Cooldown started./g, '30s Cooldown started.');
fs.writeFileSync('src/commands/hunt.ts', hunt);

// Rest.ts
let rest = fs.readFileSync('src/commands/rest.ts', 'utf8');
rest = rest.replace(/await enforceCooldown\(cdKey, 900\)/, 'await enforceCooldown(cdKey, 300)');
rest = rest.replace(/15 minutes/g, '5 minutes');
fs.writeFileSync('src/commands/rest.ts', rest);

console.log("Unified and sped up!");
