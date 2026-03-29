import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function testRegex() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    const regex = /'([^']+)':\s*{\s*([^}]*?name:\s*'([^']+)'[\s\S]*?)outputs:\s*(\{[\s\S]*?\})\s*}(,?)/g;
    
    let match;
    while ((match = regex.exec(content)) !== null) {
        if (match[1] === 'tin_halberd') {
            console.log("MATCH FOUND:", match[0]);
            console.log("preOutputs:", match[2]);
            return;
        }
    }
}
testRegex();
