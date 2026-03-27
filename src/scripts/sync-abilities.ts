import 'dotenv/config';
import { prisma } from '../db.js';
import { BLUEPRINTS } from '../commands/forge.js';

async function runPatch() {
  console.log('--- STARTING GLOBAL ABILITY SYNC ---');

  // 1. Sync Equipment
  const allEquip = await prisma.equipment.findMany();
  let equipUpdated = 0;

    // Equipment doesn't store activeAbilities natively, rely dynamically on hunt.ts array slicing!
    
  // 2. Sync Tools (Pickaxes, Axes)
  // Tool schema doesn't have `baseItemKey`, but it has `name` like "🟪 [Epic Bronze Pickaxe]".
  const allTools = await prisma.tool.findMany();
  let toolsUpdated = 0;

  for (const tool of allTools) {
    let matchedKey: string | null = null;
    const nameLower = tool.name?.toLowerCase() || '';
    
    for (const [bpKey, bpObj] of Object.entries(BLUEPRINTS)) {
      // bpKey looks like "bronze_pickaxe" and tool name looks like "[epic bronze pickaxe]"
      const bpIdentifier = bpKey.replace(/_/g, ' '); 
      if (nameLower.includes(bpIdentifier)) {
        matchedKey = bpKey;
        break;
      }
    }

    if (matchedKey && BLUEPRINTS[matchedKey].abilities) {
      let abilityCount = 1;
      const r = tool.rarity;
      if (r === 'LEGENDARY') abilityCount = 5;
      else if (r === 'EPIC') abilityCount = 4;
      else if (r === 'RARE') abilityCount = 3;
      else if (r === 'UNCOMMON') abilityCount = 2;
      
      const newAbilities = BLUEPRINTS[matchedKey].abilities.slice(0, abilityCount);
      
      await prisma.tool.update({
        where: { id: tool.id },
        data: { activeAbilities: newAbilities }
      });
      toolsUpdated++;
    }
  }

  console.log(`✅ SYNC COMPLETE!`);
  console.log(`- Patched ${equipUpdated} legacy Weapons & Armors with new abilities.`);
  console.log(`- Patched ${toolsUpdated} legacy Gathering Tools with new abilities.`);
  
  await prisma.$disconnect();
}

runPatch().catch(e => {
  console.error("Migration failed:", e);
  process.exit(1);
});
