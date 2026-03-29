import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function cleanForge() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    // capture the comma if present to not break JSON formatting!
    const regex = /'([^']+)':\s*{\s*([^}]*?name:\s*'([^']+)'[\s\S]*?)outputs:\s*(\{[\s\S]*?\})\s*}(,?)/g;
    
    let result = content;
    let match;
    
    while ((match = regex.exec(content)) !== null) {
        const fullBlock = match[0];
        const key = match[1];
        const preOutputs = match[2];
        const name = match[3];
        const outputsBlock = match[4];
        const comma = match[5] || '';
        
        let targetTier = 'common';
        let rarityVal = 'COMMON';
        
        if (name.includes('Bronze') || name.includes('Wood') || name.includes('Leather') || name.includes('Tin')) {
            targetTier = 'common'; rarityVal = 'COMMON';
        } else if (name.includes('Iron') || name.includes('Apprentice') || name.includes('Scout')) {
            targetTier = 'uncommon'; rarityVal = 'UNCOMMON';
            if (!outputsBlock.includes('uncommon:')) targetTier = 'rare';
        } else if (name.includes('Steel') || name.includes('Mystic') || name.includes('Bone')) {
            targetTier = 'rare'; rarityVal = 'RARE';
            if (!outputsBlock.includes('rare:')) targetTier = 'epic';
            if (!outputsBlock.includes(targetTier + ':')) targetTier = 'common';
        } else if (name.includes('Mythril') || name.includes('Shadow') || name.includes('Lich') || name.includes('Meteor') || name.includes('Soul Re') || name.includes('Wolf Sla')) {
            targetTier = 'epic'; rarityVal = 'EPIC';
            if (!outputsBlock.includes('epic:')) targetTier = 'rare';
        } else if (name.includes('Void') || name.includes('Demon')) {
            targetTier = 'epic'; rarityVal = 'LEGENDARY';
            if (outputsBlock.includes('legendary:')) targetTier = 'legendary';
        }
        
        const tierRegex = new RegExp(`${targetTier}:\\s*\\{([^{}]*)\\}`, 'i');
        let tierMatch = tierRegex.exec(outputsBlock);
        
        let stats = '';
        if (tierMatch) {
            stats = tierMatch[1];
        } else {
            const fallback = /[a-z]+:\s*\{([^{}]*)\}/.exec(outputsBlock);
             if (fallback) stats = fallback[1];
        }
        
        if (stats) {
            stats = stats.replace(/key:\s*'[^']+'/, `key: '${key}'`);
            stats = stats.replace(/name:\s*'[^']+'/, `name: '${name}'`);
            if (stats.includes('rarity:')) {
                stats = stats.replace(/rarity:\s*'[^']+'/, `rarity: '${rarityVal}'`);
            }
            
            const newOutput = `outputs: { base: {${stats}} }`;
            const newBlock = `'${key}': {\n${preOutputs}${newOutput}\n  }${comma}`;
            
            result = result.replace(fullBlock, newBlock);
        } else {
             console.log(`Failed to process: ${key}`);
        }
    }

    fs.writeFileSync(FORGE_PATH, result);
    console.log('Successfully wiped Gacha outputs from forge.ts SAFELY WITH COMMAS!');
}

cleanForge();
