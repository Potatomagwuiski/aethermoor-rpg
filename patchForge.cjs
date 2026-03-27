const fs = require('fs');

let c = fs.readFileSync('src/commands/forge.ts', 'utf8');

// TIER 1 WEAPONS (Bronze / Wood)
c = c.replace(/materials: \{ copper: 10, wood: 10, beast_core: 5 \}/g, "materials: { copper: 15, wood: 5, seaweed: 2 }");

// TIER 2 WEAPONS (Iron / Venom / etc)
c = c.replace(/materials: \{ iron: 20, ashwood: 10, monster_core: 5 \}/g, "materials: { iron: 20, ashwood: 10, mooncap_mushroom: 5 }");

// TIER 3 / 4 WEAPONS (Mythril / Shadows)
c = c.replace(/materials: \{ mythril: 20, elderwood: 10, abyssal_core: 5 \}/g, "materials: { mythril: 30, gold_ore: 15, hellfire_essence: 5 }");

// TIER 5 WEAPONS (Void)
c = c.replace(/materials: \{ voidstone: 20, void_timber: 10, void_core: 5 \}/g, "materials: { voidstone: 50, rare_meteorite_ingot: 20, lich_soul: 10 }");

// ARMORS & TOOLS
// Instead of regexing everything independently, let's just do targeted replaces for known tools
const replacements = {
  // T1 Tools & Armor
  "cost: { copper: 15 }, result: 'copper_armor'": "cost: { copper: 20, potato: 5, seaweed: 5 }, result: 'copper_armor'",
  "cost: { copper: 10 }, result: 'copper_pickaxe'": "cost: { copper: 10, wood: 5, basic_herb: 1 }, result: 'copper_pickaxe'",
  "cost: { copper: 10 }, result: 'copper_axe'": "cost: { copper: 10, wood: 5, basic_herb: 1 }, result: 'copper_axe'",
  
  // T2 Tools & Armor
  "cost: { iron: 15 }, result: 'iron_armor'": "cost: { iron: 25, river_trout: 10, moon_herb: 5 }, result: 'iron_armor'",
  "cost: { iron: 10 }, result: 'iron_pickaxe'": "cost: { iron: 15, ashwood: 10, basic_herb: 2 }, result: 'iron_pickaxe'",
  "cost: { iron: 10 }, result: 'iron_axe'": "cost: { iron: 15, ashwood: 10, basic_herb: 2 }, result: 'iron_axe'",
  
  // T3 Tools & Armor
  "cost: { steel_ore: 25 }, result: 'steel_armor'": "cost: { steel_ore: 30, golden_koi: 10, stone_core: 2 }, result: 'steel_armor'",
  "cost: { steel_ore: 15 }, result: 'steel_pickaxe'": "cost: { steel_ore: 20, oakwood: 15 }, result: 'steel_pickaxe'",
  "cost: { steel_ore: 15 }, result: 'steel_axe'": "cost: { steel_ore: 20, oakwood: 15 }, result: 'steel_axe'",
  
  // T4 Tools & Armor
  "cost: { mythril: 30 }, result: 'mythril_armor'": "cost: { mythril: 35, lava_eel: 10, cinderbloom: 10 }, result: 'mythril_armor'",
  "cost: { mythril: 20 }, result: 'mythril_pickaxe'": "cost: { mythril: 25, elderwood: 20 }, result: 'mythril_pickaxe'",
  "cost: { mythril: 20 }, result: 'mythril_axe'": "cost: { mythril: 25, elderwood: 20 }, result: 'mythril_axe'",
  
  // T5 Tools & Armor
  "cost: { voidstone: 40 }, result: 'void_armor'": "cost: { voidstone: 60, void_bass: 15, nightmare_kelp: 10 }, result: 'void_armor'",
  "cost: { voidstone: 30 }, result: 'demonic_pickaxe'": "cost: { voidstone: 40, aether_wood: 30 }, result: 'demonic_pickaxe'",
  "cost: { voidstone: 30 }, result: 'demonic_axe'": "cost: { voidstone: 40, aether_wood: 30 }, result: 'demonic_axe'",
};

for (const [key, val] of Object.entries(replacements)) {
    c = c.replace(key, val);
}

fs.writeFileSync('src/commands/forge.ts', c);
console.log('patched forge models');
