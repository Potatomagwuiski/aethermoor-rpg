import fs from 'fs';
import path from 'path';
import { BLUEPRINTS } from '../commands/forge.js';

function analyzeDrops() {
    const files = ['mine.ts', 'chop.ts', 'harvest.ts', 'fish.ts', 'hunt.ts', 'dungeon.ts'];
    let allDrops = new Set<string>();

    for (let f of files) {
        const p = path.join(process.cwd(), 'src', 'commands', f);
        if (!fs.existsSync(p)) continue;
        const text = fs.readFileSync(p, 'utf8');
        
        // Primary, secondary, epic drops
        const regex1 = /DropKey\s*=\s*'([^']+)'/g;
        let match;
        while ((match = regex1.exec(text)) !== null) {
            allDrops.add(match[1]);
        }
        
        // Loot arrays: { key: 'item_key', ... }
        const regex2 = /key:\s*'([a-z_]+)'/g;
        while ((match = regex2.exec(text)) !== null) {
            // make sure it isn't an overarching key, but usually drops are single words
            if (!match[1].includes(' ')) allDrops.add(match[1]);
        }
    }
    
    // Also add quest rewards? No, let's just stick to drops.
    
    // Now get forge required Mats
    const requiredMaterials = new Set<string>();
    for (const key in BLUEPRINTS) {
        const bp = BLUEPRINTS[key];
        if (bp.materials) {
            for (const mat in bp.materials) {
                requiredMaterials.add(mat);
            }
        }
    }
    
    console.log("=== ITEMS THAT DROP BUT ARE NEVER USED IN FORGING ===");
    for (const drop of allDrops) {
        if (!requiredMaterials.has(drop) && !drop.includes('recipe_')) {
            console.log(drop);
        }
    }

    console.log("\n=== ITEMS REQUIRED IN FORGING BUT NEVER DROP ===");
    for (const req of requiredMaterials) {
        if (!allDrops.has(req)) {
            console.log(req);
        }
    }
}

analyzeDrops();
