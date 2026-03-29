const fs = require('fs');
const path = require('path');

const targetPath = path.join(__dirname, '..', 'commands', 'forge.ts');
let content = fs.readFileSync(targetPath, 'utf8');

const startIndex = content.indexOf('// --- WARRIOR ---');
const endIndex = content.indexOf('// --- HEAVY ARMOR (WARRIORS) ---');

if (startIndex === -1 || endIndex === -1) {
    console.error("COULD NOT FIND WEAPONS SECTION");
    process.exit(1);
}

const newWeapons = `// --- WEAPONS ---
// ----- DAGGERS (FINESSE) -----
  'bronze_dagger': {
    name: 'Bronze Dagger', materials: { copper: 20, sticks: 5 },
    abilities: [
      '🛡️ **Passive [Lightweight]**: +5% Evasion',
      '⚡ **Active [Serrated Edge]**: 20% chance to apply a 5 DMG Bleed'
    ],
    outputs: { base: { key: 'bronze_dagger', name: 'Bronze Dagger', dps: 15 } }
  },
  'venom_shiv': {
    name: 'Venom Shiv', requiredBlueprint: 'blueprint_venom_shiv', materials: { iron: 30, ashwood: 8, brittle_bone: 8, slime_gel: 4 },
    abilities: [
      '🛡️ **Passive [Swiftness]**: +15% Base Evasion',
      '⚡ **Active [Neurotoxin]**: 30% chance on hit to apply a Poison Stack (-5% Monster DMG/stack)'
    ],
    outputs: { base: { key: 'venom_shiv', name: 'Venom Shiv', dps: 90 } }
  },
  'phantom_dirk': {
    name: 'Phantom Dirk', requiredBlueprint: 'blueprint_phantom_dirk', materials: { steel: 40, strong_wood: 12, shadow_dust: 5 },
    abilities: [
      '🛡️ **Passive [Unseen]**: Become untargetable to all enemies during Round 1.',
      '⚡ **Active [Phantom Strike]**: 25% chance to hit a second time instantly.'
    ],
    outputs: { base: { key: 'phantom_dirk', name: 'Phantom Dirk', dps: 200 } }
  },
  'shadow_blade': {
    name: 'Shadow Blade', requiredBlueprint: 'blueprint_shadow_blade', materials: { mythril: 65, ebony_wood: 15, gold_ore: 25, shadow_dust: 15 },
    abilities: [
      '🛡️ **Passive [Relentless]**: Every round increases Base Damage by 10%',
      '⚡ **Active [Assassinate]**: 15% chance to instantly execute a non-boss enemy!'
    ],
    outputs: { base: { key: 'shadow_blade', name: 'Shadow Blade', dps: 380 } }
  },
  'void_fang': {
    name: 'Void Fang', requiredBlueprint: 'blueprint_void_fang', materials: { abyssal_steel: 80, eternal_wood: 20, lich_phylactery: 1 },
    abilities: [
      '🛡️ **Passive [Plague Carrier]**: Applies 5 massive stacks of Plague instantly, reducing enemy ATK power by 10%.',
      '⚡ **Active [Parasitic Siphon]**: Leeches 1% Max HP per active Poison Stack on the enemy every round.'
    ],
    outputs: { base: { key: 'void_fang', name: 'Void Fang', dps: 550 } }
  },

// ----- SWORDS (HEAVY) -----
  'bronze_sword': {
    name: 'Bronze Sword', materials: { copper: 25, sticks: 10 },
    abilities: [
      '🛡️ **Passive [Heavy Blade]**: Reduces incoming damage by flat 2',
      '⚡ **Active [Cleave]**: 20% chance to hit a second target for 50% DMG'
    ],
    outputs: { base: { key: 'bronze_sword', name: 'Bronze Sword', dps: 18 } }
  },
  'iron_greatsword': {
    name: 'Iron Greatsword', materials: { iron: 40, ashwood: 15 },
    abilities: [
      '🛡️ **Passive [Parry]**: 10% chance to completely block an attack.',
      '⚡ **Active [Wide Cleave]**: 35% chance to hit a second target for 50% DMG'
    ],
    outputs: { base: { key: 'iron_greatsword', name: 'Iron Greatsword', dps: 110 } }
  },
  'steel_claymore': {
    name: 'Steel Claymore', materials: { steel: 50, strong_wood: 20, golem_rubble: 10 },
    abilities: [
      '🛡️ **Passive [Juggernaut]**: Increases Max HP by 50',
      '⚡ **Active [Whirlwind]**: 15% chance to deal 75% AoE Damage to the whole pack!'
    ],
    outputs: { base: { key: 'steel_claymore', name: 'Steel Claymore', dps: 240 } }
  },
  'mythril_cleaver': {
    name: 'Mythril Cleaver', requiredBlueprint: 'blueprint_mythril_cleaver', materials: { mythril: 70, ebony_wood: 20, demon_horn: 15 },
    abilities: [
      '🛡️ **Passive [Master Parry]**: 25% chance to completely block an attack.',
      '⚡ **Active [Guaranteed Cleave]**: 100% chance to hit a second target for 50% DMG (Every hit cleaves!)'
    ],
    outputs: { base: { key: 'mythril_cleaver', name: 'Mythril Cleaver', dps: 420 } }
  },
  'colossal_slayer': {
    name: 'Colossal Slayer', requiredBlueprint: 'blueprint_colossal_slayer', materials: { abyssal_steel: 100, eternal_wood: 30, drake_scale: 5 },
    abilities: [
      '🛡️ **Passive [Colossal]**: Deals +100% damage to Bosses and Elites.',
      '⚡ **Active [Earthquake]**: 20% chance to deal 100% AoE Damage to all enemies and Stun them for 1 turn.'
    ],
    outputs: { base: { key: 'colossal_slayer', name: 'Colossal Slayer', dps: 600 } }
  },

// ----- STAFFS (MAGIC) -----
  'wood_staff': {
    name: 'Wood Staff', materials: { copper: 10, sticks: 35, slime_gel: 4 },
    abilities: [
      '🛡️ **Passive [Attuned]**: +5 Max Mana',
      '⚡ **Active [Ember]**: 15% chance to cast a 25 DMG fireball on attack'
    ],
    outputs: { base: { key: 'wood_staff', name: 'Wood Staff', dps: 15 } }
  },
  'bone_staff': {
    name: 'Bone Staff', materials: { iron: 15, ashwood: 30, brittle_bone: 15 },
    abilities: [
      '🛡️ **Passive [Necromancy]**: Restores 5 HP directly upon slaying an enemy.',
      '⚡ **Active [Drain Life]**: 25% chance to steal 20 HP from the enemy.'
    ],
    outputs: { base: { key: 'bone_staff', name: 'Bone Staff', dps: 85 } }
  },
  'moonlight_staff': {
    name: 'Moonlight Staff', materials: { steel: 20, strong_wood: 40, shadow_dust: 10 },
    abilities: [
      '🛡️ **Passive [Lunar Grace]**: +10 Max Mana and heals 5 HP per round.',
      '⚡ **Active [Moonbeam]**: 20% chance to strike all enemies with Moonlight for 50% true DMG.'
    ],
    outputs: { base: { key: 'moonlight_staff', name: 'Moonlight Staff', dps: 210 } }
  },
  'meteor_staff': {
    name: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { mythril: 30, ebony_wood: 50, gold_ore: 15, demon_horn: 20 },
    abilities: [
      '🛡️ **Passive [Arcane Master]**: Max Mana increases by 20.',
      '⚡ **Active [Meteor Swarm]**: 15% chance to drop 3 Meteors dealing massive AoE damage to the entire pack!'
    ],
    outputs: { base: { key: 'meteor_staff', name: 'Meteor Staff', dps: 390 } }
  },
  'event_horizon': {
    name: 'Event Horizon', requiredBlueprint: 'blueprint_event_horizon', materials: { abyssal_steel: 45, eternal_wood: 60, lich_phylactery: 2 },
    abilities: [
      '🛡️ **Passive [Black Hole]**: Enemies cannot Dodge or Evade your attacks.',
      '⚡ **Active [Supernova]**: 10% chance to instantly delete all non-boss enemies in the room!'
    ],
    outputs: { base: { key: 'event_horizon', name: 'Event Horizon', dps: 580 } }
  },

// ----- BOWS (FINESSE) -----
  'shortbow': {
    name: 'Shortbow', materials: { sticks: 25, copper: 5 },
    abilities: [
      '🛡️ **Passive [Hawk Eye]**: +5% Critical Hit Chance.',
      '⚡ **Active [Quick Shot]**: 15% chance to fire a second arrow instantly.'
    ],
    outputs: { base: { key: 'shortbow', name: 'Shortbow', dps: 16 } }
  },
  'hunters_bow': {
    name: 'Hunters Bow', materials: { ashwood: 35, iron: 10, wolf_pelt: 5 },
    abilities: [
      '🛡️ **Passive [First Strike]**: Deals +50% damage on Round 1.',
      '⚡ **Active [Piercing Arrow]**: 20% chance to ignore enemy Armor modifiers.'
    ],
    outputs: { base: { key: 'hunters_bow', name: 'Hunters Bow', dps: 100 } }
  },
  'recurve_bow': {
    name: 'Recurve Bow', materials: { strong_wood: 50, steel: 15, golem_rubble: 5 },
    abilities: [
      '🛡️ **Passive [Deadly Aim]**: Critical Hits deal 200% damage instead of 150%.',
      '⚡ **Active [Volley]**: 25% chance to fire 3 arrows at random enemies.'
    ],
    outputs: { base: { key: 'recurve_bow', name: 'Recurve Bow', dps: 230 } }
  },
  'stormcaller': {
    name: 'Stormcaller', requiredBlueprint: 'blueprint_stormcaller', materials: { ebony_wood: 60, mythril: 20, demon_horn: 10 },
    abilities: [
      '🛡️ **Passive [Lightning Reflexes]**: +20% Evasion.',
      '⚡ **Active [Chain Lightning]**: 30% chance to chain 100% damage to all enemies.'
    ],
    outputs: { base: { key: 'stormcaller', name: 'Stormcaller', dps: 410 } }
  },
  'celestial_bow': {
    name: 'Celestial Bow', requiredBlueprint: 'blueprint_celestial_bow', materials: { eternal_wood: 80, abyssal_steel: 30, drake_scale: 3 },
    abilities: [
      '🛡️ **Passive [Star-struck]**: Every shot adds a stack of Starlight (+10% Crit Chance).',
      '⚡ **Active [Shooting Star]**: 100% Critical Hit chance if targeting a Boss.'
    ],
    outputs: { base: { key: 'celestial_bow', name: 'Celestial Bow', dps: 590 } }
  },

// ----- HAMMERS (HEAVY) -----
  'wooden_club': {
    name: 'Wooden Club', materials: { sticks: 40 },
    abilities: [
      '🛡️ **Passive [Blunt Force]**: Ignores 10% of enemy Armor.',
      '⚡ **Active [Concussive Blow]**: 15% chance to reduce enemy ATK by 5.'
    ],
    outputs: { base: { key: 'wooden_club', name: 'Wooden Club', dps: 14 } }
  },
  'iron_mace': {
    name: 'Iron Mace', materials: { iron: 50, ashwood: 10 },
    abilities: [
      '🛡️ **Passive [Shatter]**: Ignores 20% of enemy Armor.',
      '⚡ **Active [Stagger]**: 20% chance to prevent the enemy from attacking this round!'
    ],
    outputs: { base: { key: 'iron_mace', name: 'Iron Mace', dps: 95 } }
  },
  'steel_warhammer': {
    name: 'Steel Warhammer', materials: { steel: 60, strong_wood: 15, brittle_bone: 20 },
    abilities: [
      '🛡️ **Passive [Momentum]**: Gains +5 Base Damage every round of combat.',
      '⚡ **Active [Skull Crusher]**: 25% chance to deal massive Critical Damage.'
    ],
    outputs: { base: { key: 'steel_warhammer', name: 'Steel Warhammer', dps: 220 } }
  },
  'titan_maul': {
    name: 'Titan Maul', requiredBlueprint: 'blueprint_titan_maul', materials: { mythril: 80, ebony_wood: 25, golem_rubble: 30 },
    abilities: [
      '🛡️ **Passive [Unstoppable Force]**: You cannot be Evaded or Mitigation-blocked.',
      '⚡ **Active [Tremor]**: 30% chance to stun the entire enemy pack for 1 round!'
    ],
    outputs: { base: { key: 'titan_maul', name: 'Titan Maul', dps: 400 } }
  },
  'earthshaker': {
    name: 'Earthshaker', requiredBlueprint: 'blueprint_earthshaker', materials: { abyssal_steel: 120, eternal_wood: 40, drake_scale: 10 },
    abilities: [
      '🛡️ **Passive [Tectonic]**: Base Damage scales directly with your missing HP (+1% DMG per 1% HP missing).',
      '⚡ **Active [Fissure]**: 20% chance to instantly execute any armored target.'
    ],
    outputs: { base: { key: 'earthshaker', name: 'Earthshaker', dps: 620 } }
  },

`;

const finalContent = content.slice(0, startIndex) + newWeapons + content.slice(endIndex);
fs.writeFileSync(targetPath, finalContent);
console.log("Successfully rebuilt forge.ts with 25 distinct weapon templates and Active/Passive tooltips!");
