import fs from 'fs';
import path from 'path';

const COMMANDS_DIR = path.join(process.cwd(), 'src', 'commands');

// Helper to extract regex matches from a file
function getMatches(filename: string, regex: RegExp): string[] {
  try {
    const content = fs.readFileSync(path.join(COMMANDS_DIR, filename), 'utf8');
    const matches = new Set<string>();
    let match;
    while ((match = regex.exec(content)) !== null) {
      matches.add(match[1]);
    }
    return Array.from(matches);
  } catch (e) {
    return [];
  }
}

function fullAudit() {
  const drops = new Set<string>();
  const recipes = new Set<string>();
  const requiredMaterials = new Set<string>();

  // 1. Gather all drops
  // mine.ts: "itemKey: 'copper'" or "key: 'iron'"
  const dropRegex = /key:\s*'([^']+)'|itemKey:\s*'([^']+)'/g;
  
  const filesWtihDrops = ['mine.ts', 'chop.ts', 'fish.ts', 'hunt.ts', 'dungeon.ts', 'open.ts', 'shop.ts'];
  for (const file of filesWtihDrops) {
      const content = fs.readFileSync(path.join(COMMANDS_DIR, file), 'utf8');
      let match;
      while ((match = dropRegex.exec(content)) !== null) {
          const item = match[1] || match[2];
          if (item && !item.startsWith('blueprint_') && !item.startsWith('recipe_') && !item.includes('lootbox') && item !== 'dungeon_key' && item !== 'enhancement_stone') {
              drops.add(item);
          }
      }
      
      // Also look for arrays of strings like ['copper', 'iron']
      const arrayDropRegex = /const\s+\w+\s*=\s*\[\s*((?:'[^']+',?\s*)+)\]/g;
      while ((match = arrayDropRegex.exec(content)) !== null) {
          const stringArray = match[1];
          const stringRegex = /'([^']+)'/g;
          let strMatch;
          while ((strMatch = stringRegex.exec(stringArray)) !== null) {
              const item = strMatch[1];
               if (item && !item.startsWith('blueprint_') && !item.startsWith('recipe_') && !item.includes('lootbox') && item !== 'dungeon_key' && item !== 'enhancement_stone') {
                  drops.add(item);
              }
          }
      }
  }

  // 2. Gather requirements from Forge
  const forgeContent = fs.readFileSync(path.join(COMMANDS_DIR, 'forge.ts'), 'utf8');
  const forgeMatsRegex = /materials:\s*\{([^}]+)\}/g;
  let fgMatch;
  while ((fgMatch = forgeMatsRegex.exec(forgeContent)) !== null) {
      const matString = fgMatch[1];
      const singleMatRegex = /([a-zA-Z0-9_]+):\s*\d+/g;
      let mMatch;
      while ((mMatch = singleMatRegex.exec(matString)) !== null) {
          requiredMaterials.add(mMatch[1]);
      }
  }

  // 3. Gather requirements from Cook
  const cookContent = fs.readFileSync(path.join(COMMANDS_DIR, 'cook.ts'), 'utf8');
  let ckMatch;
  while ((ckMatch = forgeMatsRegex.exec(cookContent)) !== null) {
      const matString = ckMatch[1];
      const singleMatRegex = /([a-zA-Z0-9_]+):\s*\d+/g;
      let mMatch;
      while ((mMatch = singleMatRegex.exec(matString)) !== null) {
          requiredMaterials.add(mMatch[1]);
      }
  }

  console.log("=== AETHERMOOR ECONOMY AUDIT ===");
  
  const unusedDrops = [];
  for (const drop of drops) {
      if (!requiredMaterials.has(drop)) {
          unusedDrops.push(drop);
      }
  }

  const unobtainableMats = [];
  for (const mat of requiredMaterials) {
      if (!drops.has(mat)) {
          unobtainableMats.push(mat);
      }
  }

  console.log(`\nFound ${unusedDrops.length} drops with NO USE (Orphans):`);
  console.log(unusedDrops.join(', '));

  console.log(`\nFound ${unobtainableMats.length} materials REQUIRED but NOT DROPPED (Softlocks):`);
  console.log(unobtainableMats.join(', '));
}

fullAudit();
