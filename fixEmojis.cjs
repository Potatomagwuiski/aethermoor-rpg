const fs = require('fs');

let emojisContent = fs.readFileSync('src/utils/emojis.ts', 'utf8');
const oldEmojisStr = `
    'slime_gel': '💧',
    'goblin_ear': '👺',
    'bat_wing': '🦇',
    'wolf_pelt': '🐺',
    'living_bark': '🌿',
    'brittle_bone': '💀',
    'golem_rubble': '🪨',
    'demon_horn': '👿',
    'shadow_dust': '🌑',
    'drake_scale': '🐉',
    'lich_phylactery': '🏺',
`;
emojisContent = emojisContent.replace(oldEmojisStr, '');
fs.writeFileSync('src/utils/emojis.ts', emojisContent);

let pricesContent = fs.readFileSync('src/utils/prices.ts', 'utf8');
const oldPricesStr = `
    'slime_gel': 10,
    'goblin_ear': 10,
    'bat_wing': 10,
    'wolf_pelt': 12,
    'living_bark': 12,
    'brittle_bone': 20,
    'golem_rubble': 20,
    'demon_horn': 35,
    'shadow_dust': 35,
    'drake_scale': 50,
    'lich_phylactery': 50,
`;
pricesContent = pricesContent.replace(oldPricesStr, '');
fs.writeFileSync('src/utils/prices.ts', pricesContent);
