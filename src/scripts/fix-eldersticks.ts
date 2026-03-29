import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function fix() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    content = content.replace(/eldersticks:/g, "elderwood:");
    
    // Add ebony_wood to shadow tunic:
    content = content.replace(/materials: \{ mythril: 50, ashwood: 20,/g, "materials: { mythril: 50, ebony_wood: 20,");
    
    fs.writeFileSync(FORGE_PATH, content);
    console.log("Fixed!");
}

fix();
