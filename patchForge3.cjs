const fs = require('fs');

let c = fs.readFileSync('src/commands/forge.ts', 'utf8');

// Function to safely replace the materials bracket for a specific item exact name
function updateItem(nameStr, newMatsStr) {
    const regex = new RegExp(`name: '${nameStr}',([\\s\\S]*?materials:\\s*)\\{[^}]+\\}`, 'g');
    c = c.replace(regex, `name: '${nameStr}',$1{ ${newMatsStr} }`);
}

// === T1 TOOLS ===
updateItem('Bronze Pickaxe', 'copper: 25, wood: 50, basic_herb: 1');
updateItem('Bronze Axe', 'copper: 15, wood: 80, seaweed: 2');

// === T1 ARMORS ===
updateItem('Bronze Helmet', 'copper: 60, potato: 5');
updateItem('Bronze Chestplate', 'copper: 120, potato: 10, seaweed: 5');
updateItem('Bronze Boots', 'copper: 40, seaweed: 5');

updateItem('Apprentice Robe', 'copper: 10, wood: 30, basic_herb: 5');
updateItem('Leather Tunic', 'copper: 15, wood: 10, seaweed: 8');
updateItem('Scout Cloak', 'copper: 20, wood: 20, seaweed: 15');

// === T2 TOOLS & ARMOR ===
updateItem('Iron Pickaxe', 'iron: 40, ashwood: 60, basic_herb: 3');
updateItem('Iron Axe', 'iron: 20, ashwood: 100, moon_herb: 1');
updateItem('Iron Chestplate', 'iron: 150, river_trout: 20, moon_herb: 8');
updateItem('Mystic Robe', 'iron: 30, ashwood: 60, moon_herb: 10');

// === T3 / T4 TOOLS & ARMOR ===
updateItem('Steel Chestplate', 'steel_ore: 220, golden_koi: 40, stone_core: 15');
updateItem('Mythril Pickaxe', 'mythril: 80, elderwood: 120, hellfire_essence: 2');
updateItem('Mythril Axe', 'mythril: 50, elderwood: 180, cinderbloom: 5');
updateItem('Lich Mantle', 'mythril: 50, gold_ore: 20, hellfire_essence: 15');
updateItem('Shadow Tunic', 'mythril: 40, elderwood: 80, hellfire_essence: 5');

// Make sure Weapons match our V2 casual stats from the plan exactly:
// Warrior
updateItem('Bronze Sword', 'copper: 30, wood: 8, beast_core: 1');
updateItem('Iron Greatsword', 'iron: 45, ashwood: 12, mooncap_mushroom: 3');
updateItem('Wolf Slayer Sword', 'iron: 50, ashwood: 15, mooncap_mushroom: 5');
updateItem('Mythril Cleaver', 'mythril: 80, gold_ore: 20, hellfire_essence: 5');
updateItem('Void Blade', 'voidstone: 90, rare_meteorite_ingot: 30, lich_soul: 8');

// Rogue
updateItem('Bronze Dagger', 'copper: 20, wood: 5, seaweed: 2');
updateItem('Venom Shiv', 'iron: 30, ashwood: 8, moon_herb: 5');
updateItem('Shadow Blade', 'mythril: 65, gold_ore: 25, hellfire_essence: 3');

// Mage
updateItem('Wood Staff', 'copper: 10, wood: 35, basic_herb: 3');
updateItem('Moonlight Staff', 'mythril: 30, elderwood: 90, cinderbloom: 6');
updateItem('Meteor Staff', 'mythril: 50, elderwood: 60, hellfire_essence: 8');

// Necromancer
updateItem('Bronze Scythe', 'copper: 25, wood: 20, basic_herb: 1');
updateItem('Soul Reaper', 'mythril: 40, elderwood: 50, hellfire_essence: 5');
updateItem('Lich Tome', 'mythril: 50, elderwood: 30, hellfire_essence: 8');


fs.writeFileSync('src/commands/forge.ts', c);
console.log('Successfully de-duplicated and scattered all material values permanently!');
