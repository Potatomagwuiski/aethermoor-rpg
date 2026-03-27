const fs = require('fs');

const files = [
  'src/commands/hunt.ts',
  'src/commands/mine.ts',
  'src/commands/chop.ts',
  'src/commands/harvest.ts',
  'src/commands/fish.ts'
];

for(const p of files) {
  let c = fs.readFileSync(p, 'utf8');
  
  // They all use logic like: 
  // if (await enforceCooldown(cdKey, 30)) {
  //    return message.reply(`... You must wait 30 seconds before ...`); // Or something similar
  
  if (c.includes('enforceCooldown(cdKey, 30)')) {
    c = c.replace(/if \(await enforceCooldown\(cdKey, 30\)\) \{/, 'const cd = await enforceCooldown(cdKey, 30);\n  if (cd.onCooldown) {');
    
    // Replace the hardcoded "wait 30 seconds" or "wait a few seconds" with dynamic remaining time
    c = c.replace(/wait 30 seconds/g, 'wait ${Math.ceil(cd.remainingMs / 1000)} seconds');
    c = c.replace(/Wait a few seconds!/g, 'Wait ${Math.ceil(cd.remainingMs / 1000)} seconds!');
    
    // Convert template string literal style if it's currently hardcoded with standard single quotes
    // e.g. return message.reply('⏳ **Exhausted!** You are still recovering from your last hunt. Wait ${Math...} seconds!');
    // we need to make sure the quotes are backticks for interpolation to work.
    c = c.replace(/return message.reply\('⏳ \*\*Exhausted!\*\* (.*?)\'\);/g, "return message.reply(`⏳ **Exhausted!** $1`);");
  }
  
  fs.writeFileSync(p, c);
}

// REST command (300 seconds)
let rest = fs.readFileSync('src/commands/rest.ts', 'utf8');
rest = rest.replace(/if \(await enforceCooldown\(cdKey, 300\)\) \{/, 'const cd = await enforceCooldown(cdKey, 300);\n  if (cd.onCooldown) {');
rest = rest.replace(/You must wait 5 minutes/g, 'You must wait ${Math.ceil(cd.remainingMs / 60000)} minutes');
// Fix single quote strings in rest if they exist
rest = rest.replace(/return message.reply\('(.*?)'\);/g, "return message.reply(`$1`);");
fs.writeFileSync('src/commands/rest.ts', rest);

console.log('patched files');
