const fs = require('fs');

const files = [
  {p: 'src/commands/mine.ts', m: '⛏️ *Your arms are numb. You must wait a minute before swinging your pickaxe again.*', e: 60},
  {p: 'src/commands/chop.ts', m: '⛏️ *Your arms are numb. You must wait a minute before swinging your axe again.*', e: 60},
  {p: 'src/commands/harvest.ts', m: '⛏️ *Your arms are numb. You must wait a minute before gathering again.*', e: 60},
  {p: 'src/commands/fish.ts', m: '🎣 *The fish are spooked. You must wait a minute before casting your line again.*', e: 60}
];

for(const f of files) {
  let content = fs.readFileSync(f.p, 'utf8');

  // Regex that captures everything from `try {` until the end of the `catch` block that replies with Network Instability
  const rx = /try \{\s+const isCooldown = await redisClient\.get\(cdKey\);\s+if \(isCooldown\) \{\s+return message\.reply\('.+?'\);\s+\}\s+await redisClient\.setEx\(cdKey, 60, '1'\); \/\/ 60 second cooldown\s+\} catch \(e\) \{\s+console\.error\('Redis .+? Error', e\);\s+return message\.reply\('⚠️ \*\*Network Instability:\*\* The realm connection flickered\. Please try again\.'\);\s+\}/;

  content = content.replace(rx, `if (await enforceCooldown(cdKey, ${f.e})) {\n      return message.reply('${f.m}');\n  }`);
  
  if (!content.includes("import { enforceCooldown } from '../utils/cooldown.js';")) {
       content = content.replace("import redisClient from '../redis.js';", "import redisClient from '../redis.js';\nimport { enforceCooldown } from '../utils/cooldown.js';");
  }

  fs.writeFileSync(f.p, content);
}

// Check rest.ts
let rest = fs.readFileSync('src/commands/rest.ts', 'utf8');
const rxRest = /try \{\s+const isCooldown = await redisClient\.get\(cdKey\);\s+if \(isCooldown\) \{\s+return message\.reply\('🔥 \*\*The embers are still hot!\*\* You must wait 15 minutes before resting again\.'\);\s+\}\s+await redisClient\.setEx\(cdKey, 900, '1'\);\s+\} catch \(e\) \{\s+console\.error\('Redis error', e\);\s+return message\.reply\('⚠️ \*\*Network Instability:\*\* The realm connection flickered\. Please try again\.'\);\s+\}/;

rest = rest.replace(rxRest, `if (await enforceCooldown(cdKey, 900)) {\n    return message.reply('🔥 **The embers are still hot!** You must wait 15 minutes before resting again.');\n  }`);

if (!rest.includes("import { enforceCooldown } from '../utils/cooldown.js';")) {
    rest = rest.replace("import redisClient from '../redis.js';", "import redisClient from '../redis.js';\nimport { enforceCooldown } from '../utils/cooldown.js';");
}

fs.writeFileSync('src/commands/rest.ts', rest);

console.log("Replaced try/catches.");
