import { Message, EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, StringSelectMenuBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

// Define the blueprint requirements and outputs
export const BLUEPRINTS: Record<string, any> = {
  // --- WEAPONS ---
// ----- DAGGERS (FINESSE) -----
  'bronze_dagger': {
    name: 'Bronze Dagger', materials: { copper: 20, sticks: 5 },
    abilities: [
      '🛡️ **Passive [Lightweight]**: +5% Evasion',
      '⚡ **Active [Serrated Edge]**: 20% chance to apply a 5 DMG Bleed'
    ],
    outputs: { base: { key: 'bronze_dagger', name: 'Bronze Dagger', dps: 15 , rarity: 'COMMON' } }
  },
  'venom_shiv': {
    name: 'Venom Shiv', requiredBlueprint: 'blueprint_venom_shiv', materials: { iron: 30, ashwood: 8, brittle_bone: 8, slime_gel: 4 },
    abilities: [
      '🛡️ **Passive [Swiftness]**: +15% Base Evasion',
      '⚡ **Active [Neurotoxin]**: 30% chance on hit to apply a Poison Stack (-5% Monster DMG/stack)'
    ],
    outputs: { base: { key: 'venom_shiv', name: 'Venom Shiv', dps: 90 , rarity: 'UNCOMMON' } }
  },
  
  'serrated_dirk': {
    name: 'Serrated Dirk', requiredBlueprint: 'blueprint_serrated_dirk', materials: { iron: 45, wood: 10, bat_wing: 5 },
    abilities: [
      '🛡️ **Passive [Jagged Edge]**: +5% Base Damage.',
      '⚡ **Active [Hemorrhage]**: 25% chance to apply a 10 DMG Bleed for 3 turns.'
    ],
    outputs: { base: { key: 'serrated_dirk', name: 'Serrated Dirk', dps: 85, rarity: 'UNCOMMON' } }
  },
  'bloodthirster_kukri': {
    name: 'Bloodthirster Kukri', requiredBlueprint: 'blueprint_bloodthirster_kukri', materials: { steel: 50, bone: 20, demon_horn: 2 },
    abilities: [
      '🛡️ **Passive [Vampire]**: +10% Lifesteal.',
      '⚡ **Active [Feast]**: 15% chance to heal for 100% of damage dealt.',
      '🦇 **Blood Frenzy**: Overhealing grants a temporary +5% Damage buff.'
    ],
    outputs: { base: { key: 'bloodthirster_kukri', name: 'Bloodthirster Kukri', dps: 180, rarity: 'RARE' } }
  },
  'windrunner_shiv': {
    name: 'Windrunner Shiv', requiredBlueprint: 'blueprint_windrunner_shiv', materials: { steel: 40, strong_wood: 15, seaweed: 20 },
    abilities: [
      '🛡️ **Passive [Lightweight]**: +5% Evasion.',
      '⚡ **Active [Gale Strike]**: 20% chance to attack twice.',
      '💨 **Untouchable**: Increases the maximum Evasion cap by 15%.'
    ],
    outputs: { base: { key: 'windrunner_shiv', name: 'Windrunner Shiv', dps: 190, rarity: 'RARE' } }
  },
  'heartseeker': {
    name: 'Heartseeker', requiredBlueprint: 'blueprint_heartseeker', materials: { mythril: 55, ebony_wood: 15, golden_pearl: 5 },
    abilities: [
      '🛡️ **Passive [Surgical]**: +10% Critical Hit Chance.',
      '⚡ **Active [Execute]**: Deals 300% Critical Damage on hit.',
      '🎯 **Lethality**: Crits ignore 25% of enemy defense.',
      '💀 **Assassin**: Base Damage +15% when wielding Finesse weapons.'
    ],
    outputs: { base: { key: 'heartseeker', name: 'Heartseeker', dps: 350, rarity: 'EPIC' } }
  },
  'phantom_dirk': {
    name: 'Phantom Dirk', requiredBlueprint: 'blueprint_phantom_dirk', materials: { steel: 40, strong_wood: 12, shadow_dust: 5 },
    abilities: [
      '🛡️ **Passive [Unseen]**: Become untargetable to all enemies during Round 1.',
      '⚡ **Active [Phantom Strike]**: 25% chance to hit a second time instantly.'
    ],
    outputs: { base: { key: 'phantom_dirk', name: 'Phantom Dirk', dps: 200 , rarity: 'RARE' } }
  },
  'shadow_blade': {
    name: 'Shadow Blade', requiredBlueprint: 'blueprint_shadow_blade', materials: { mythril: 65, ebony_wood: 15, gold_ore: 25, shadow_dust: 15 },
    abilities: [
      '🛡️ **Passive [Relentless]**: Every round increases Base Damage by 10%',
      '⚡ **Active [Assassinate]**: 15% chance to instantly execute a non-boss enemy!'
    ],
    outputs: { base: { key: 'shadow_blade', name: 'Shadow Blade', dps: 380 , rarity: 'EPIC' } }
  },
  'void_fang': {
    name: 'Void Fang', requiredBlueprint: 'blueprint_void_fang', materials: { abyssal_steel: 80, eternal_wood: 20, lich_phylactery: 1 },
    abilities: [
      '🛡️ **Passive [Plague Carrier]**: Applies 5 massive stacks of Plague instantly, reducing enemy ATK power by 10%.',
      '⚡ **Active [Parasitic Siphon]**: Leeches 1% Max HP per active Poison Stack on the enemy every round.'
    ],
    outputs: { base: { key: 'void_fang', name: 'Void Fang', dps: 550 , rarity: 'LEGENDARY' } }
  },

// ----- SWORDS (HEAVY) -----
  'bronze_sword': {
    name: 'Bronze Sword', materials: { copper: 25, sticks: 10 },
    abilities: [
      '🛡️ **Passive [Heavy Blade]**: Reduces incoming damage by flat 2',
      '⚡ **Active [Cleave]**: 20% chance to hit a second target for 50% DMG'
    ],
    outputs: { base: { key: 'bronze_sword', name: 'Bronze Sword', dps: 18 , rarity: 'COMMON' } }
  },
  
  'broadsword': {
    name: 'Broadsword', requiredBlueprint: 'blueprint_broadsword', materials: { iron: 55, stone_core: 5 },
    abilities: [
      '🛡️ **Passive [Defender]**: +3% Block Chance.',
      '⚡ **Active [Guard]**: 20% chance to mitigate 25% damage from the next attack.'
    ],
    outputs: { base: { key: 'broadsword', name: 'Broadsword', dps: 90, rarity: 'UNCOMMON' } }
  },
  'flamberge': {
    name: 'Flamberge', requiredBlueprint: 'blueprint_flamberge', materials: { steel: 65, ruby: 2, hellfire_essence: 1 },
    abilities: [
      '🛡️ **Passive [Scorched]**: Attacks apply a minor burn.',
      '⚡ **Active [Great Cleave]**: 25% chance to hit up to 3 enemies simultaneously.',
      '🔥 **Inferno**: Cleave damage is multiplied by 1.25x.'
    ],
    outputs: { base: { key: 'flamberge', name: 'Flamberge', dps: 220, rarity: 'RARE' } }
  },
  'executioners_axe': {
    name: 'Executioner\'s Axe', requiredBlueprint: 'blueprint_executioners_axe', materials: { steel: 80, brittle_bone: 30 },
    abilities: [
      '🛡️ **Passive [Heavy Blade]**: +10% Base Damage.',
      '⚡ **Active [Decapitate]**: 100% chance to instantly kill non-boss enemies below 20% HP.',
      '🪓 **Merciless**: +50% Damage against bleeding targets.'
    ],
    outputs: { base: { key: 'executioners_axe', name: 'Executioner\'s Axe', dps: 260, rarity: 'RARE' } }
  },
  'titan_mace': {
    name: 'Titan Mace', requiredBlueprint: 'blueprint_titan_mace', materials: { mythril: 90, golem_rubble: 50, stone_core: 20 },
    abilities: [
      '🛡️ **Passive [Crushing]**: Ignores 15% of enemy armor.',
      '⚡ **Active [Quake]**: 20% chance to Stun all enemies for 1 turn.',
      '🧱 **Momentum**: Damage scales multiplicatively with your Total DEF.',
      '🌟 **Unstoppable**: Grants Stun Immunity.'
    ],
    outputs: { base: { key: 'titan_mace', name: 'Titan Mace', dps: 370, rarity: 'EPIC' } }
  },
  'iron_greatsword': {
    name: 'Iron Greatsword', materials: { iron: 40, ashwood: 15 },
    abilities: [
      '🛡️ **Passive [Parry]**: 10% chance to completely block an attack.',
      '⚡ **Active [Wide Cleave]**: 35% chance to hit a second target for 50% DMG'
    ],
    outputs: { base: { key: 'iron_greatsword', name: 'Iron Greatsword', dps: 110 , rarity: 'UNCOMMON' } }
  },
  'iron_spellblade': {
    name: 'Iron Spellblade', requiredBlueprint: 'blueprint_iron_spellblade', materials: { iron: 45, wood: 20 },
    abilities: [
      '🛡️ **Passive [Arcane Parry]**: 10% chance to block, restoring 5% HP on success.',
      '⚡ **Active [Spell Strike]**: 25% chance to deal 150% Magic Weapon DMG.'
    ],
    outputs: { base: { key: 'iron_spellblade', name: 'Iron Spellblade', dps: 100 , rarity: 'UNCOMMON' } }
  },
  'steel_claymore': {
    name: 'Steel Claymore', materials: { steel: 50, strong_wood: 20, golem_rubble: 10 },
    abilities: [
      '🛡️ **Passive [Juggernaut]**: Increases Max HP by 50',
      '⚡ **Active [Whirlwind]**: 15% chance to deal 75% AoE Damage to the whole pack!'
    ],
    outputs: { base: { key: 'steel_claymore', name: 'Steel Claymore', dps: 240 , rarity: 'RARE' } }
  },
  'mythril_cleaver': {
    name: 'Mythril Cleaver', requiredBlueprint: 'blueprint_mythril_cleaver', materials: { mythril: 70, ebony_wood: 20, demon_horn: 15 },
    abilities: [
      '🛡️ **Passive [Master Parry]**: 25% chance to completely block an attack.',
      '⚡ **Active [Guaranteed Cleave]**: 100% chance to hit a second target for 50% DMG (Every hit cleaves!)'
    ],
    outputs: { base: { key: 'mythril_cleaver', name: 'Mythril Cleaver', dps: 420 , rarity: 'EPIC' } }
  },
  'steel_warhammer': {
    name: 'Steel Warhammer', requiredBlueprint: 'blueprint_steel_warhammer', materials: { steel: 40, strong_wood: 15, brittle_bone: 10 },
    abilities: [
      '🛡️ **Passive [Colossal]**: Flat +5% Damage Bonus to all attacks.',
      '⚡ **Active [Earthquake]**: 15% chance to Stun the entire enemy group for 1 turn.'
    ],
    outputs: { base: { key: 'steel_warhammer', name: 'Steel Warhammer', dps: 215 , rarity: 'RARE' } }
  },
  'steel_bulwark': {
    name: 'Steel Bulwark', requiredBlueprint: 'blueprint_steel_bulwark', materials: { steel: 45, strong_wood: 20 },
    abilities: [
      '🛡️ **Passive [Titan]**: +100 Max HP.',
      '⚡ **Active [Shield Bash]**: 20% chance to mitigate 50% of incoming damage next turn.'
    ],
    outputs: { base: { key: 'steel_bulwark', name: 'Steel Bulwark', dps: 180 , rarity: 'RARE' } }
  },
  'colossal_slayer': {
    name: 'Colossal Slayer', requiredBlueprint: 'blueprint_colossal_slayer', materials: { abyssal_steel: 100, eternal_wood: 30, drake_scale: 5 },
    abilities: [
      '🛡️ **Passive [Colossal]**: Deals +100% damage to Bosses and Elites.',
      '⚡ **Active [Earthquake]**: 20% chance to deal 100% AoE Damage to all enemies and Stun them for 1 turn.'
    ],
    outputs: { base: { key: 'colossal_slayer', name: 'Colossal Slayer', dps: 600 , rarity: 'LEGENDARY' } }
  },

// ----- STAFFS (MAGIC) -----
  'wood_staff': {
    name: 'Wood Staff', materials: { copper: 10, sticks: 35, slime_gel: 4 },
    abilities: [
      '🛡️ **Passive [Attuned]**: +5 Max Mana',
      '⚡ **Active [Ember]**: 15% chance to cast a 25 DMG fireball on attack'
    ],
    outputs: { base: { key: 'wood_staff', name: 'Wood Staff', dps: 15 , rarity: 'COMMON' } }
  },
  'bone_staff': {
    name: 'Bone Staff', materials: { iron: 15, ashwood: 30, brittle_bone: 15 },
    abilities: [
      '🛡️ **Passive [Necromancy]**: Restores 5 HP directly upon slaying an enemy.',
      '⚡ **Active [Drain Life]**: 25% chance to steal 20 HP from the enemy.'
    ],
    outputs: { base: { key: 'bone_staff', name: 'Bone Staff', dps: 85 , rarity: 'RARE' } }
  },
  'moonlight_staff': {
    name: 'Moonlight Staff', materials: { steel: 20, strong_wood: 40, shadow_dust: 10 },
    abilities: [
      '🛡️ **Passive [Lunar Grace]**: +10 Max Mana and heals 5 HP per round.',
      '⚡ **Active [Moonbeam]**: 20% chance to strike all enemies with Moonlight for 50% true DMG.'
    ],
    outputs: { base: { key: 'moonlight_staff', name: 'Moonlight Staff', dps: 210 , rarity: 'RARE' } }
  },
  'meteor_staff': {
    name: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { mythril: 30, ebony_wood: 50, gold_ore: 15, demon_horn: 20 },
    abilities: [
      '🛡️ **Passive [Arcane Master]**: Max Mana increases by 20.',
      '⚡ **Active [Meteor Swarm]**: 15% chance to drop 3 Meteors dealing massive AoE damage to the entire pack!'
    ],
    outputs: { base: { key: 'meteor_staff', name: 'Meteor Staff', dps: 390 , rarity: 'EPIC' } }
  },
  'event_horizon': {
    name: 'Event Horizon', requiredBlueprint: 'blueprint_event_horizon', materials: { abyssal_steel: 45, eternal_wood: 60, lich_phylactery: 2 },
    abilities: [
      '🛡️ **Passive [Black Hole]**: Enemies cannot Dodge or Evade your attacks.',
      '⚡ **Active [Supernova]**: 10% chance to instantly delete all non-boss enemies in the room!'
    ],
    outputs: { base: { key: 'event_horizon', name: 'Event Horizon', dps: 580 , rarity: 'LEGENDARY' } }
  },

// ----- BOWS (FINESSE) -----
  'shortbow': {
    name: 'Shortbow', materials: { sticks: 25, copper: 5 },
    abilities: [
      '🛡️ **Passive [Hawk Eye]**: +5% Critical Hit Chance.',
      '⚡ **Active [Quick Shot]**: 15% chance to fire a second arrow instantly.'
    ],
    outputs: { base: { key: 'shortbow', name: 'Shortbow', dps: 16 , rarity: 'COMMON' } }
  },
  'hunters_bow': {
    name: 'Hunters Bow', materials: { ashwood: 35, iron: 10, wolf_pelt: 2 },
    abilities: [
      '🛡️ **Passive [Camouflage]**: +15% Base Evasion',
      '⚡ **Active [Volley]**: 20% chance to fire a second arrow.'
    ],
    outputs: { base: { key: 'hunters_bow', name: 'Hunter\'s Bow', dps: 90 , rarity: 'UNCOMMON' } }
  },
  'compound_longbow': {
    name: 'Compound Longbow', requiredBlueprint: 'blueprint_compound_longbow', materials: { ashwood: 45, steel: 15 },
    abilities: [
      '🛡️ **Passive [Heavy Draw]**: Pierce 10% of enemy Physical Defense.',
      '⚡ **Active [Piercing Shot]**: 25% chance to critically strike for 200% DMG.'
    ],
    outputs: { base: { key: 'compound_longbow', name: 'Compound Longbow', dps: 120 , rarity: 'COMMON' } }
  },
  'recurve_bow': {
    name: 'Recurve Bow', materials: { strong_wood: 50, steel: 15, golem_rubble: 5 },
    abilities: [
      '🛡️ **Passive [Deadly Aim]**: Critical Hits deal 200% damage instead of 150%.',
      '⚡ **Active [Volley]**: 25% chance to fire 3 arrows at random enemies.'
    ],
    outputs: { base: { key: 'recurve_bow', name: 'Recurve Bow', dps: 230 , rarity: 'RARE' } }
  },
  
  'snipers_crossbow': {
    name: 'Sniper\'s Crossbow', requiredBlueprint: 'blueprint_snipers_crossbow', materials: { mythril: 40, ebony_wood: 70, drake_scale: 5 },
    abilities: [
      '🛡️ **Passive [Tension]**: +20% Critical Hit Damage.',
      '⚡ **Active [Headshot]**: 15% chance to automatically crit and deal double damage.',
      '🎯 **Armor Piercing**: Ignores 50% of enemy Physical Defense.',
      '👁️ **Eagle Eye**: +15% Accuracy and cannot Miss.'
    ],
    outputs: { base: { key: 'snipers_crossbow', name: 'Sniper\'s Crossbow', dps: 400, rarity: 'EPIC' } }
  },
  'stormcaller': {
    name: 'Stormcaller', requiredBlueprint: 'blueprint_stormcaller', materials: { ebony_wood: 60, mythril: 20, demon_horn: 10 },
    abilities: [
      '🛡️ **Passive [Lightning Reflexes]**: +20% Evasion.',
      '⚡ **Active [Chain Lightning]**: 30% chance to chain 100% damage to all enemies.'
    ],
    outputs: { base: { key: 'stormcaller', name: 'Stormcaller', dps: 410 , rarity: 'EPIC' } }
  },
  'celestial_bow': {
    name: 'Celestial Bow', requiredBlueprint: 'blueprint_celestial_bow', materials: { eternal_wood: 80, abyssal_steel: 30, drake_scale: 3 },
    abilities: [
      '🛡️ **Passive [Star-struck]**: Every shot adds a stack of Starlight (+10% Crit Chance).',
      '⚡ **Active [Shooting Star]**: 100% Critical Hit chance if targeting a Boss.'
    ],
    outputs: { base: { key: 'celestial_bow', name: 'Celestial Bow', dps: 590 , rarity: 'LEGENDARY' } }
  },

// ----- HAMMERS (HEAVY) -----
  'wooden_club': {
    name: 'Wooden Club', materials: { sticks: 40 },
    abilities: [
      '🛡️ **Passive [Blunt Force]**: Ignores 10% of enemy Armor.',
      '⚡ **Active [Concussive Blow]**: 15% chance to reduce enemy ATK by 5.'
    ],
    outputs: { base: { key: 'wooden_club', name: 'Wooden Club', dps: 14 , rarity: 'COMMON' } }
  },
  'iron_mace': {
    name: 'Iron Mace', materials: { iron: 50, ashwood: 10 },
    abilities: [
      '🛡️ **Passive [Shatter]**: Ignores 20% of enemy Armor.',
      '⚡ **Active [Stagger]**: 20% chance to prevent the enemy from attacking this round!'
    ],
    outputs: { base: { key: 'iron_mace', name: 'Iron Mace', dps: 95 , rarity: 'UNCOMMON' } }
  },

  'titan_maul': {
    name: 'Titan Maul', requiredBlueprint: 'blueprint_titan_maul', materials: { mythril: 80, ebony_wood: 25, golem_rubble: 30 },
    abilities: [
      '🛡️ **Passive [Unstoppable Force]**: You cannot be Evaded or Mitigation-blocked.',
      '⚡ **Active [Tremor]**: 30% chance to stun the entire enemy pack for 1 round!'
    ],
    outputs: { base: { key: 'titan_maul', name: 'Titan Maul', dps: 400 , rarity: 'EPIC' } }
  },
  'earthshaker': {
    name: 'Earthshaker', requiredBlueprint: 'blueprint_earthshaker', materials: { abyssal_steel: 120, eternal_wood: 40, drake_scale: 10 },
    abilities: [
      '🛡️ **Passive [Tectonic]**: Base Damage scales directly with your missing HP (+1% DMG per 1% HP missing).',
      '⚡ **Active [Fissure]**: 20% chance to instantly execute any armored target.'
    ],
    outputs: { base: { key: 'earthshaker', name: 'Earthshaker', dps: 620 , rarity: 'LEGENDARY' } }
  },

// --- HEAVY ARMOR (WARRIORS) ---

  'bronze_chestplate': {
name: 'Bronze Chestplate', materials: { copper: 120, potato: 10, seaweed: 5 },
    abilities: [
      '✨ **Reinforced**: +1 DEF',
      '✨ **Plated**: Reduces physical damage taken by 2%',
      '🧱 **Bastion**: +5% Max HP',
      '🔥 **Heat Resistance**: -10% damage from Magical Fire',
      '🌟 **Bulwark**: 5% chance to reduce incoming damage to 0'
    ],
    outputs: { base: { key: 'bronze_chestplate', name: 'Bronze Chestplate', defense: 10 , rarity: 'COMMON' } }
  },
  'iron_chestplate': {
name: 'Iron Chestplate', requiredBlueprint: 'blueprint_iron_chestplate', materials: { iron: 150, river_trout: 20, moon_herb: 8 },
    abilities: [
      '✨ **Layered**: +2 DEF',
      '✨ **Hardened**: Reduces physical damage taken by 3%',
      '🛡️ **Vanguard**: +20 Max HP',
      '🤕 **Iron Will**: Grants immunity to bleeding effects',
      '🌟 **Unbreakable**: Gain 50 DEF when below 25% HP'
    ],
    outputs: { base: { key: 'iron_chestplate', name: 'Iron Chestplate', defense: 45 , rarity: 'UNCOMMON' } }
  },
  'steel_chestplate': {
name: 'Steel Chestplate', requiredBlueprint: 'blueprint_steel_chestplate', materials: { steel_ore: 220, golden_koi: 40, stone_core: 15 },
    abilities: [
      '✨ **Polished**: +5 DEF',
      '✨ **Alloyed Armor**: Reduces physical damage taken by 5%',
      '🔥 **Fireproof**: Reduces incoming damage by 5%',
      '⚡ **Reflective Coating**: Reflects 5% of melee damage back to the attacker',
      '🌟 **Steel Resolve**: Reduces incoming damage by 15%'
    ],
    outputs: { base: { key: 'steel_chestplate', name: 'Steel Chestplate', defense: 240 , rarity: 'RARE' } }
  },


  // --- CLOTH ARMOR (MAGES) ---
  
  'spellweaver_robe': {
    name: 'Spellweaver Robe', requiredBlueprint: 'blueprint_spellweaver_robe', materials: { steel: 30, strong_wood: 20, moon_herb: 40 },
    abilities: [
      '✨ **Infused Armor**: +25 Max Mana.',
      '✨ **Mana Shield**: Reduces incoming damage by 15%.',
      '🔮 **Spellweaver**: +15% Damage Output when wielding Spellblade or Magic weapons.'
    ],
    outputs: { base: { key: 'spellweaver_robe', name: 'Spellweaver Robe', defense: 150, rarity: 'RARE' } }
  },
  'ranger_hauberk': {
    name: 'Ranger Hauberk', requiredBlueprint: 'blueprint_ranger_hauberk', materials: { steel: 40, strong_wood: 30, river_trout: 15 },
    abilities: [
      '✨ **Reinforced Leather**: +5% Dodge Chance.',
      '✨ **Nimble**: Prevents taking Critical Hits from enemies.',
      '🏹 **Swift Draw**: Increases base damage multiplier and reduces enemy evasion when wielding Finesse or Hunter weapons.'
    ],
    outputs: { base: { key: 'ranger_hauberk', name: 'Ranger Hauberk', defense: 200, rarity: 'RARE' } }
  },
  'juggernaut_plate': {
    name: 'Juggernaut Plate', requiredBlueprint: 'blueprint_juggernaut_plate', materials: { mythril: 60, golem_rubble: 40, demon_horn: 10 },
    abilities: [
      '✨ **Bastion**: +100 Max HP.',
      '✨ **Deflection**: +15% Block Chance.',
      '🛡️ **Unstoppable Force**: Grants absolute Stun Immunity and bonus Block multiplier when wielding Vanguard or Heavy Weapons.',
      '🔥 **Dragonforged**: 50% Resistance to magical damage.'
    ],
    outputs: { base: { key: 'juggernaut_plate', name: 'Juggernaut Plate', defense: 380, rarity: 'EPIC' } }
  },
  'apprentice_robe': {
name: 'Apprentice Robe', materials: { copper: 10, wood: 30, basic_herb: 5 },
    abilities: [
      '✨ **Light Fabric**: +1 Max Energy',
      '✨ **Mana Shield**: Reduces incoming damage by 10%',
      '💧 **Clear Mind**: +5% Energy Regen per round',
      '🔮 **Arcane Focus**: Spells cost 10% less Mana',
      '🌟 **Archmage**: +15 Max Energy'
    ],
    outputs: { base: { key: 'apprentice_robe', name: 'Apprentice Robe', defense: 8 , rarity: 'UNCOMMON' } }
  },
  'mystic_robe': {
name: 'Mystic Robe', requiredBlueprint: 'blueprint_mystic_robe', materials: { iron: 30, ashwood: 60, moon_herb: 10 },
    abilities: [
      '✨ **Woven Magic**: +5 Max Mana',
      '✨ **Arcane Recovery**: Heals 5% Max HP after combat',
      '💫 **Mystic Ward**: Blocks 50 incoming Magic Damage',
      '🌙 **Lunar Blessing**: +20% ALL Stats during Nightime Cycles',
      '🌟 **Invulnerability**: The first attack received each combat deals 0 DMG'
    ],
    outputs: { base: { key: 'mystic_robe', name: 'Mystic Robe', defense: 40 , rarity: 'RARE' } }
  },
  'lich_mantle': {
name: 'Lich Mantle', requiredBlueprint: 'blueprint_lich_mantle', materials: { mythril: 50, gold_ore: 20, lich_phylactery: 3, living_bark: 5, lumina_berry: 15 },
    abilities: [
      '💀 **Dread**: Enemies have -1% Hit Chance',
      '✨ **Undying**: 5% chance to revive with 1 HP on death',
      '💀 **Grave Chill**: Monsters attacking you lose 5% ATK',
      '👑 **Lich King**: Undead monsters will occasionally flee instead of fighting',
      '🌟 **Lord of Death**: Summons a skeletal minion to absorb 100 DMG each combat'
    ],
    outputs: { base: { key: 'lich_mantle', name: 'Lich Mantle', defense: 300 , rarity: 'EPIC' } }
  },

  // --- LIGHT ARMOR (ROGUES) ---
  'leather_tunic': {
name: 'Leather Tunic', materials: { copper: 15, wood: 10, seaweed: 8 },
    abilities: [
      '✨ **Snug**: +1% Dodge Chance',
      '✨ **Evasion**: +5% Dodge Chance',
      '💨 **Swiftness**: +5% Dodge Chance',
      '🗡️ **Assassin**: +10% DMG when using Daggers or Shivs',
      '🌟 **Ghost**: Evasion cap increased by 15%'
    ],
    outputs: { base: { key: 'leather_tunic', name: 'Leather Tunic', defense: 8 , rarity: 'COMMON' } }
  },
  'scout_cloak': {
name: 'Scout Cloak', requiredBlueprint: 'blueprint_scout_cloak', materials: { copper: 20, wood: 20, seaweed: 15 },
    abilities: [
      '✨ **Camouflage**: +2% Dodge Chance',
      '✨ **Shadow Step**: 100% Dodge First Attack',
      '🐺 **Lone Wolf**: +15% Base Damage',
      '🗡️ **Ambush**: First attack always lands as a Critical Hit',
      '🌟 **Unseen Predator**: Stealth cannot be broken on the first attack'
    ],
    outputs: { base: { key: 'scout_cloak', name: 'Scout Cloak', defense: 35 , rarity: 'UNCOMMON' } }
  },
  'shadow_tunic': {
name: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: { mythril: 40, elderwood: 80, hellfire_essence: 5, golden_pearl: 2, frost_lotus: 10 },
    abilities: [
      '🌑 **Dark Dye**: +3% Evasion at Night',
      '✨ **Smoke Bomb**: 15% chance to completely negate an attack',
      '🌑 **Veil of Night**: Converts 20% of Evasion into bonus DEF',
      '🥷 **Executioner Form**: Double damage when hitting from Stealth',
      '🌟 **Shadow Realm**: 5% chance to dodge ALL attacks for 1 round'
    ],
    outputs: { base: { key: 'shadow_tunic', name: 'Shadow Tunic', defense: 400 , rarity: 'EPIC' } }
  },
  // --- TOOLS ---

  'bronze_sickle': {
name: 'Bronze Sickle', materials: { copper: 30, sticks: 20, slime_gel: 10 },
    abilities: [
      '🌾 **Reap**: 5% chance for double herbs',
      '🌱 **Harvester**: +1 Base Yield',
      '💎 **Tireless Swing**: Harvesting never costs Exhaustion',
      '🌿 **Earth Sense**: 10% chance to find hidden seeds',
      '🌟 **Mother Lode**: 1% chance to yield 50x materials'
    ],
    outputs: { base: { key: 'bronze_sickle', name: 'Bronze Sickle', yield: 1.25 , rarity: 'COMMON' } }
  },
  'iron_sickle': {
name: 'Iron Sickle', requiredBlueprint: 'blueprint_iron_sickle', materials: { iron: 50, ashwood: 40, bat_wing: 15 },
    abilities: [
      '🌾 **Efficient Reap**: 10% chance for double herbs',
      '🌱 **Expert Harvester**: +2 Base Yield',
      '💎 **Tireless Swing**: Harvesting never costs Exhaustion',
      '🌿 **Nature\'s Gift**: 15% chance to find hidden seeds',
      '🌟 **Golden Harvest**: 2% chance to yield 50x materials'
    ],
    outputs: { base: { key: 'iron_sickle', name: 'Iron Sickle', yield: 2.5 , rarity: 'UNCOMMON' } }
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
    outputs: { base: { key: 'mythril_sickle', name: 'Mythril Sickle', yield: 8.0 , rarity: 'EPIC' } }
  },

  'bronze_pickaxe': {
name: 'Bronze Pickaxe', materials: { copper: 25, sticks: 50, basic_herb: 1 },
    abilities: [
      '⛏️ **Prospect**: 5% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Tireless Swing**: Mining never costs Exhaustion',
      '🪨 **Earth Sense**: 10% chance to find hidden gems',
      '🌟 **Mother Lode**: 1% chance to yield 50x ore'
    ],
    outputs: { base: { key: 'bronze_pickaxe', name: 'Bronze Pickaxe', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 1.25 } }
  },
  'iron_pickaxe': {
name: 'Iron Pickaxe', requiredBlueprint: 'blueprint_iron_pickaxe', materials: { iron: 40, ashwood: 60, basic_herb: 3 },
    abilities: [
      '⛏️ **Heavy Swing**: 10% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Prospector**: 15% chance to guarantee an Epic Ore drop',
      '🪨 **Deep Strike**: 5% chance for quadruple yield',
      '🌟 **Core Drill**: 2% chance to yield 100x ore'
    ],
    outputs: { base: { key: 'iron_pickaxe', name: 'Iron Pickaxe', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 } }
  },
  'mythril_pickaxe': {
name: 'Mythril Pickaxe', requiredBlueprint: 'blueprint_mythril_pickaxe', materials: { mythril: 80, elderwood: 120, hellfire_essence: 2 },
    abilities: [
      '⛏️ **Pristine Swing**: 15% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Prospector**: 15% chance to guarantee an Epic Ore drop',
      '🌟 **Overload**: 5% chance to 10x all gathered resources',
      '🌟 **Planet Cracker**: 5% chance to yield 500x ore instantly'
    ],
    outputs: { base: { key: 'mythril_pickaxe', name: 'Mythril Pickaxe', isTool: true, type: 'PICKAXE', rarity: 'EPIC', yieldMultiplier: 8.0 } }
  },
  'bronze_axe': {
name: 'Bronze Axe', materials: { copper: 15, sticks: 80, seaweed: 2 },
    abilities: [
      '🪓 **Chop**: 5% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Evergreen Stamina**: Chopping never costs Exhaustion',
      '🍃 **Natures Bounty**: 10% chance to find hidden seeds',
      '🌟 **Timber!**: 1% chance to yield 50x wood'
    ],
    outputs: { base: { key: 'bronze_axe', name: 'Bronze Axe', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 1.25 } }
  },
  'iron_axe': {
name: 'Iron Axe', requiredBlueprint: 'blueprint_iron_axe', materials: { iron: 20, ashwood: 100, moon_herb: 1 },
    abilities: [
      '🪓 **Heavy Chop**: 10% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Arborist**: 15% chance to guarantee an Epic Wood drop',
      '🍃 **Clearcut**: 5% chance for quadruple yield',
      '🌟 **Deforestation**: 2% chance to yield 100x wood'
    ],
    outputs: { base: { key: 'iron_axe', name: 'Iron Axe', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 } }
  },
  'mythril_axe': {
name: 'Mythril Axe', requiredBlueprint: 'blueprint_mythril_axe', materials: { mythril: 50, elderwood: 180, cinderbloom: 5 },
    abilities: [
      '🪓 **Pristine Chop**: 15% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Arborist**: 15% chance to guarantee an Epic Wood drop',
      '🌟 **Overload**: 5% chance to 10x all gathered resources',
      '🌟 **World Tree Bane**: 5% chance to yield 500x wood instantly'
    ],
    outputs: { base: { key: 'mythril_axe', name: 'Mythril Axe', isTool: true, type: 'AXE', rarity: 'EPIC', yieldMultiplier: 8.0 } }
  },
  'bronze_fishing_rod': {
name: 'Bronze Fishing Rod', materials: { copper: 20, sticks: 40, seaweed: 15 },
    abilities: [
      '🎣 **Reel In**: 10% chance for double fish',
      '🐟 **Angler**: +1 Base Yield',
      '💎 **Tireless Cast**: Fishing never costs Exhaustion',
      '🌊 **Earth Sense**: 10% chance to find hidden treasure',
      '🌟 **Tidal Wave**: 1% chance to yield 50x fish'
    ],
    outputs: { base: { key: 'bronze_fishing_rod', name: 'Bronze Fishing Rod', isTool: true, type: 'FISHING_ROD', rarity: 'COMMON', yieldMultiplier: 1.25 } }
  },
  'iron_fishing_rod': {
name: 'Iron Fishing Rod', requiredBlueprint: 'blueprint_iron_fishing_rod', materials: { iron: 35, ashwood: 60, river_trout: 20 },
    abilities: [
      '🎣 **Heavy Reel**: 10% chance for double fish',
      '🐟 **Expert Angler**: +2 Base Yield',
      '💎 **Fisherman\'s Luck**: 15% chance to guarantee an Epic Fish drop',
      '🌊 **Deep Sea Catch**: 5% chance for quadruple yield',
      '🌟 **Leviathans Bounty**: 2% chance to yield 100x fish'
    ],
    outputs: { base: { key: 'iron_fishing_rod', name: 'Iron Fishing Rod', isTool: true, type: 'FISHING_ROD', rarity: 'UNCOMMON', yieldMultiplier: 2.75 } }
  },
  'mythril_fishing_rod': {
name: 'Mythril Fishing Rod', requiredBlueprint: 'blueprint_mythril_fishing_rod', materials: { mythril: 70, elderwood: 110, golden_koi: 25 },
    abilities: [
      '🎣 **Pristine Cast**: 15% chance for double fish',
      '🐟 **Master Angler**: +3 Base Yield',
      '💎 **Fisherman\'s Luck**: 15% chance to guarantee an Epic Fish drop',
      '🌟 **Overload**: 5% chance to 10x all gathered resources',
      '🌟 **Poseidons Wrath**: 5% chance to yield 500x fish instantly'
    ],
    outputs: { base: { key: 'mythril_fishing_rod', name: 'Mythril Fishing Rod', isTool: true, type: 'FISHING_ROD', rarity: 'EPIC', yieldMultiplier: 8.0 } }
  }
};

export async function executeForge(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start`.');
  }

  // Load inventory separately to bypass stale Prisma generated types
  const inventory = await prisma.inventoryItem.findMany({
    where: { playerId: player.id }
  });

  if (args[0] === 'upgrade') {
     const targetType = args[1]?.toLowerCase();
     if (!targetType || (targetType !== 'weapon' && targetType !== 'armor')) {
         return message.reply('Please specify what to upgrade: `rpg forge upgrade weapon` or `rpg forge upgrade armor`');
     }

     const eqSlot = targetType === 'weapon' ? 'WEAPON' : 'ARMOR';
     let eqFilters: any = { playerId: player.id, equipped: true };
     if (targetType === 'weapon') eqFilters.slot = 'WEAPON';
     else eqFilters.slot = { in: ['LIGHT_ARMOR', 'HEAVY_ARMOR', 'CLOTH'] };

     const eq = await prisma.equipment.findFirst({
         where: eqFilters
     });

     if (!eq) return message.reply(`You do not have a **${targetType}** equipped!`);

     const upgradeLvl = eq.upgradeLevel || 0;
     const goldCost = (upgradeLvl * 10000) + 10000;
     const stoneCost = upgradeLvl + 1;

     if (player.gold < goldCost) return message.reply(`Not enough Gold! Upgrading to **+${upgradeLvl + 1}** costs **${goldCost}** Gold.`);
     const stoneInv = inventory.find((i: any) => i.itemKey === 'enhancement_stone');
     if (!stoneInv || stoneInv.quantity < stoneCost) return message.reply(`Not enough Enhancement Stones! Upgrading to **+${upgradeLvl + 1}** costs **${stoneCost}** 💎 Enhancement Stones.`);

     let newBonusAtk = eq.bonusAtk;
     let newBonusDef = eq.bonusDef;
     let scalingBonus = 0;

     if (targetType === 'weapon') {
         scalingBonus = Math.floor(eq.bonusAtk * 0.20) || 5; 
         newBonusAtk += scalingBonus;
     } else {
         scalingBonus = Math.floor(eq.bonusDef * 0.20) || 5;
         newBonusDef += scalingBonus;
     }

     let newName = eq.name || "Unknown Item";
     if (newName.includes('+')) {
         newName = newName.replace(/\+\d+/, `+${upgradeLvl + 1}`);
     } else {
         newName = `${newName} +1`;
     }

     await prisma.player.update({ where: { id: player.id }, data: { gold: { decrement: goldCost } } });
     await prisma.inventoryItem.update({ where: { id: stoneInv.id }, data: { quantity: { decrement: stoneCost } } });
     await prisma.equipment.update({
         where: { id: eq.id },
         data: { 
             upgradeLevel: upgradeLvl + 1,
             bonusAtk: newBonusAtk,
             bonusDef: newBonusDef,
             name: newName
         }
     });

     const statIncrease = targetType === 'weapon' ? `+${scalingBonus} ATK` : `+${scalingBonus} DEF`;
     return message.reply(`✨ **UPGRADE SUCCESSFUL!**\nYour gear is now **${newName}**!\n💎 Stat Gain: **${statIncrease}**\n\nConsumed: **${goldCost}** 🪙 Gold, **${stoneCost}** 💎 Stones.`);
  }

  if (args.length === 0) {
    const menuEmbed = new EmbedBuilder()
      .setTitle('🔨 The Forge')
      .setColor(0xE67E22)
      .setDescription('Welcome to the Blacksmith. Explore your weapon, armor, and tool schematics below.');
      
    const row = new ActionRowBuilder<ButtonBuilder>()
        .addComponents(
             new ButtonBuilder().setCustomId('forge_weapons').setLabel('Weapons').setStyle(ButtonStyle.Primary).setEmoji('🗡️'),
             new ButtonBuilder().setCustomId('forge_armor').setLabel('Armor').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
             new ButtonBuilder().setCustomId('forge_tools').setLabel('Tools').setStyle(ButtonStyle.Secondary).setEmoji('⛏️')
        );

    const initialMsg = await message.reply({ embeds: [menuEmbed], components: [row] }).catch(() => null);
    if (!initialMsg) return;

    const collector = initialMsg.createMessageComponentCollector({ 
        filter: i => i.user.id === discordId, 
        time: 120000 
    });

    collector.on('collect', async (interaction: any) => {
        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('forge_craft_')) {
            const selectedRecipeId = interaction.values[0];
            await processForge(selectedRecipeId, player, inventory, interaction, true);
            return;
        }

        if (interaction.isStringSelectMenu() && interaction.customId.startsWith('forge_pin_')) {
            const selectedRecipeKey = interaction.values[0];
            let pins: string[] = (player as any).pinnedForgeItems || [];
            
            if (selectedRecipeKey === 'none') {
                pins = [];
                await prisma.player.update({ where: { id: player.id }, data: { pinnedForgeItems: pins } });
                return interaction.reply({ content: `📌 Tracker Cleared.`, ephemeral: true }).catch(() => {});
            }

            if (pins.includes(selectedRecipeKey)) {
                pins = pins.filter((p: string) => p !== selectedRecipeKey);
                await prisma.player.update({ where: { id: player.id }, data: { pinnedForgeItems: pins } });
                return interaction.reply({ content: `📌 Unpinned: **${BLUEPRINTS[selectedRecipeKey].name}**. You are currently tracking ${pins.length}/3 blueprints.`, ephemeral: true }).catch(() => {});
            }

            pins.push(selectedRecipeKey);
            if (pins.length > 3) {
                pins.shift(); // Remove oldest
            }

            await prisma.player.update({ where: { id: player.id }, data: { pinnedForgeItems: pins } });
            return interaction.reply({ content: `📌 Pinned: **${BLUEPRINTS[selectedRecipeKey].name}**. You are currently tracking ${pins.length}/3 blueprints.`, ephemeral: true }).catch(() => {});
        }

        let catUrl = 'weapons';
        if (interaction.customId === 'forge_armor') catUrl = 'armor';
        if (interaction.customId === 'forge_tools') catUrl = 'tools';

        const newEmbed = new EmbedBuilder()
          .setTitle(`🔨 The Forge: ${catUrl.charAt(0).toUpperCase() + catUrl.slice(1)}`)
          .setColor(0xE67E22);

        let craftableCatalog = '';
        let missingCatalog = '';
        let selectOptions: any[] = [];
        let allOptions: any[] = [];

        for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
          if (!blueprint.materials) continue; 

          let validCategory = false;
          if (catUrl === 'weapons' && (key.includes('sword') || key.includes('dagger') || key.includes('staff') || key.includes('scythe') || key.includes('shiv') || key.includes('blade') || key.includes('cleaver') || key.includes('slayer') || key.includes('bow'))) validCategory = true;
          if (catUrl === 'armor' && (key.includes('armor') || key.includes('tunic') || key.includes('robe') || key.includes('mantle') || key.includes('boots') || key.includes('cloak') || key.includes('plate'))) validCategory = true;
          if (catUrl === 'tools' && (key.includes('pickaxe') || key.includes('axe') || key.includes('rod') || key.includes('sickle'))) validCategory = true;
          
          if (!validCategory) continue;
          
          if (blueprint.requiredBlueprint) {
            const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
            if (!hasBlueprint || hasBlueprint.quantity < 1) {
                continue; 
            }
          }

          let isCraftable = true;
          let matString = '';
          for (const [matKey, qty] of Object.entries(blueprint.materials as Record<string, number>)) {
            const emoji = getEmoji(matKey);
            matString += `\`${qty}x\` ${emoji} **${matKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}**, `;
            
            const invItem = inventory.find((i: any) => i.itemKey === matKey);
            if (!invItem || invItem.quantity < qty) {
               isCraftable = false;
            }
          }
          matString = matString.slice(0, -2); 
          
          let reqHeader = '🌟 **Innate Recipe:** Discovered at Birth';
          if (blueprint.requiredBlueprint) {
            const reqBp = blueprint.requiredBlueprint.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
            const reqEmoji = getEmoji(blueprint.requiredBlueprint);
            reqHeader = `📜 **Requires:** 1x ${reqEmoji} \`${reqBp}\``;
          }
          
          let statString = '';
          if (blueprint.outputs && blueprint.outputs.common) {
              const common = blueprint.outputs.common;
              if (common.dps) statString += `⚔️ **Base DPS:** ${common.dps}   `;
              if (common.defense) statString += `🛡️ **Base DEF:** ${common.defense}   `;
              if (common.yieldMultiplier) statString += `⛏️ **Yield:** x${common.yieldMultiplier}   `;
          }
          
          let baseOutput: any = null;
          if (blueprint.outputs.common) baseOutput = blueprint.outputs.common;
          else if (blueprint.outputs.uncommon) baseOutput = blueprint.outputs.uncommon;
          else if (blueprint.outputs.rare) baseOutput = blueprint.outputs.rare;
          else if (blueprint.outputs.epic) baseOutput = blueprint.outputs.epic;
          else if (blueprint.outputs.legendary) baseOutput = blueprint.outputs.legendary;
          else baseOutput = Object.values(blueprint.outputs)[0];

          let displaySlice = 1;
          if (baseOutput.key.includes('uncommon')) displaySlice = 2;
          if (baseOutput.key.includes('rare')) displaySlice = 3;
          if (baseOutput.key.includes('epic')) displaySlice = 4;
          if (baseOutput.key.includes('legendary')) displaySlice = 5;

          let abilityString = '';
          if (blueprint.abilities && blueprint.abilities.length > 0) {
              abilityString = `\n✨ **Innate Abilities:**\n`;
              for (let i = 0; i < displaySlice; i++) {
                 if (blueprint.abilities[i]) {
                    abilityString += `✧ \`${blueprint.abilities[i]}\`\n`;
                 }
              }
          }

          const outputStr = `**${blueprint.name}** (\`${key}\`)\n${statString}${abilityString}\n${reqHeader} \n🧱 **Materials:** ${matString}\n\n`;
          
          if (isCraftable) {
              craftableCatalog += outputStr;
              selectOptions.push({
                  label: blueprint.name.substring(0, 50),
                  value: key,
                  description: `Cost: ${Object.keys(blueprint.materials).map(k => `${blueprint.materials[k as keyof typeof blueprint.materials]}x ${k.replace(/_/g, ' ')}`).join(', ').substring(0, 40)}`
              });
          } else {
              missingCatalog += outputStr;
          }
          
          allOptions.push({
              label: blueprint.name.substring(0, 50),
              value: key,
              description: `Cost: ${Object.keys(blueprint.materials).map(k => `${blueprint.materials[k as keyof typeof blueprint.materials]}x ${k.replace(/_/g, ' ')}`).join(', ').substring(0, 40)}`
          });
        }
        
        let componentsArray: any[] = [row];

        if (craftableCatalog.length === 0 && missingCatalog.length === 0) {
            newEmbed.addFields({ name: 'Available Blueprints', value: "*You haven't discovered any forging schematics for this category.*" });
        } else {
            const addCatalogToEmbed = (catalog: string, title: string) => {
                if (catalog.length === 0) return;
                const recipes = catalog.split('\n\n');
                let currentField = '';
                let firstField = true;
                for (let recipe of recipes) {
                    if (!recipe.trim()) continue;
                    if (currentField.length + recipe.length > 1000) {
                        newEmbed.addFields({ name: firstField ? title : '\u200B', value: currentField });
                        currentField = recipe + '\n\n';
                        firstField = false;
                    } else {
                        currentField += recipe + '\n\n';
                    }
                }
                if (currentField.trim()) {
                    newEmbed.addFields({ name: firstField ? title : '\u200B', value: currentField });
                }
            };

            if (craftableCatalog.length > 0) addCatalogToEmbed(craftableCatalog, '🟢 Ready to Craft');
            if (missingCatalog.length > 0) addCatalogToEmbed(missingCatalog, '🔴 Missing Materials');

            if (selectOptions.length === 0) {
                selectOptions.push({
                    label: 'No Craftable Blueprints',
                    value: 'empty_placeholder',
                    description: 'Gather more materials first!'
                });
            }

            if (selectOptions.length > 25) selectOptions = selectOptions.slice(0, 25);
            const selectMenu = new StringSelectMenuBuilder()
                .setCustomId(`forge_craft_${catUrl}`)
                .setPlaceholder('Select a Blueprint to Forge')
                .addOptions(selectOptions.map(opt => ({
                     label: opt.label,
                     value: opt.value,
                     description: opt.description
                })));
            const selectRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(selectMenu);
            componentsArray.push(selectRow);

            let pinOptions = [{ label: 'None (Unpin Tracker)', value: 'none', description: 'Remove the active blueprint tracker.' }, ...allOptions];
            if (pinOptions.length > 25) pinOptions = pinOptions.slice(0, 25);
            const pinMenu = new StringSelectMenuBuilder()
                .setCustomId(`forge_pin_${catUrl}`)
                .setPlaceholder('📌 Select a Blueprint to Pin & Track Goals')
                .addOptions(pinOptions.map(opt => ({
                     label: opt.label,
                     value: opt.value,
                     description: opt.description
                })));
            const pinRow = new ActionRowBuilder<StringSelectMenuBuilder>().addComponents(pinMenu);
            componentsArray.push(pinRow);
        }

        await interaction.update({ embeds: [newEmbed], components: componentsArray }).catch(console.error);
    });

    return;
  }

  return await processForge(args[0].toLowerCase(), player, inventory, message, false);
}

