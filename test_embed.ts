import { BLUEPRINTS } from './src/commands/forge.ts';
import { getEmoji } from './src/utils/emojis.ts';

let craftableCatalog = '';
let missingCatalog = '';

for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
    if (blueprint.requiredBlueprint) continue;

    let matString = '';
    for (const [matKey, qty] of Object.entries(blueprint.materials)) {
        const emoji = getEmoji(matKey);
        matString += `\`${qty}x\` ${emoji} **${matKey}**, `;
    }
    matString = matString.slice(0, -2);
    
    let reqHeader = '🌟 **Innate Recipe:** Discovered at Birth';
    const outputStr = `**${blueprint.name}** (\`${key}\`)\n${reqHeader} \n🧱 **Materials:** ${matString}\n\n`;
    missingCatalog += outputStr;
}

console.log("Missing Catalog Size:", missingCatalog.length);
