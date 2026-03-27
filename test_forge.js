const fs = require('fs');
const content = fs.readFileSync('src/commands/forge.ts', 'utf-8');
const match = content.match(/const BLUEPRINTS[^;]+;/);
if (match) {
    console.log("Blueprints matched");
} else {
    console.log("no match");
}