export async function processForge(recipeId: string, player: any, inventory: any, context: any, isInteraction: boolean = false) {
  const reply = async (content: any) => {
      if (isInteraction) {
          return await context.update({ ...content, components: [] }).catch(() => {});
      } else {
          return await context.reply(content).catch(() => {});
      }
  };

  const blueprint = BLUEPRINTS[recipeId];

  if (!blueprint) {
    return reply({ content: `That is not a valid Forge recipe. Known blueprints: \`bronze_sword\`, \`void_blade\`.`, embeds: [] });
  }

  // 1. Check if they have the Blueprint unlocked (if required)
  if (blueprint.requiredBlueprint) {
    const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
    if (!hasBlueprint || hasBlueprint.quantity < 1) {
      return reply({ content: `📜 You don't know how to forge a ${blueprint.name}! You need the \`${blueprint.requiredBlueprint}\` to craft this.`, embeds: [] });
    }
  }

  // 2. Check Materials
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    const invItem = inventory.find((i: any) => i.itemKey === matKey);
    // TypeScript safe-cast to number
    const qty = requiredQty as number;
    if (!invItem || invItem.quantity < qty) {
      return reply({ content: `❌ **Missing Materials!** You need **${qty}x ${matKey}**. You only have ${invItem ? invItem.quantity : 0}.`, embeds: [] });
    }
  }

  // 3. Consume Materials
  const dbOperations: any[] = [];
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    dbOperations.push(prisma.inventoryItem.update({
      where: { playerId_itemKey: { playerId: player.id, itemKey: matKey } },
      data: { quantity: { decrement: requiredQty as number } }
    }));
  }

  // 4. RNG Removed (Fixed Power Core)
  let resultOutput: any = null;
  
  if (blueprint.outputs.common) resultOutput = blueprint.outputs.common;
  else if (blueprint.outputs.uncommon) resultOutput = blueprint.outputs.uncommon;
  else if (blueprint.outputs.rare) resultOutput = blueprint.outputs.rare;
  else if (blueprint.outputs.epic) resultOutput = blueprint.outputs.epic;
  else if (blueprint.outputs.legendary) resultOutput = blueprint.outputs.legendary;
  else resultOutput = Object.values(blueprint.outputs)[0];

  if (!resultOutput) {
    return reply({ content: 'The forge erupted in a magical anomaly. The craft failed!', embeds: [] });
  }

  // 6. ADRENALINE AFFIX GENERATION
  let finalName = resultOutput.name; 
  let bAtk = 0;
  let bDef = 0;
  let bCrit = 0;
  let bLifesteal = 0;
  let bEvasion = 0;

  let statLog = '';

  if (resultOutput.dps) { // WEAPONS
      
      bAtk += resultOutput.dps;
      
      let r: any = resultOutput.rarity || 'COMMON';

      let eClass: any = 'ANY';
      const keyStr = resultOutput.key.toLowerCase();
      
      // Strict Hybrid Override Check First
      if (keyStr.includes('spellblade')) eClass = 'SPELLBLADE_WEAPON';
      else if (keyStr.includes('longbow')) eClass = 'HUNTER_WEAPON';
      else if (keyStr.includes('bulwark')) eClass = 'VANGUARD_WEAPON';
      
      // Standard Classes
      else if (keyStr.includes('sword') || keyStr.includes('axe') || keyStr.includes('cleaver') || keyStr.includes('blade') || keyStr.includes('mace') || keyStr.includes('club') || keyStr.includes('maul') || keyStr.includes('earthshaker') || keyStr.includes('slayer') || keyStr.includes('warhammer')) eClass = 'HEAVY_WEAPON';
      else if (keyStr.includes('dagger') || keyStr.includes('bow') || keyStr.includes('shiv') || keyStr.includes('rapier') || keyStr.includes('dirk') || keyStr.includes('fang') || keyStr.includes('stormcaller')) eClass = 'FINESSE_WEAPON';
      else if (keyStr.includes('staff') || keyStr.includes('wand') || keyStr.includes('tome') || keyStr.includes('grimoire') || keyStr.includes('event_horizon')) eClass = 'MAGIC_WEAPON';

      dbOperations.push(prisma.equipment.updateMany({
          where: { playerId: player.id, slot: 'WEAPON', equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.equipment.create({
          data: {
              playerId: player.id,
              baseItemKey: resultOutput.key,
              name: finalName,
              rarity: r,
              slot: 'WEAPON',
              equipmentClass: eClass,
              equipped: true,
              bonusAtk: bAtk,
              bonusDef: bDef,
              bonusCrit: bCrit,
              bonusLifesteal: bLifesteal,
              bonusEvasion: bEvasion
          }
      }));
      let statArray: string[] = [];
      statArray.push(`⚔️ **${bAtk}** ATK`);
      if (bCrit > 0) statArray.push(`🎯 **${bCrit}%** Crit`);
      if (bLifesteal > 0) statArray.push(`🦇 **${bLifesteal}%** Vampirism`);
      if (bEvasion > 0) statArray.push(`💨 **${bEvasion}%** Evasion`);
      statLog = statArray.join(' | ');
  } 
  else if (resultOutput.defense) { // ARMOR

      bDef += resultOutput.defense;
      
      let r: any = resultOutput.rarity || 'COMMON';

      let eClass: any = 'ANY';
      const keyStr = resultOutput.key.toLowerCase();
      if (keyStr.includes('plate') || keyStr.includes('mail') || keyStr.includes('shield')) eClass = 'HEAVY_ARMOR';
      else if (keyStr.includes('leather') || keyStr.includes('cloak') || keyStr.includes('tunic') || keyStr.includes('boots')) eClass = 'LIGHT_ARMOR';
      else if (keyStr.includes('robe') || keyStr.includes('mantle') || keyStr.includes('hood') || keyStr.includes('hat')) eClass = 'CLOTH';

      dbOperations.push(prisma.equipment.updateMany({
          where: { playerId: player.id, slot: 'ARMOR', equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.equipment.create({
          data: {
              playerId: player.id,
              baseItemKey: resultOutput.key,
              name: finalName,
              rarity: r,
              slot: 'ARMOR',
              equipmentClass: eClass,
              equipped: true,
              bonusAtk: bAtk,
              bonusDef: bDef,
              bonusCrit: bCrit,
              bonusLifesteal: bLifesteal,
              bonusEvasion: bEvasion
          }
      }));
      let statArray: string[] = [];
      statArray.push(`🛡️ **${bDef}** DEF`);
      if (bAtk > 0) statArray.push(`🦔 **${bAtk}** Thorns DMG`);
      if (bEvasion > 0) statArray.push(`💨 **${bEvasion}%** Evasion`);
      if (bCrit > 0) statArray.push(`🎯 **${bCrit}%** Crit`);
      if (bLifesteal > 0) statArray.push(`🦇 **${bLifesteal}%** Vampirism`);
      statLog = statArray.join(' | ');
  }
  else if (resultOutput.isTool) { // TOOLS
      let r: any = resultOutput.rarity || 'COMMON';

      dbOperations.push(prisma.tool.updateMany({
          where: { playerId: player.id, type: resultOutput.type, equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.tool.create({
          data: {
              playerId: player.id,
              type: resultOutput.type,
              name: finalName,
              rarity: r,
              equipped: true,
              yieldMultiplier: resultOutput.yieldMultiplier,
              ...( { activeAbilities: blueprint.abilities || [] } as any )
          }
      }));
      statLog = `⛏️ **${resultOutput.yieldMultiplier}x** Gathering Yield`;
  }

  await prisma.$transaction(dbOperations);

  let embedColor = 0xFFFFFF; // Common White
  if (resultOutput.key.includes('uncommon')) embedColor = 0x2ECC71; // Green
  else if (resultOutput.key.includes('rare')) embedColor = 0x3498DB; // Blue
  else if (resultOutput.key.includes('epic')) embedColor = 0x9B59B6; // Purple
  else if (resultOutput.key.includes('legendary')) embedColor = 0xF1C40F; // Gold

  let flavorTitle = "🔨 Forge Completed:";
  let flavorDesc = "*The Blacksmith's hammer rings out. Sparks fly as arcane energy fuses with the raw ore, violently cooling into its final form.*";

  if (recipeId.includes('leather') || recipeId.includes('tunic') || recipeId.includes('boots')) {
    flavorTitle = "🧵 Tailoring Completed:";
    flavorDesc = "*The artisan carefully stitches the protective materials, weaving resilient enchantments directly into the seams.*";
  } else if (recipeId.includes('robe') || recipeId.includes('mantle') || recipeId.includes('cloak')) {
    flavorTitle = "✨ Weaving Completed:";
    flavorDesc = "*Arcane threads spin rapidly on the loom. The fabric glows faintly as mystical energy is permanently bound within its folds.*";
  } else if (recipeId.includes('staff') || recipeId.includes('tome') || recipeId.includes('scythe')) {
    flavorTitle = "🔮 Enchantment Completed:";
    flavorDesc = "*The ancient conduit hums with power as the final runic inscription burns into existence in a flash of deep purple light.*";
  } else if (recipeId.includes('wood') || recipeId.includes('bow')) {
    flavorTitle = "🏹 Fletcher Completed:";
    flavorDesc = "*The craftsman flexes the timber, perfectly balancing the weapon's weight and tension before sealing it with enchanted sap.*";
  }

  let abilitySliceCount = 1;
  if (resultOutput.key.includes('uncommon')) abilitySliceCount = 2;
  if (resultOutput.key.includes('rare')) abilitySliceCount = 3;
  if (resultOutput.key.includes('epic')) abilitySliceCount = 4;
  if (resultOutput.key.includes('legendary')) abilitySliceCount = 5;

  let abilityLog = '';
  if (blueprint.abilities && blueprint.abilities.length > 0) {
      const activeAbils = blueprint.abilities.slice(0, abilitySliceCount);
      abilityLog = '\n\n**✧ Innate Abilities:**\n' + activeAbils.map((a: string) => {
          return `✧ \`${a}\``;
      }).join('\n');
  }

  const resultEmbed = new EmbedBuilder()
    .setTitle(`${flavorTitle} ${blueprint.name}`)
    .setColor(embedColor)
    .setDescription(`${flavorDesc}${abilityLog}`)
    .addFields({ name: '✨ Forged Output', value: `> ${getEmoji(recipeId)} **${finalName}**\n> ${statLog}` });

  return reply({ embeds: [resultEmbed] });
}
