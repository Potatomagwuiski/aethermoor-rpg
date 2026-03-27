const fs = require('fs');

function apply(f, cd, msg) {
  let c = fs.readFileSync(f, 'utf8');
  let m = false;
  if(!c.includes("import { enforceCooldown }")) {
      c = c.replace("import redisClient from '../redis.js';", "import redisClient from '../redis.js';\nimport { enforceCooldown } from '../utils/cooldown.js';");
  }
  // Remove any remaining try catch block
  const rx = /try \{\s+const isCooldown = await redisClient\.get\(cdKey\);\s+if \(isCooldown\) \{\s+return message\.reply\(.+?\);\s+\}\s+await redisClient\.setEx\(cdKey, \d+, '1'\);\s+\} catch \(e\) \{\s+console\.error\('.+?', e\);\s+return message\.reply\('⚠️ \*\*Network Instability[\s\S]*?'\);\s+\}/;
  if(rx.test(c)) {
     c = c.replace(rx, `if (await enforceCooldown(cdKey, ${cd})) {\n      return message.reply('${msg}');\n  }`);
     m = true;
  }
  // Replace the already replaced block if it has 120 to 60
  if (c.includes(`enforceCooldown(cdKey, 120)`)) {
     c = c.replace(`enforceCooldown(cdKey, 120)`, `enforceCooldown(cdKey, ${cd})`);
     m = true;
  }
  if (m) fs.writeFileSync(f, c);
}

apply('src/commands/mine.ts', 60, '⛏️ *Your arms are numb. You must wait a minute before swinging your pickaxe again.*');
apply('src/commands/chop.ts', 60, '⛏️ *Your arms are numb. You must wait a minute before swinging your axe again.*');
apply('src/commands/harvest.ts', 60, '⛏️ *Your arms are numb. You must wait a minute before gathering again.*');
apply('src/commands/fish.ts', 60, '🎣 *The fish are spooked. You must wait a minute before casting your line again.*');

console.log("Done");
