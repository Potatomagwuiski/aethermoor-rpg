const fs = require('fs');
const content = fs.readFileSync('src/commands/forge.ts', 'utf8');

const regex = /name:\s*'([^']+)',.*?materials:\s*(\{[^}]+\})/g;
let match;
while ((match = regex.exec(content)) !== null) {
  console.log(`${match[1]} | ${match[2]}`);
}
