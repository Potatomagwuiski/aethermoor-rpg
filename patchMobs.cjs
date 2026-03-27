const fs = require('fs');

// --- 1. UPDATE EMOJIS & PRICES ---
let emojisContent = fs.readFileSync('src/utils/emojis.ts', 'utf8');
const newEmojis = `
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
emojisContent = emojisContent.replace(/'beast_core': '🐾',/, `'beast_core': '🐾',${newEmojis}`);
fs.writeFileSync('src/utils/emojis.ts', emojisContent);

let pricesContent = fs.readFileSync('src/utils/prices.ts', 'utf8');
const newPrices = `
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
pricesContent = pricesContent.replace(/'beast_core': 10,/, `'beast_core': 10,${newPrices}`);
fs.writeFileSync('src/utils/prices.ts', pricesContent);

// --- 2. UPDATE HUNT.TS (Mob Drops) ---
let huntContent = fs.readFileSync('src/commands/hunt.ts', 'utf8');

const mobSwaps = [
    ["name: 'Acid Slime', emoji: '💧', loot: [{ key: 'beast_core', name: 'Beast Core', chance: 0.5 }]", "name: 'Acid Slime', emoji: '💧', loot: [{ key: 'slime_gel', name: 'Slime Gel', chance: 0.5 }]"],
    ["name: 'Goblin Scout', emoji: '👺', loot: [{ key: 'beast_core', name: 'Beast Core', chance: 0.4 }]", "name: 'Goblin Scout', emoji: '👺', loot: [{ key: 'goblin_ear', name: 'Goblin Ear', chance: 0.4 }]"],
    ["name: 'Cave Bat', emoji: '🦇', loot: [{ key: 'beast_core', name: 'Beast Core', chance: 0.4 }]", "name: 'Cave Bat', emoji: '🦇', loot: [{ key: 'bat_wing', name: 'Bat Wing', chance: 0.4 }]"],
    ["name: 'Dire Wolf', emoji: '🐺', loot: [{ key: 'beast_core', name: 'Beast Core', chance: 0.4 }]", "name: 'Dire Wolf', emoji: '🐺', loot: [{ key: 'wolf_pelt', name: 'Wolf Pelt', chance: 0.4 }]"],
    ["name: 'Forest Treant', emoji: '🌳', loot: [{ key: 'beast_core', name: 'Beast Core', chance: 0.3 }]", "name: 'Forest Treant', emoji: '🌳', loot: [{ key: 'living_bark', name: 'Living Bark', chance: 0.3 }]"],
    
    ["name: 'Skeleton Warrior', emoji: '💀', loot: [{ key: 'monster_core', name: 'Monster Core', chance: 0.5 }]", "name: 'Skeleton Warrior', emoji: '💀', loot: [{ key: 'brittle_bone', name: 'Brittle Bone', chance: 0.5 }]"],
    ["name: 'Rock Golem', emoji: '🪨', loot: [{ key: 'monster_core', name: 'Monster Core', chance: 0.3 }]", "name: 'Rock Golem', emoji: '🪨', loot: [{ key: 'golem_rubble', name: 'Golem Rubble', chance: 0.3 }]"],
    
    ["name: 'Lesser Demon', emoji: '👿', loot: [{ key: 'abyssal_core', name: 'Abyssal Core', chance: 0.4 }]", "name: 'Lesser Demon', emoji: '👿', loot: [{ key: 'demon_horn', name: 'Demon Horn', chance: 0.4 }]"],
    ["name: 'Shadow Stalker', emoji: '🌑', loot: [{ key: 'abyssal_core', name: 'Abyssal Core', chance: 0.3 }]", "name: 'Shadow Stalker', emoji: '🌑', loot: [{ key: 'shadow_dust', name: 'Shadow Dust', chance: 0.3 }]"],
    
    ["name: 'Mythic Drake', emoji: '🐉', loot: [{ key: 'void_core', name: 'Void Core', chance: 0.5 }]", "name: 'Mythic Drake', emoji: '🐉', loot: [{ key: 'drake_scale', name: 'Drake Scale', chance: 0.5 }]"],
    ["name: 'Abyssal Lich', emoji: '🧙‍♂️', loot: [{ key: 'void_core', name: 'Void Core', chance: 0.4 }]", "name: 'Abyssal Lich', emoji: '🧙‍♂️', loot: [{ key: 'lich_phylactery', name: 'Lich Phylactery', chance: 0.4 }]"]
];

for (const swap of mobSwaps) {
    huntContent = huntContent.replace(swap[0], swap[1]);
}
fs.writeFileSync('src/commands/hunt.ts', huntContent);

// --- 3. UPDATE FORGE.TS ---
let forgeContent = fs.readFileSync('src/commands/forge.ts', 'utf8');

function updateRecipe(name, targetMats) {
    const rx = new RegExp(`name: '${name}',([\\s\\S]*?materials:\\s*)\\{[^}]+\\}`, 'g');
    forgeContent = forgeContent.replace(rx, `name: '${name}',$1{ ${targetMats} }`);
}

// Map T1 Recipes to the new thematic drops!
updateRecipe('Bronze Sword', 'copper: 30, wood: 8, wolf_pelt: 2');
updateRecipe('Bronze Dagger', 'copper: 20, wood: 5, bat_wing: 5');
updateRecipe('Wood Staff', 'copper: 10, wood: 35, slime_gel: 4');
updateRecipe('Bronze Scythe', 'copper: 25, wood: 20, goblin_ear: 3');

// Map T2 Weapons
updateRecipe('Iron Greatsword', 'iron: 45, ashwood: 12, golem_rubble: 5');
updateRecipe('Wolf Slayer Sword', 'iron: 50, ashwood: 15, wolf_pelt: 15'); // Cool thematic tie-in
updateRecipe('Venom Shiv', 'iron: 30, ashwood: 8, brittle_bone: 8');

// Map T3/T4 Weapons
updateRecipe('Mythril Cleaver', 'mythril: 80, gold_ore: 20, demon_horn: 3');
updateRecipe('Shadow Blade', 'mythril: 65, gold_ore: 25, shadow_dust: 5');
updateRecipe('Moonlight Staff', 'mythril: 30, elderwood: 90, shadow_dust: 4');
updateRecipe('Meteor Staff', 'mythril: 50, elderwood: 60, demon_horn: 5');
updateRecipe('Soul Reaper', 'mythril: 40, elderwood: 50, brittle_bone: 20'); // Re-using bone for necro stack
updateRecipe('Lich Tome', 'mythril: 50, elderwood: 30, shadow_dust: 10');

// Map T5 Weapons
updateRecipe('Void Blade', 'voidstone: 90, rare_meteorite_ingot: 30, drake_scale: 4');

fs.writeFileSync('src/commands/forge.ts', forgeContent);
console.log('Successfully injected 13 new specific monster drops into Hunt, Prices, Emojis, and Forge!');
