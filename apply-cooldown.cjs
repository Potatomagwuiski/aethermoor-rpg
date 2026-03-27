const fs = require('fs');
const files = [
  { p: 'src/commands/hunt.ts', cd: 120, rep: "⏳ **Exhausted!** You are still recovering from your last hunt. Wait a few seconds!" },
  { p: 'src/commands/mine.ts', cd: 60, rep: "⛏️ *Your arms are numb. You must wait a minute before swinging your pickaxe again.*" },
  { p: 'src/commands/chop.ts', cd: 60, rep: "⛏️ *Your arms are numb. You must wait a minute before swinging your axe again.*" },
  { p: 'src/commands/harvest.ts', cd: 60, rep: "⛏️ *Your arms are numb. You must wait a minute before gathering again.*" },
  { p: 'src/commands/fish.ts', cd: 60, rep: "🎣 *The fish are spooked. You must wait a minute before casting your line again.*" }
];

for (const f of files) {
  let content = fs.readFileSync(f.p, 'utf8');
  
  if (!content.includes('../utils/cooldown.js')) {
    content = content.replace(
      "import redisClient from '../redis.js';",
      "import redisClient from '../redis.js';\nimport { enforceCooldown } from '../utils/cooldown.js';"
    );
  }

  // Use a targeted regex replacing the previous strict `try...catch` blocks
  const re = /try \{\s+const isCooldown = await redisClient\.get\(cdKey\);\s+if \(isCooldown\) \{\s+return message\.reply\([\s\S]+?\);\s+\}\s+await redisClient\.setEx\(cdKey, \d+, '1'\);\s+\} catch \(e\) \{\s+console\.error\([\s\S]+?\);\s+return message\.reply\('⚠️ \*\*Network Instability[\s\S]+?'\);\s+\}/g;
  
  content = content.replace(re, `if (await enforceCooldown(cdKey, ${f.cd})) {\n      return message.reply('${f.rep}');\n  }`);
  
  // Wait, what if the string matched hunt's old 'const cdKey = `cooldown:hunt:${discordId}`;'?
  // There is another old try/catch pattern in `verify` or other blocks? No, just these 5.

  fs.writeFileSync(f.p, content);
}
console.log('Cooldown fallback pattern applied!');
