import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function cleanForge() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    // We want to replace all outputs: { ... } inside BLUEPRINTS with:
    // outputs: { base: { key: 'blueprintKey', name: 'Name', isTool?, type?, rarity?, dps?, defense?, yieldMultiplier? ... } }
    
    // Actually, each item has unique stats.
    // e.g. outputs: { common: { key: 'common_wolf_slayer', name: '⬜ [Common Wolf Slayer]', dps: 50 }, ... }
    // We should extract the "uncommon" or "rare" block as the SINGLE base block!
    // Or we simply extract exactly mapping rules:
    // If it's a Bronze/Wood item: use 'common' stats, set rarity 'COMMON'.
    // If it's Iron/Apprentice: use 'uncommon' stats, set rarity 'UNCOMMON'.
    // If it's Steel/Mystic: use 'rare' stats, set rarity 'RARE'.
    // If it's Mythril/Shadow/Lich: use 'epic' stats, set rarity 'EPIC'.
    // If it's Void/Legendary: use 'legendary'/'epic' stats, set rarity 'LEGENDARY'.

    const regex = /'([^']+)':\s*{\s*([^}]*?name:\s*'([^']+)'[\s\S]*?)outputs:\s*(\{[\s\S]*?\})\s*}/g;
    
    let result = content;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const fullBlock = match[0];
        const key = match[1];
        const preOutputs = match[2];
        const name = match[3];
        const outputsBlock = match[4];
        
        let targetTier = 'common';
        let rarityVal = 'COMMON';
        
        if (name.includes('Bronze') || name.includes('Wood') || name.includes('Leather')) {
            targetTier = 'common'; rarityVal = 'COMMON';
        } else if (name.includes('Iron') || name.includes('Apprentice')) {
            targetTier = 'uncommon'; rarityVal = 'UNCOMMON';
            // Wait, iron might only have uncommon, rare
            if (!outputsBlock.includes('uncommon:')) targetTier = 'rare';
        } else if (name.includes('Steel') || name.includes('Mystic')) {
            targetTier = 'rare'; rarityVal = 'RARE';
        } else if (name.includes('Mythril') || name.includes('Shadow') || name.includes('Lich') || name.includes('Meteor') || name.includes('Soul Re')) {
            targetTier = 'epic'; rarityVal = 'EPIC';
        } else if (name.includes('Void') || name.includes('Demon')) {
            targetTier = 'epic'; rarityVal = 'LEGENDARY'; // Will grab epic stats
            if (outputsBlock.includes('legendary:')) targetTier = 'legendary';
        }
        
        // Find the specific json block for the targetTier
        const tierRegex = new RegExp(`${targetTier}:\\s*\\{([^}]*)\\}`, 'i');
        let tierMatch = tierRegex.exec(outputsBlock);
        
        if (!tierMatch) {
             // Fallback to first available
             const fallback = /([a-z]+):\s*\{([^}]*)\}/.exec(outputsBlock);
             if (fallback) tierMatch = fallback;
        }
        
        if (tierMatch) {
            let stats = tierMatch[1];
            // Replace key: 'epic_void_blade' -> key: 'void_blade'
            stats = stats.replace(/key:\s*'[^']+'/, `key: '${key}'`);
            // Replace name: '🟪 [Epic Void Blade]' -> name: 'Void Blade'
            stats = stats.replace(/name:\s*'[^']+'/, `name: '${name}'`);
            // Replace rarity if present
            if (stats.includes('rarity:')) {
                stats = stats.replace(/rarity:\s*'[^']+'/, `rarity: '${rarityVal}'`);
            }
            
            const newOutput = `outputs: { base: {${stats}} }`;
            const newBlock = `'${key}': {\n${preOutputs}${newOutput}\n  }`;
            
            result = result.replace(fullBlock, newBlock);
        }
    }

    fs.writeFileSync(FORGE_PATH, result);
    console.log('Successfully wiped Gacha outputs from forge.ts!');
}

cleanForge();
