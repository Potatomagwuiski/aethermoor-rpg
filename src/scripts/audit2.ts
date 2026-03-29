// Better Audit script
import fs from 'fs';
import path from 'path';

const COMMANDS_DIR = path.join(process.cwd(), 'src', 'commands');

function extractStringLiterals(filePath: string): string[] {
    const content = fs.readFileSync(filePath, 'utf8');
    const strings = new Set<string>();
    
    // Catch 'copper', "copper"
    const regex = /['"]([a-z0-9_]+)['"]/g;
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match[1] && match[1].length > 2) {
            strings.add(match[1]);
        }
    }
    return Array.from(strings);
}

function runAudit() {
    const forgeContent = fs.readFileSync(path.join(COMMANDS_DIR, 'forge.ts'), 'utf8');
    const forgeMatsRegex = /materials:\s*\{([^}]+)\}/g;
    const requiredMaterials = new Set<string>();
    
    let fm;
    while ((fm = forgeMatsRegex.exec(forgeContent)) !== null) {
        const matString = fm[1];
        const singleMatRegex = /([a-zA-Z0-9_]+):\s*\d+/g;
        let mMatch;
        while ((mMatch = singleMatRegex.exec(matString)) !== null) {
            requiredMaterials.add(mMatch[1]);
        }
    }

    const cookContent = fs.readFileSync(path.join(COMMANDS_DIR, 'cook.ts'), 'utf8');
    let cm;
    while ((cm = forgeMatsRegex.exec(cookContent)) !== null) {
        const matString = cm[1];
        const singleMatRegex = /([a-zA-Z0-9_]+):\s*\d+/g;
        let mMatch;
        while ((mMatch = singleMatRegex.exec(matString)) !== null) {
            requiredMaterials.add(mMatch[1]);
        }
    }

    const sources = ['mine.ts', 'chop.ts', 'fish.ts', 'harvest.ts', 'hunt.ts', 'open.ts', 'dungeon.ts'];
    const drops = new Set<string>();

    for (const file of sources) {
        const p = path.join(COMMANDS_DIR, file);
        if (fs.existsSync(p)) {
            const literals = extractStringLiterals(p);
            for (const l of literals) drops.add(l);
        }
    }

    console.log("=== Economy Matrix ===");
    console.log(`Total Required Materials: ${requiredMaterials.size}`);
    
    const orphans = [];
    const missing = [];
    
    // We only care if missing from literals:
    for (const req of requiredMaterials) {
        if (!drops.has(req)) missing.push(req);
    }

    // To find orphans, we manually review suspicious strings ending in _ore, wood, etc.
    const allDrops = Array.from(drops);
    const knownMats = Array.from(requiredMaterials);
    
    console.log(`\nAbsolutely Missing from codebase:`, missing);
    console.log(`\nRequired Materials:`, knownMats.join(', '));
    
    // Find strings in mine.ts that look like mat names but aren't in required
    const mineDrops = extractStringLiterals(path.join(COMMANDS_DIR, 'mine.ts'));
    console.log(`\nPotential Mine orphans:`, mineDrops.filter(d => !requiredMaterials.has(d) && (d.includes('ore') || d.includes('ingot') || d === 'coal' || d === 'silver' || d === 'obsidian')));
    
    const chopDrops = extractStringLiterals(path.join(COMMANDS_DIR, 'chop.ts'));
    console.log(`Potential Chop orphans:`, chopDrops.filter(d => !requiredMaterials.has(d) && (d.includes('wood') || d === 'sap' || d.includes('leaf'))));

    const fishDrops = extractStringLiterals(path.join(COMMANDS_DIR, 'fish.ts'));
    console.log(`Potential Fish orphans:`, fishDrops.filter(d => !requiredMaterials.has(d) && (d.includes('fish') || d.includes('bass') || d.includes('trout') || d === 'seaweed' || d.includes('crab') || d.includes('clam'))));
}
runAudit();
