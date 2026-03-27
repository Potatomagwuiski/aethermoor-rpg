const fs = require('fs');

let c = fs.readFileSync('src/commands/forge.ts', 'utf8');

// The file currently has EXACTLY the patch we pushed 10 minutes ago, so we just need to replace those strings.

// T1 Tools & Armor
c = c.replace(/cost: \{ copper: 20, potato: 5, seaweed: 5 \}, result: 'copper_armor'/g, "cost: { copper: 75, potato: 10, seaweed: 5 }, result: 'copper_armor'");
c = c.replace(/cost: \{ copper: 10, wood: 5, basic_herb: 1 \}, result: 'copper_pickaxe'/g, "cost: { copper: 12, wood: 25, basic_herb: 1 }, result: 'copper_pickaxe'");
c = c.replace(/cost: \{ copper: 10, wood: 5, basic_herb: 1 \}, result: 'copper_axe'/g, "cost: { copper: 8, wood: 40, seaweed: 2 }, result: 'copper_axe'");

// T1 Weapons
c = c.replace(/materials: \{ copper: 15, wood: 5, seaweed: 2 \}/g, "materials: { copper: 30, wood: 8, beast_core: 1 }"); // Applies to Bronze Sword, Dagger, Staff, Scythe. Wait, I should separate them?
// Actually, earlier I blindly regex replaced `copper: 10, wood: 10, beast_core: 5` with `copper: 15, wood: 5, seaweed: 2`. So right now ALL T1 weapons have that string.
// Let's replace the first match for Bronze Sword, second for Bronze Dagger, etc.
// Better: just replace the entire object line by line for precise control.

// I will use regex with name to safely target each weapon
function updateWeapon(nameStr, newMatsStr) {
    const regex = new RegExp(`name: '${nameStr}', [\\s\\S]*?materials: \\{[^}]+\\}`, 'g');
    c = c.replace(regex, (match) => {
        return match.replace(/materials: \{[^}]+\}/, `materials: ${newMatsStr}`);
    });
}

// T1 Weapons
updateWeapon('Bronze Sword', '{ copper: 30, wood: 8, beast_core: 1 }');
updateWeapon('Bronze Dagger', '{ copper: 20, wood: 5, seaweed: 2 }');
updateWeapon('Wood Staff', '{ copper: 10, wood: 35, basic_herb: 3 }');
updateWeapon('Bronze Scythe', '{ copper: 25, wood: 20, basic_herb: 1 }');

// T2 Tools & Armor
c = c.replace(/cost: \{ iron: 25, river_trout: 10, moon_herb: 5 \}, result: 'iron_armor'/g, "cost: { iron: 100, river_trout: 20, moon_herb: 8 }, result: 'iron_armor'");
c = c.replace(/cost: \{ iron: 15, ashwood: 10, basic_herb: 2 \}, result: 'iron_pickaxe'/g, "cost: { iron: 18, ashwood: 30, basic_herb: 3 }, result: 'iron_pickaxe'");
c = c.replace(/cost: \{ iron: 15, ashwood: 10, basic_herb: 2 \}, result: 'iron_axe'/g, "cost: { iron: 10, ashwood: 50, moon_herb: 1 }, result: 'iron_axe'");

// T2 Weapons
updateWeapon('Iron Greatsword', '{ iron: 45, ashwood: 12, mooncap_mushroom: 3 }');
updateWeapon('Wolf Slayer Sword', '{ iron: 45, ashwood: 12, mooncap_mushroom: 3 }');
updateWeapon('Venom Shiv', '{ iron: 30, ashwood: 8, moon_herb: 5 }');

// T3 & T4 Tools & Armor
c = c.replace(/cost: \{ steel_ore: 30, golden_koi: 10, stone_core: 2 \}, result: 'steel_armor'/g, "cost: { steel_ore: 150, golden_koi: 20, stone_core: 5 }, result: 'steel_armor'");
c = c.replace(/cost: \{ steel_ore: 20, oakwood: 15 \}, result: 'steel_pickaxe'/g, "cost: { steel_ore: 25, oakwood: 60, frost_lotus: 1 }, result: 'steel_pickaxe'");
c = c.replace(/cost: \{ steel_ore: 20, oakwood: 15 \}, result: 'steel_axe'/g, "cost: { steel_ore: 18, oakwood: 80, stone_core: 3 }, result: 'steel_axe'");

c = c.replace(/cost: \{ mythril: 35, lava_eel: 10, cinderbloom: 10 \}, result: 'mythril_armor'/g, "cost: { mythril: 180, lava_eel: 30, cinderbloom: 10 }, result: 'mythril_armor'");
c = c.replace(/cost: \{ mythril: 25, elderwood: 20 \}, result: 'mythril_pickaxe'/g, "cost: { mythril: 45, elderwood: 80, hellfire_essence: 2 }, result: 'mythril_pickaxe'");
c = c.replace(/cost: \{ mythril: 25, elderwood: 20 \}, result: 'mythril_axe'/g, "cost: { mythril: 30, elderwood: 110, cinderbloom: 5 }, result: 'mythril_axe'");

// T3&T4 Weapons
updateWeapon('Mythril Cleaver', '{ mythril: 80, gold_ore: 20, hellfire_essence: 5 }');
updateWeapon('Shadow Blade', '{ mythril: 65, gold_ore: 25, hellfire_essence: 3 }');
updateWeapon('Moonlight Staff', '{ mythril: 30, elderwood: 90, cinderbloom: 6 }');
updateWeapon('Meteor Staff', '{ mythril: 50, elderwood: 60, hellfire_essence: 8 }');

// T5 Tools & Armor
c = c.replace(/cost: \{ voidstone: 60, void_bass: 15, nightmare_kelp: 10 \}, result: 'void_armor'/g, "cost: { voidstone: 200, void_bass: 60, nightmare_kelp: 20 }, result: 'void_armor'");
c = c.replace(/cost: \{ voidstone: 40, aether_wood: 30 \}, result: 'demonic_pickaxe'/g, "cost: { voidstone: 45, aether_wood: 90, void_fragment: 3 }, result: 'demonic_pickaxe'");
c = c.replace(/cost: \{ voidstone: 40, aether_wood: 30 \}, result: 'demonic_axe'/g, "cost: { voidstone: 25, aether_wood: 125, lich_soul: 1 }, result: 'demonic_axe'");

// T5 Weapons
updateWeapon('Void Blade', '{ voidstone: 90, rare_meteorite_ingot: 30, lich_soul: 8 }');

fs.writeFileSync('src/commands/forge.ts', c);
console.log('patched forge models V2');
