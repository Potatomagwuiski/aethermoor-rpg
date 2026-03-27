const fs = require('fs');

const files = [
  'src/commands/mine.ts',
  'src/commands/chop.ts',
  'src/commands/harvest.ts',
  'src/commands/fish.ts',
  'src/commands/hunt.ts'
];

for (const f of files) {
  let content = fs.readFileSync(f, 'utf8');
  
  // Replace the old multiplier logic
  content = content.replace(
    /Math\.pow\(d1 \+ d2 \+ d3 \+ \w+, 2\);?/g,
    '20;'
  );
  content = content.replace(
    /d1 \+ d2 \+ d3 \+ \w+;?/g,
    '3;'
  );
  
  if (f.includes('hunt.ts')) {
    content = content.replace(
      /let baseGold = 5 \* tier;/g,
      'let baseGold = 25 * tier;'
    );
  }
  
  fs.writeFileSync(f, content);
}

console.log('Slot magnitudes crushed and Gold injected.');
