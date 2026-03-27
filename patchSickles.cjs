const fs = require('fs');

let forgeContent = fs.readFileSync('src/commands/forge.ts', 'utf8');

// 1. Inject the Blueprints under --- TOOLS ---
const sicklesCode = `
  'bronze_sickle': {
    name: 'Bronze Sickle', materials: { copper: 30, wood: 20, slime_gel: 10 },
    abilities: [
      '🌾 **Reap**: 5% chance for double herbs',
      '🌱 **Harvester**: +1 Base Yield',
      '💎 **Tireless Swing**: Harvesting never costs Exhaustion',
      '🌿 **Earth Sense**: 10% chance to find hidden seeds',
      '🌟 **Mother Lode**: 1% chance to yield 50x materials'
    ],
    outputs: { common: { key: 'common_bronze_sickle', name: '⬜ [Common Bronze Sickle]', yield: 1.25 }, uncommon: { key: 'uncommon_bronze_sickle', name: '🟩 [Uncommon Bronze Sickle]', yield: 1.5 }, rare: { key: 'rare_bronze_sickle', name: '🟦 [Rare Bronze Sickle]', yield: 2.0 }, epic: { key: 'epic_bronze_sickle', name: '🟪 [Epic Bronze Sickle]', yield: 3.0 } }
  },
  'iron_sickle': {
    name: 'Iron Sickle', requiredBlueprint: 'blueprint_iron_sickle', materials: { iron: 50, ashwood: 40, bat_wing: 15 },
    abilities: [
      '🌾 **Efficient Reap**: 10% chance for double herbs',
      '🌱 **Expert Harvester**: +2 Base Yield',
      '💎 **Tireless Swing**: Harvesting never costs Exhaustion',
      '🌿 **Nature\\'s Gift**: 15% chance to find hidden seeds',
      '🌟 **Golden Harvest**: 2% chance to yield 50x materials'
    ],
    outputs: { common: { key: 'common_iron_sickle', name: '⬜ [Common Iron Sickle]', yield: 2.0 }, uncommon: { key: 'uncommon_iron_sickle', name: '🟩 [Uncommon Iron Sickle]', yield: 2.5 }, rare: { key: 'rare_iron_sickle', name: '🟦 [Rare Iron Sickle]', yield: 3.5 }, epic: { key: 'epic_iron_sickle', name: '🟪 [Epic Iron Sickle]', yield: 5.0 } }
  },
  'mythril_sickle': {
    name: 'Mythril Sickle', requiredBlueprint: 'blueprint_mythril_sickle', materials: { mythril: 80, elderwood: 70, demon_horn: 25 },
    abilities: [
      '🌾 **Master Reap**: 20% chance for double herbs',
      '🌱 **Grand Harvester**: +3 Base Yield',
      '💎 **Tireless Swing**: Harvesting never costs Exhaustion',
      '🌿 **Fae Sense**: 25% chance to find hidden seeds',
      '🌟 **Bountiful Blessing**: 5% chance to yield 50x materials'
    ],
    outputs: { common: { key: 'common_mythril_sickle', name: '⬜ [Common Mythril Sickle]', yield: 3.5 }, uncommon: { key: 'uncommon_mythril_sickle', name: '🟩 [Uncommon Mythril Sickle]', yield: 4.5 }, rare: { key: 'rare_mythril_sickle', name: '🟦 [Rare Mythril Sickle]', yield: 6.0 }, epic: { key: 'epic_mythril_sickle', name: '🟪 [Epic Mythril Sickle]', yield: 8.0 } }
  },
`;
forgeContent = forgeContent.replace('// --- TOOLS ---', '// --- TOOLS ---\n' + sicklesCode);

// 2. Fix forge logic for sickles
forgeContent = forgeContent.replace(
  "else if (keyStr.includes('axe') || keyStr.includes('chainsaw')) eClass = 'AXE';",
  "else if (keyStr.includes('axe') || keyStr.includes('chainsaw')) eClass = 'AXE';\n      else if (keyStr.includes('sickle') || keyStr.includes('hoe')) eClass = 'HOE';"
);

forgeContent = forgeContent.replace(
  "else if (eClass === 'PICKAXE' || eClass === 'AXE') {",
  "else if (eClass === 'PICKAXE' || eClass === 'AXE' || eClass === 'HOE') {"
);

forgeContent = forgeContent.replace(
  "if (catUrl === 'tools' && (key.includes('pickaxe') || key.includes('axe'))) validCategory = true;",
  "if (catUrl === 'tools' && (key.includes('pickaxe') || key.includes('axe') || key.includes('sickle'))) validCategory = true;"
);
fs.writeFileSync('src/commands/forge.ts', forgeContent);

// 3. Edit hunt.ts to drop the blueprints
let huntContent = fs.readFileSync('src/commands/hunt.ts', 'utf8');
huntContent = huntContent.replace(
  "{ key: 'blueprint_iron_axe', name: 'Iron Axe' },",
  "{ key: 'blueprint_iron_axe', name: 'Iron Axe' },\n    { key: 'blueprint_iron_sickle', name: 'Iron Sickle' },"
);
huntContent = huntContent.replace(
  "{ key: 'blueprint_mythril_axe', name: 'Mythril Axe' },",
  "{ key: 'blueprint_mythril_axe', name: 'Mythril Axe' },\n    { key: 'blueprint_mythril_sickle', name: 'Mythril Sickle' },"
);
fs.writeFileSync('src/commands/hunt.ts', huntContent);
