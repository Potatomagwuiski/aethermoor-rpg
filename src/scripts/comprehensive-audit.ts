import fs from 'fs';
import path from 'path';

// Load all systems via regex parsing to avoid missing anything due to exports structure
const basePath = path.join(process.cwd(), 'src/commands');

const huntSrc = fs.readFileSync(path.join(basePath, 'hunt.ts'), 'utf8');
const mineSrc = fs.readFileSync(path.join(basePath, 'mine.ts'), 'utf8');
const chopSrc = fs.readFileSync(path.join(basePath, 'chop.ts'), 'utf8');
const fishSrc = fs.readFileSync(path.join(basePath, 'fish.ts'), 'utf8');
const forgeSrc = fs.readFileSync(path.join(basePath, 'forge.ts'), 'utf8');
const cookSrc = fs.readFileSync(path.join(basePath, 'cook.ts'), 'utf8');

// 1. EXTRACT ALL DROPPED ITEMS
const allDrops = new Set<string>();

const allStrings = new Set<string>();
[mineSrc, chopSrc, fishSrc, huntSrc].forEach(src => {
    const rawMatches = [...src.matchAll(/'([a-zA-Z0-9_]+)'/g)];
    rawMatches.forEach(m => allStrings.add(m[1]));
});

// We know if a string is a material, it will be in the allStrings set.
// We just assign drop validation to any string found in the skilling files.
allStrings.forEach(s => allDrops.add(s));


// Hunt parsing (Monster drops)
const huntDrops = new Set<string>();
const huntMatches = [...huntSrc.matchAll(/drops:\s*\[([^\]]+)\]/g)];
huntMatches.forEach(match => {
    const rawArr = match[1];
    const items = [...rawArr.matchAll(/'([^']+)'/g)];
    items.forEach(i => { allDrops.add(i[1]); huntDrops.add(i[1]); });
});


// 2. EXTRACT ALL REQUIRED MATERIALS
const requiredMaterials = new Map<string, string[]>(); // item -> [used_in_recipe_1, used_in_recipe_2]

function addRequirement(mat: string, source: string) {
    if (!requiredMaterials.has(mat)) requiredMaterials.set(mat, []);
    requiredMaterials.get(mat)!.push(source);
}

// Parse Forge Materials
// Pattern: materials: { copper_ore: 5, stick: 2 } or materials:\n { 'copper_ore': 5 } 
const forgeBlockMatches = [...forgeSrc.matchAll(/'?([^']+)':\s*{\s*(?:name:\s*[^,]+,\s*)?(?:rarity:\s*[^,]+,\s*)?(?:equipmentClass:\s*[^,]+,\s*)?materials:\s*{([^}]+)}/g)];
forgeBlockMatches.forEach(match => {
    const blueprintName = match[1];
    const matsStr = match[2];
    const internalMats = [...matsStr.matchAll(/([a-zA-Z0-9_]+)\s*:/g)];
    internalMats.forEach(m => addRequirement(m[1], `Forge (${blueprintName})`));
});

// Parse Cook Materials
const cookBlockMatches = [...cookSrc.matchAll(/'([^']+)':\s*{\s*name:\s*[^,]+,\s*materials:\s*{([^}]+)}/g)];
cookBlockMatches.forEach(match => {
    const recipeName = match[1];
    const matsStr = match[2];
    const internalMats = [...matsStr.matchAll(/([a-zA-Z0-9_]+)\s*:/g)];
    internalMats.forEach(m => addRequirement(m[1], `Cook (${recipeName})`));
});

// 3. ANALYSIS & REPORTING
console.log(`=== AETHERMOOR INTEGRITY AUDIT ===\n`);

const strictlyDropped = Array.from(allDrops);
const strictlyRequired = Array.from(requiredMaterials.keys());

const missingSources = strictlyRequired.filter(req => !strictlyDropped.includes(req));
const unusedDrops = strictlyDropped.filter(drop => !strictlyRequired.includes(drop) && !drop.includes('dungeon_key')); // Keys are used in dungeons

console.log(`[ORPHANED REQUIREMENTS] - Items needed for Crafting/Cooking but NEVER dropped anywhere:`);
if (missingSources.length === 0) {
    console.log("✅ PERFECT! Every material required can be found in the world.");
} else {
    missingSources.forEach(m => {
        console.log(`❌ ${m} -> Required by: ${requiredMaterials.get(m)?.join(', ')}`);
    });
}

console.log(`\n[DEAD-END DROPS] - Items dropped by Activities/Monsters but have NO crafting or cooking use:`);
if (unusedDrops.length === 0) {
     console.log("✅ PERFECT! Every drop has a mechanical economic use.");
} else {
    unusedDrops.forEach(m => {
        let origin = 'Unknown Activity';
        if (huntDrops.has(m)) origin = 'Monster Drop';
        else if (mineSrc.includes(`key: '${m}'`)) origin = 'Mining';
        else if (chopSrc.includes(`key: '${m}'`)) origin = 'Woodcutting';
        else if (fishSrc.includes(`key: '${m}'`)) origin = 'Fishing';
        
        console.log(`⚠️ ${m} (${origin}) -> Serves no mechanical purpose yet. (Vendor trash?)`);
    });
}

console.log(`\n=== AUDIT COMPLETE ===\n`);
