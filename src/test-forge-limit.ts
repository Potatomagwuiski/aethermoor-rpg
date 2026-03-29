import { BLUEPRINTS } from './commands/forge.js';

let craftableCatalog = '';
let missingCatalog = '';

for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
  if (!blueprint.materials) continue; 
  
  if (!(key.includes('sword') || key.includes('dagger') || key.includes('staff') || key.includes('scythe') || key.includes('shiv') || key.includes('blade') || key.includes('cleaver') || key.includes('slayer') || key.includes('bow'))) continue;

  let baseOutput: any = null;
  if (blueprint.outputs.common) baseOutput = blueprint.outputs.common;
  else if (blueprint.outputs.uncommon) baseOutput = blueprint.outputs.uncommon;
  else if (blueprint.outputs.rare) baseOutput = blueprint.outputs.rare;
  else if (blueprint.outputs.epic) baseOutput = blueprint.outputs.epic;
  else if (blueprint.outputs.legendary) baseOutput = blueprint.outputs.legendary;
  else baseOutput = Object.values(blueprint.outputs)[0];

  let displaySlice = 1;
  if (baseOutput.key.includes('uncommon')) displaySlice = 2;
  if (baseOutput.key.includes('rare')) displaySlice = 3;
  if (baseOutput.key.includes('epic')) displaySlice = 4;
  if (baseOutput.key.includes('legendary')) displaySlice = 5;

  let abilityString = '';
  if (blueprint.abilities && blueprint.abilities.length > 0) {
      abilityString = `\n✨ **Innate Abilities:**\n`;
      for (let i = 0; i < displaySlice; i++) {
         if (blueprint.abilities[i]) {
            abilityString += `✧ \`${blueprint.abilities[i]}\`\n`;
         }
      }
  }
  
  const matString = Object.entries(blueprint.materials).map(([k, qty]) => `${qty}x ${k}`).join(', ');
  const statString = 'BASE STATS: 10';
  const reqHeader = 'REQ HEADER';

  const outputStr = `**${blueprint.name}** (\`${key}\`)\n${statString}${abilityString}\n${reqHeader} \n🧱 **Materials:** ${matString}\n\n`;
  craftableCatalog += outputStr;
}

const addCatalogToEmbed = (catalog: string, title: string) => {
    if (catalog.length === 0) return;
    const recipes = catalog.split('\n\n');
    let currentField = '';
    let firstField = true;
    for (let recipe of recipes) {
        if (!recipe.trim()) continue;
        if (currentField.length + recipe.length > 1000) {
            console.log(`Add Field [${firstField ? title : 'CONT'}]: ${currentField.length} length`);
            currentField = recipe + '\n\n';
            firstField = false;
        } else {
            currentField += recipe + '\n\n';
        }
    }
    if (currentField.trim()) {
        console.log(`Add Field [${firstField ? title : 'CONT'}]: ${currentField.length} length`);
    }
};

addCatalogToEmbed(craftableCatalog, 'Weapons Catalog');
