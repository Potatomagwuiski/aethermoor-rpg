import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

// Define the blueprint requirements and outputs
export const BLUEPRINTS: Record<string, any> = {
  // --- WARRIOR ---
  'bronze_sword': {
    name: 'Bronze Sword', materials: { copper: 10, tin: 5, wood: 5 },
    abilities: [
      '✨ **Balanced**: +2% Hit Accuracy',
      '✨ **Sharpened**: +5% Base Damage',
      '🛡️ **Parry**: 5% chance to negate a physical attack',
      '⚔️ **Cleave**: Deals 10% splash damage to subsequent enemies',
      '🌟 **Heroic Legacy**: 5% chance to double all damage this round'
    ],
    outputs: {
      common: { key: 'common_bronze_sword', name: '⬜ [Common Bronze Sword]', dps: 15 },
      uncommon: { key: 'uncommon_bronze_sword', name: '🟩 [Uncommon Bronze Sword]', dps: 25 },
      rare: { key: 'rare_bronze_sword', name: '🟦 [Rare Bronze Sword]', dps: 40 },
      epic: { key: 'epic_bronze_sword', name: '🟪 [Epic Bronze Sword]', dps: 75 }
    }
  },
  'iron_greatsword': {
    name: 'Iron Greatsword', requiredBlueprint: 'blueprint_iron_greatsword', materials: { iron: 20, coal: 10, ashwood: 5, wolf_pelt: 5 },
    abilities: [
      '✨ **Hefty**: +2% Base Damage',
      '✨ **Heavy Strike**: +10% Damage on first turn',
      '🛡️ **Stalwart**: Grants 5 bonus DEF',
      '⚔️ **Execution**: +15% Damage against enemies below 30% HP',
      '🌟 **Earthquake**: 10% chance to stun enemy and deal 200% DMG'
    ],
    outputs: {
      common: { key: 'common_iron_greatsword', name: '⬜ [Common Iron Greatsword]', dps: 30 },
      uncommon: { key: 'uncommon_iron_greatsword', name: '🟩 [Uncommon Iron Greatsword]', dps: 60 },
      rare: { key: 'rare_iron_greatsword', name: '🟦 [Rare Iron Greatsword]', dps: 100 },
      epic: { key: 'epic_iron_greatsword', name: '🟪 [Epic Iron Greatsword]', dps: 160 }
    }
  },
  'wolf_slayer': {
    name: 'Wolf Slayer Sword', requiredBlueprint: 'blueprint_wolf_slayer', materials: { iron_ingot: 15, bone_shard: 20 },
    abilities: [
      '🐺 **Tracker**: +5% XP from Beasts',
      '✨ **Beastbane**: Deals +50% Damage to Beasts & Wolves',
      '🩸 **Bloodlust**: Heals for 5% of damage dealt',
      '💀 **Execute**: 10% chance to instantly kill monsters under 30% HP',
      '🌟 **Alpha Predator**: Grants +10% ALL Stats when fighting Beasts'
    ],
    outputs: { rare: { key: 'rare_wolf_slayer', name: '🟦 [Rare Wolf Slayer]', dps: 85 }, epic: { key: 'epic_wolf_slayer', name: '🟪 [Epic Wolf Slayer]', dps: 150 } }
  },
  'mythril_cleaver': {
    name: 'Mythril Cleaver', requiredBlueprint: 'blueprint_mythril_cleaver', materials: { mythril: 20, elderwood: 10, mythic_dragon_scale: 1 },
    abilities: [
      '✨ **Light Edge**: +5% Evasion',
      '✨ **Mythril Edge**: Ignores 10% of enemy DEF',
      '🩸 **Rend**: Applies a 20 DMG bleed each turn',
      '⚡ **Thunderous Blow**: 5% chance to stun enemy for 1 turn',
      '🌟 **Armor Breaker**: Permanently reduces enemy DEF to 0 on first hit'
    ],
    outputs: { rare: { key: 'rare_mythril_cleaver', name: '🟦 [Rare Mythril Cleaver]', dps: 250 }, epic: { key: 'epic_mythril_cleaver', name: '🟪 [Epic Mythril Cleaver]', dps: 400 } }
  },
  'void_blade': {
    name: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: { mythic_dragon_scale: 1, mythril: 10 },
    abilities: [
      '🌌 **Void Touched**: +5% Lifesteal',
      '✨ **Void Strike**: 15% chance to ignore 50% of monster DEF',
      '🌌 **Abyssal Echo**: 25% chance to attack a second time',
      '🌑 **Event Horizon**: 5% chance to instantly banish non-bosses',
      '🌟 **Singularity**: 10% chance to absorb all incoming damage and reflect it 3x'
    ],
    outputs: { rare: { key: 'rare_void_blade', name: '🟦 [Rare Void Blade]', dps: 100 }, epic: { key: 'epic_void_blade', name: '🟪 [Epic Void Blade]', dps: 200 }, legendary: { key: 'legendary_void_blade', name: '🟧 [✨ LEGENDARY VOID BLADE ✨]', dps: 500 } }
  },

  // --- ROGUE ---
  'bronze_dagger': {
    name: 'Bronze Dagger', materials: { copper: 5, tin: 5, wood: 2 },
    abilities: [
      '✨ **Concealed**: +2% Evasion',
      '✨ **Lightweight**: +5% Evasion',
      '🔪 **Backstab**: First attack deals +25% DMG',
      '🩸 **Serrated Edge**: Attacks apply a 5 DMG bleeding effect',
      '🌟 **Shadow Flurry**: 15% chance to attack 3 times in one turn'
    ],
    outputs: {
      common: { key: 'common_bronze_dagger', name: '⬜ [Common Bronze Dagger]', dps: 12 },
      uncommon: { key: 'uncommon_bronze_dagger', name: '🟩 [Uncommon Bronze Dagger]', dps: 20 },
      rare: { key: 'rare_bronze_dagger', name: '🟦 [Rare Bronze Dagger]', dps: 35 },
      epic: { key: 'epic_bronze_dagger', name: '🟪 [Epic Bronze Dagger]', dps: 60 }
    }
  },
  'venom_shiv': {
    name: 'Venom Shiv', requiredBlueprint: 'blueprint_venom_shiv', materials: { iron: 15, mooncap_mushroom: 10, wolf_fang: 5 },
    abilities: [
      '✨ **Toxin**: +5 Poison DMG per round',
      '✨ **Poison**: Deals 50 DMG every combat round',
      '💨 **Swiftness**: +15% Base Evasion',
      '☠️ **Lethal Dose**: Poison damage doubles when monster is below 50% HP',
      '🌟 **Plague**: Poison spreads, reducing Enemy ATK by 25%'
    ],
    outputs: { rare: { key: 'rare_venom_shiv', name: '🟦 [Rare Venom Shiv]', dps: 90 }, epic: { key: 'epic_venom_shiv', name: '🟪 [Epic Venom Shiv]', dps: 160 } }
  },
  'shadow_blade': {
    name: 'Shadow Blade', requiredBlueprint: 'blueprint_shadow_blade', materials: { mythril: 20, shadow_dust: 15, void_fragment: 2 },
    abilities: [
      '🌑 **Dim**: +5% Evasion in low light',
      '✨ **Assassinate**: 15% chance to execute non-bosses',
      '💨 **Phantom Strike**: +10% Base Evasion',
      '🔪 **Deep Wounds**: Deals 50 bleeding damage every round',
      '🌟 **True Death**: Execution threshold increased to 40% HP'
    ],
    outputs: { rare: { key: 'rare_shadow_blade', name: '🟦 [Rare Shadow Blade]', dps: 220 }, epic: { key: 'epic_shadow_blade', name: '🟪 [Epic Shadow Blade]', dps: 380 }, legendary: { key: 'legendary_shadow_blade', name: '🟧 [✨ LEGENDARY SHADOW BLADE ✨]', dps: 600 } }
  },

  // --- MAGE ---
  'wood_staff': {
    name: 'Wood Staff', materials: { wood: 15, copper: 5 },
    abilities: [
      '✨ **Attuned**: +5 Max Mana',
      '✨ **Focus**: +5% Critical Hit Chance',
      '💧 **Mana Tap**: Restores 2 Energy per hit',
      '🔥 **Ember**: 5% chance to cast a 25 DMG fireball on attack',
      '🌟 **Arcane Overflow**: 10% chance to cast Ember 5 times instantly'
    ],
    outputs: {
      common: { key: 'common_wood_staff', name: '⬜ [Common Wood Staff]', dps: 15 },
      uncommon: { key: 'uncommon_wood_staff', name: '🟩 [Uncommon Wood Staff]', dps: 25 },
      rare: { key: 'rare_wood_staff', name: '🟦 [Rare Wood Staff]', dps: 45 },
      epic: { key: 'epic_wood_staff', name: '🟪 [Epic Wood Staff]', dps: 80 }
    }
  },
  'moonlight_staff': {
    name: 'Moonlight Staff', requiredBlueprint: 'blueprint_moonlight_staff', materials: { ashwood: 15, moon_herb: 5, living_wood: 2 },
    abilities: [
      '🌙 **Glimmer**: +5 Max HP',
      '✨ **Lunar Glow**: +10% Evasion at Night',
      '💧 **Serenity**: Heals 10 HP per combat round',
      '🌙 **Eclipse**: 10% chance to blind the enemy, halving their accuracy',
      '🌟 **Full Moon**: 100% Critical Hit chance on the first 3 turns'
    ],
    outputs: { rare: { key: 'rare_moonlight_staff', name: '🟦 [Rare Moonlight Staff]', dps: 120 }, epic: { key: 'epic_moonlight_staff', name: '🟪 [Epic Moonlight Staff]', dps: 210 } }
  },
  'meteor_staff': {
    name: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { elderwood: 20, mythic_dragon_scale: 1, rare_meteorite_ingot: 1 },
    abilities: [
      '🔥 **Warmth**: Immune to Freeze',
      '✨ **Meteor**: 10% chance to cast a massive 1500 DMG AoE',
      '🔥 **Ignite**: Burns monster for 100 DMG per round',
      '🌋 **Apocalypse**: Meteor chance increases to 30% against Bosses',
      '🌟 **Armageddon**: Meteor now deals 5000 DMG and hits twice'
    ],
    outputs: { rare: { key: 'rare_meteor_staff', name: '🟦 [Rare Meteor Staff]', dps: 300 }, epic: { key: 'epic_meteor_staff', name: '🟪 [Epic Meteor Staff]', dps: 500 }, legendary: { key: 'legendary_meteor_staff', name: '🟧 [✨ LEGENDARY METEOR STAFF ✨]', dps: 800 } }
  },

  // --- NECROMANCER ---
  'bronze_scythe': {
    name: 'Bronze Scythe', materials: { copper: 10, tin: 5, wood: 5 },
    abilities: [
      '🌾 **Reaper**: +2% Base Damage',
      '✨ **Harvest**: +5% bonus Gold on kills',
      '💀 **Soul Siphon**: Heals 2 HP upon killing an enemy',
      '👻 **Spectral Edge**: Attacks ignore 5% of target DEF',
      '🌟 **Grim Memento**: +50% XP from Undead'
    ],
    outputs: {
      common: { key: 'common_bronze_scythe', name: '⬜ [Common Bronze Scythe]', dps: 20 },
      uncommon: { key: 'uncommon_bronze_scythe', name: '🟩 [Uncommon Bronze Scythe]', dps: 35 },
      rare: { key: 'rare_bronze_scythe', name: '🟦 [Rare Bronze Scythe]', dps: 60 },
      epic: { key: 'epic_bronze_scythe', name: '🟪 [Epic Bronze Scythe]', dps: 110 }
    }
  },
  'bone_scythe': {
    name: 'Legacy Bone Scythe',
    outputs: { common: { key: 'common_bone_scythe', name: '⬜ [Common Bone Scythe]', dps: 20 } }
  },
  'soul_reaper': {
    name: 'Soul Reaper', requiredBlueprint: 'blueprint_soul_reaper', materials: { iron: 15, coal: 5, wolf_pelt: 10 },
    abilities: [
      '👻 **Ethereal**: +5% Evasion against physical attacks',
      '✨ **Reap**: Heals for 10% of damage dealt',
      '💀 **Grave Digger**: +25% DMG against Undead',
      '👻 **Soul Rend**: Permanent +1 ATK for every fight won with this weapon',
      '🌟 **Spirit Bind**: 20% chance to tame enemy into a pet'
    ],
    outputs: { rare: { key: 'rare_soul_reaper', name: '🟦 [Rare Soul Reaper]', dps: 150 }, epic: { key: 'epic_soul_reaper', name: '🟪 [Epic Soul Reaper]', dps: 260 } }
  },
  'lich_tome': {
    name: 'Lich Tome', requiredBlueprint: 'blueprint_lich_tome', materials: { elderwood: 10, mythril: 10, shadow_dust: 20, void_fragment: 2 },
    abilities: [
      '💀 **Dark Whisper**: +5 INT',
      '✨ **Soul Siphon**: Converts 15% of damage dealt into healing',
      '🛡️ **Bone Armor**: Converts 50% of INT into DEF',
      '💀 **Phylactery**: Revive exactly once per battle with 50% HP',
      '🌟 **Deathless King**: Revive with 100% HP and double damage'
    ],
    outputs: { rare: { key: 'rare_lich_tome', name: '🟦 [Rare Lich Tome]', dps: 350 }, epic: { key: 'epic_lich_tome', name: '🟪 [Epic Lich Tome]', dps: 600 }, legendary: { key: 'legendary_lich_tome', name: '🟧 [✨ LEGENDARY LICH TOME ✨]', dps: 1000 } }
  },

  // --- HEAVY ARMOR (WARRIORS) ---
  'bronze_helmet': {
    name: 'Bronze Helmet', materials: { copper: 15, tin: 5 },
    abilities: [
      '✨ **Fitted**: +5 Max HP',
      '✨ **Sturdy**: Reduces physical damage taken by 1%',
      '🛡️ **Deflection**: 2% chance to block 50% damage',
      '🤕 **Hardheaded**: Immune to stun effects',
      '🌟 **Juggernaut**: 10% chance to reflect all damage back to the attacker'
    ],
    outputs: { common: { key: 'common_bronze_helmet', name: '⬜ [Common Bronze Helmet]', defense: 5 }, uncommon: { key: 'uncommon_bronze_helmet', name: '🟩 [Uncommon Bronze Helmet]', defense: 10 }, rare: { key: 'rare_bronze_helmet', name: '🟦 [Rare Bronze Helmet]', defense: 20 }, epic: { key: 'epic_bronze_helmet', name: '🟪 [Epic Bronze Helmet]', defense: 40 } }
  },
  'bronze_chestplate': {
    name: 'Bronze Chestplate', materials: { copper: 20, tin: 10 },
    abilities: [
      '✨ **Reinforced**: +1 DEF',
      '✨ **Plated**: Reduces physical damage taken by 2%',
      '🧱 **Bastion**: +5% Max HP',
      '🔥 **Heat Resistance**: -10% damage from Magical Fire',
      '🌟 **Bulwark**: 5% chance to reduce incoming damage to 0'
    ],
    outputs: { common: { key: 'common_bronze_chestplate', name: '⬜ [Common Bronze Chestplate]', defense: 10 }, uncommon: { key: 'uncommon_bronze_chestplate', name: '🟩 [Uncommon Bronze Chestplate]', defense: 20 }, rare: { key: 'rare_bronze_chestplate', name: '🟦 [Rare Bronze Chestplate]', defense: 40 }, epic: { key: 'epic_bronze_chestplate', name: '🟪 [Epic Bronze Chestplate]', defense: 80 } }
  },
  'iron_chestplate': {
    name: 'Iron Chestplate', requiredBlueprint: 'blueprint_iron_chestplate', materials: { iron: 25, coal: 15 },
    abilities: [
      '✨ **Layered**: +2 DEF',
      '✨ **Hardened**: Reduces physical damage taken by 3%',
      '🛡️ **Vanguard**: +20 Max HP',
      '🤕 **Iron Will**: Grants immunity to bleeding effects',
      '🌟 **Unbreakable**: Gain 50 DEF when below 25% HP'
    ],
    outputs: { common: { key: 'common_iron_chestplate', name: '⬜ [Common Iron Chestplate]', defense: 25 }, uncommon: { key: 'uncommon_iron_chestplate', name: '🟩 [Uncommon Iron Chestplate]', defense: 45 }, rare: { key: 'rare_iron_chestplate', name: '🟦 [Rare Iron Chestplate]', defense: 80 }, epic: { key: 'epic_iron_chestplate', name: '🟪 [Epic Iron Chestplate]', defense: 150 } }
  },
  'steel_chestplate': {
    name: 'Steel Chestplate', requiredBlueprint: 'blueprint_steel_chestplate', materials: { mythril: 20, coal: 10, elderwood: 10 },
    abilities: [
      '✨ **Polished**: +5 DEF',
      '✨ **Alloyed Armor**: Reduces physical damage taken by 5%',
      '🔥 **Fireproof**: Immune to burn effects',
      '⚡ **Reflective Coating**: Reflects 5% of melee damage back to the attacker',
      '🌟 **Steel Resolve**: Immune to all debuffs and +20% Max HP'
    ],
    outputs: { common: { key: 'common_steel_chestplate', name: '⬜ [Common Steel Chestplate]', defense: 65 }, uncommon: { key: 'uncommon_steel_chestplate', name: '🟩 [Uncommon Steel Chestplate]', defense: 120 }, rare: { key: 'rare_steel_chestplate', name: '🟦 [Rare Steel Chestplate]', defense: 240 }, epic: { key: 'epic_steel_chestplate', name: '🟪 [Epic Steel Chestplate]', defense: 450 } }
  },
  'bronze_boots': {
    name: 'Bronze Boots', materials: { copper: 10, tin: 5 },
    abilities: [
      '✨ **Comfortable**: +1% Evasion',
      '✨ **March**: +2% Evasion',
      '🏃 **Agility**: +1 Base ATK due to faster speed',
      '💨 **Fleetfoot**: Pre-emptively strikes the enemy for 5 DMG at combat start',
      '🌟 **Windrunner**: 100% chance to act first, even against Bosses'
    ],
    outputs: { common: { key: 'common_bronze_boots', name: '⬜ [Common Bronze Boots]', defense: 4 }, uncommon: { key: 'uncommon_bronze_boots', name: '🟩 [Uncommon Bronze Boots]', defense: 8 }, rare: { key: 'rare_bronze_boots', name: '🟦 [Rare Bronze Boots]', defense: 16 }, epic: { key: 'epic_bronze_boots', name: '🟪 [Epic Bronze Boots]', defense: 32 } }
  },

  // --- CLOTH ARMOR (MAGES) ---
  'apprentice_robe': {
    name: 'Apprentice Robe', materials: { wood: 15, basic_herb: 5, bat_wing: 2 },
    abilities: [
      '✨ **Light Fabric**: +1 Max Mana',
      '✨ **Mana Shield**: Reduces incoming damage by 10%',
      '💧 **Clear Mind**: +5% Energy Regen per round',
      '🔮 **Arcane Focus**: Spells cost 10% less Mana',
      '🌟 **Archmage**: Spells have a 10% chance to cost 0 Mana'
    ],
    outputs: { common: { key: 'common_apprentice_robe', name: '⬜ [Common Apprentice Robe]', defense: 4 }, uncommon: { key: 'uncommon_apprentice_robe', name: '🟩 [Uncommon Apprentice Robe]', defense: 8 }, rare: { key: 'rare_apprentice_robe', name: '🟦 [Rare Apprentice Robe]', defense: 16 }, epic: { key: 'epic_apprentice_robe', name: '🟪 [Epic Apprentice Robe]', defense: 32 } }
  },
  'mystic_robe': {
    name: 'Mystic Robe', requiredBlueprint: 'blueprint_mystic_robe', materials: { iron: 15, moon_herb: 10, slime_core: 5 },
    abilities: [
      '✨ **Woven Magic**: +5 Max Mana',
      '✨ **Arcane Recovery**: Heals 5% Max HP after combat',
      '💫 **Mystic Ward**: Blocks 50 incoming Magic Damage',
      '🌙 **Lunar Blessing**: +20% ALL Stats during Nightime Cycles',
      '🌟 **Invulnerability**: The first attack received each combat deals 0 DMG'
    ],
    outputs: { common: { key: 'common_mystic_robe', name: '⬜ [Common Mystic Robe]', defense: 12 }, uncommon: { key: 'uncommon_mystic_robe', name: '🟩 [Uncommon Mystic Robe]', defense: 22 }, rare: { key: 'rare_mystic_robe', name: '🟦 [Rare Mystic Robe]', defense: 40 }, epic: { key: 'epic_mystic_robe', name: '🟪 [Epic Mystic Robe]', defense: 75 } }
  },
  'lich_mantle': {
    name: 'Lich Mantle', requiredBlueprint: 'blueprint_lich_mantle', materials: { mythril: 15, shadow_dust: 20, void_fragment: 2 },
    abilities: [
      '💀 **Dread**: Enemies have -1% Hit Chance',
      '✨ **Undying**: 5% chance to revive with 1 HP on death',
      '💀 **Grave Chill**: Monsters attacking you lose 5% ATK',
      '👑 **Lich King**: Undead monsters will occasionally flee instead of fighting',
      '🌟 **Lord of Death**: Summons a skeletal minion to absorb 100 DMG each combat'
    ],
    outputs: { common: { key: 'common_lich_mantle', name: '⬜ [Common Lich Mantle]', defense: 45 }, uncommon: { key: 'uncommon_lich_mantle', name: '🟩 [Uncommon Lich Mantle]', defense: 85 }, rare: { key: 'rare_lich_mantle', name: '🟦 [Rare Lich Mantle]', defense: 160 }, epic: { key: 'epic_lich_mantle', name: '🟪 [Epic Lich Mantle]', defense: 300 } }
  },

  // --- LIGHT ARMOR (ROGUES) ---
  'leather_tunic': {
    name: 'Leather Tunic', materials: { copper: 10, wood: 10, bat_wing: 2 },
    abilities: [
      '✨ **Snug**: +1% Dodge Chance',
      '✨ **Evasion**: +5% Dodge Chance',
      '💨 **Swiftness**: +5% Dodge Chance',
      '🗡️ **Assassin**: +10% DMG when using Daggers or Shivs',
      '🌟 **Ghost**: Evasion cap increased by 15%'
    ],
    outputs: { common: { key: 'common_leather_tunic', name: '⬜ [Common Leather Tunic]', defense: 8 }, uncommon: { key: 'uncommon_leather_tunic', name: '🟩 [Uncommon Leather Tunic]', defense: 16 }, rare: { key: 'rare_leather_tunic', name: '🟦 [Rare Leather Tunic]', defense: 32 }, epic: { key: 'epic_leather_tunic', name: '🟪 [Epic Leather Tunic]', defense: 60 } }
  },
  'scout_cloak': {
    name: 'Scout Cloak', requiredBlueprint: 'blueprint_scout_cloak', materials: { iron: 20, ashwood: 10, wolf_pelt: 10 },
    abilities: [
      '✨ **Camouflage**: +2% Dodge Chance',
      '✨ **Shadow Step**: 100% Dodge First Attack',
      '🐺 **Lone Wolf**: +15% ALL Stats if fighting without a pet',
      '🗡️ **Ambush**: First attack always lands as a Critical Hit',
      '🌟 **Unseen Predator**: Stealth cannot be broken on the first attack'
    ],
    outputs: { common: { key: 'common_scout_cloak', name: '⬜ [Common Scout Cloak]', defense: 18 }, uncommon: { key: 'uncommon_scout_cloak', name: '🟩 [Uncommon Scout Cloak]', defense: 35 }, rare: { key: 'rare_scout_cloak', name: '🟦 [Rare Scout Cloak]', defense: 65 }, epic: { key: 'epic_scout_cloak', name: '🟪 [Epic Scout Cloak]', defense: 120 } }
  },
  'shadow_tunic': {
    name: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: { mythril: 15, shadow_dust: 15, void_fragment: 2 },
    abilities: [
      '🌑 **Dark Dye**: +3% Evasion at Night',
      '✨ **Smoke Bomb**: 15% chance to completely negate an attack',
      '🌑 **Veil of Night**: Converts 20% of Evasion into bonus DEF',
      '🥷 **Executioner Form**: Double damage when hitting from Stealth',
      '🌟 **Shadow Realm**: 5% chance to dodge ALL attacks for 1 round'
    ],
    outputs: { common: { key: 'common_shadow_tunic', name: '⬜ [Common Shadow Tunic]', defense: 60 }, uncommon: { key: 'uncommon_shadow_tunic', name: '🟩 [Uncommon Shadow Tunic]', defense: 110 }, rare: { key: 'rare_shadow_tunic', name: '🟦 [Rare Shadow Tunic]', defense: 220 }, epic: { key: 'epic_shadow_tunic', name: '🟪 [Epic Shadow Tunic]', defense: 400 } }
  },
  // --- TOOLS ---
  'bronze_pickaxe': {
    name: 'Bronze Pickaxe', materials: { copper: 15, wood: 10 },
    abilities: [
      '⛏️ **Prospect**: 5% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Hardened Tip**: Mining never takes durability damage',
      '🪨 **Earth Sense**: 10% chance to find hidden gems',
      '🌟 **Mother Lode**: 1% chance to yield 50x ore'
    ],
    outputs: { common: { key: 'common_bronze_pickaxe', name: '⬜ [Common Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_bronze_pickaxe', name: '🟩 [Uncommon Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_bronze_pickaxe', name: '🟦 [Rare Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'iron_pickaxe': {
    name: 'Iron Pickaxe', requiredBlueprint: 'blueprint_iron_pickaxe', materials: { iron: 20, coal: 10, ashwood: 10 },
    abilities: [
      '⛏️ **Heavy Swing**: 10% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Prospector**: 15% chance to guarantee an Epic Ore drop',
      '🪨 **Deep Strike**: 5% chance for quadruple yield',
      '🌟 **Core Drill**: 2% chance to yield 100x ore'
    ],
    outputs: { common: { key: 'common_iron_pickaxe', name: '⬜ [Common Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_iron_pickaxe', name: '🟩 [Uncommon Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_iron_pickaxe', name: '🟦 [Rare Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
  },
  'mythril_pickaxe': {
    name: 'Mythril Pickaxe', requiredBlueprint: 'blueprint_mythril_pickaxe', materials: { mythril: 30, elderwood: 20 },
    abilities: [
      '⛏️ **Pristine Swing**: 15% chance for double ore',
      '⛏️ **Miner**: +1 Base Yield',
      '💎 **Prospector**: 15% chance to guarantee an Epic Ore drop',
      '🌟 **Overload**: 5% chance to 10x all gathered resources',
      '🌟 **Planet Cracker**: 5% chance to yield 500x ore instantly'
    ],
    outputs: { common: { key: 'common_mythril_pickaxe', name: '⬜ [Common Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 3.5 }, uncommon: { key: 'uncommon_mythril_pickaxe', name: '🟩 [Uncommon Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 5.0 }, rare: { key: 'rare_mythril_pickaxe', name: '🟦 [Rare Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 8.0 } }
  },
  'bronze_axe': {
    name: 'Bronze Axe', materials: { copper: 10, wood: 15 },
    abilities: [
      '🪓 **Chop**: 5% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Sharp Blade**: Chopping never takes durability damage',
      '🍃 **Natures Bounty**: 10% chance to find hidden seeds',
      '🌟 **Timber!**: 1% chance to yield 50x wood'
    ],
    outputs: { common: { key: 'common_bronze_axe', name: '⬜ [Common Bronze Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_bronze_axe', name: '🟩 [Uncommon Bronze Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_bronze_axe', name: '🟦 [Rare Bronze Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'iron_axe': {
    name: 'Iron Axe', requiredBlueprint: 'blueprint_iron_axe', materials: { iron: 15, coal: 15, ashwood: 15 },
    abilities: [
      '🪓 **Heavy Chop**: 10% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Arborist**: 15% chance to guarantee an Epic Wood drop',
      '🍃 **Clearcut**: 5% chance for quadruple yield',
      '🌟 **Deforestation**: 2% chance to yield 100x wood'
    ],
    outputs: { common: { key: 'common_iron_axe', name: '⬜ [Common Iron Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_iron_axe', name: '🟩 [Uncommon Iron Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_iron_axe', name: '🟦 [Rare Iron Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
  },
  'mythril_axe': {
    name: 'Mythril Axe', requiredBlueprint: 'blueprint_mythril_axe', materials: { mythril: 20, elderwood: 30 },
    abilities: [
      '🪓 **Pristine Chop**: 15% chance for double wood',
      '🪓 **Lumberjack**: +1 Base Yield',
      '🌳 **Arborist**: 15% chance to guarantee an Epic Wood drop',
      '🌟 **Overload**: 5% chance to 10x all gathered resources',
      '🌟 **World Tree Bane**: 5% chance to yield 500x wood instantly'
    ],
    outputs: { common: { key: 'common_mythril_axe', name: '⬜ [Common Mythril Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 3.5 }, uncommon: { key: 'uncommon_mythril_axe', name: '🟩 [Uncommon Mythril Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 5.0 }, rare: { key: 'rare_mythril_axe', name: '🟦 [Rare Mythril Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 8.0 } }
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

  if (args.length === 0) {
    const menuEmbed = new EmbedBuilder()
      .setTitle('🔨 The Forge')
      .setColor(0xE67E22)
      .setDescription('Welcome to the Blacksmith. Type `rpg forge <item>` to craft an item. **Warriors receive a flat +20 bonus to their RNG quality roll.**');
      
    let craftableCatalog = '';
    let missingCatalog = '';

    for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
      if (!blueprint.materials) continue; // Shield the iterator from legacy dummy blueprints
      
      if (blueprint.requiredBlueprint) {
        const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
        if (!hasBlueprint || hasBlueprint.quantity < 1) {
            continue; // Permanently shield undiscovered recipes
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
      
      let abilityString = '';
      if (blueprint.abilities && blueprint.abilities.length > 0) {
          abilityString = `\n🎁 **Rarity Unlocks:**\n`;
          if (blueprint.abilities[0]) abilityString += `⬜ \`${blueprint.abilities[0]}\`\n`;
          if (blueprint.abilities[1]) abilityString += `🟩 \`${blueprint.abilities[1]}\`\n`;
          if (blueprint.abilities[2]) abilityString += `🟦 \`${blueprint.abilities[2]}\`\n`;
          if (blueprint.abilities[3]) abilityString += `🟪 \`${blueprint.abilities[3]}\`\n`;
          if (blueprint.abilities[4]) abilityString += `🟧 \`${blueprint.abilities[4]}\`\n`;
      }

      const outputStr = `**${blueprint.name}** (\`${key}\`)\n${statString}${abilityString}\n${reqHeader} \n🧱 **Materials:** ${matString}\n\n`;
      
      if (isCraftable) {
          craftableCatalog += outputStr;
      } else {
          missingCatalog += outputStr;
      }
    }
    
    if (craftableCatalog.length === 0 && missingCatalog.length === 0) {
        menuEmbed.addFields({ name: 'Available Blueprints', value: "*You haven't discovered any forging schematics yet. Battle monsters in the wild or explore dungeons to find Blueprints.*" });
    } else {
        const addCatalogToEmbed = (catalog: string, title: string) => {
            if (catalog.length === 0) return;
            const recipes = catalog.split('\n\n');
            let currentField = '';
            let firstField = true;
            for (let recipe of recipes) {
                if (!recipe.trim()) continue;
                if (currentField.length + recipe.length > 1000) {
                    menuEmbed.addFields({ name: firstField ? title : '\u200B', value: currentField });
                    currentField = recipe + '\n\n';
                    firstField = false;
                } else {
                    currentField += recipe + '\n\n';
                }
            }
            if (currentField.trim()) {
                menuEmbed.addFields({ name: firstField ? title : '\u200B', value: currentField });
            }
        };

        if (craftableCatalog.length > 0) addCatalogToEmbed(craftableCatalog, '🟢 Ready to Craft');
        if (missingCatalog.length > 0) addCatalogToEmbed(missingCatalog, '🔴 Missing Materials');
    }
    return message.reply({ embeds: [menuEmbed] });
  }

  const recipeId = args[0].toLowerCase();
  const blueprint = BLUEPRINTS[recipeId];

  if (!blueprint) {
    return message.reply(`That is not a valid Forge recipe. Known blueprints: \`bronze_sword\`, \`void_blade\`.`);
  }

  // 1. Check if they have the Blueprint unlocked (if required)
  if (blueprint.requiredBlueprint) {
    const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
    if (!hasBlueprint || hasBlueprint.quantity < 1) {
      return message.reply(`📜 You don't know how to forge a ${blueprint.name}! You need the \`${blueprint.requiredBlueprint}\` to craft this.`);
    }
  }

  // 2. Check Materials
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    const invItem = inventory.find((i: any) => i.itemKey === matKey);
    // TypeScript safe-cast to number
    const qty = requiredQty as number;
    if (!invItem || invItem.quantity < qty) {
      return message.reply(`❌ **Missing Materials!** You need **${qty}x ${matKey}**. You only have ${invItem ? invItem.quantity : 0}.`);
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

  // 4. RNG Roll for Quality
  // Base 1-100 roll
  let roll = Math.floor(Math.random() * 100) + 1;
  let logAddition = '';

  // 5. Determine Result Based on Blueprint Tiers
  let resultOutput: any = null;

  if (blueprint.outputs.legendary && roll >= 115) resultOutput = blueprint.outputs.legendary;
  else if (blueprint.outputs.epic && roll >= 95) resultOutput = blueprint.outputs.epic;
  else if (blueprint.outputs.rare && roll >= 75) resultOutput = blueprint.outputs.rare;
  else if (blueprint.outputs.uncommon && roll >= 40) resultOutput = blueprint.outputs.uncommon;
  else if (blueprint.outputs.common) resultOutput = blueprint.outputs.common;
  else {
      // Fallback for recipes that only have rare+ (e.g. wolf slayer, moonlight staff)
      resultOutput = blueprint.outputs.rare || blueprint.outputs.epic || Object.values(blueprint.outputs)[0];
  }

  // Fallback safety
  if (!resultOutput) {
    return message.reply('The forge erupted in a magical anomaly. The craft failed!');
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
      const prefixes = [
        { name: 'Savage', stat: 'Atk', val: Math.floor(resultOutput.dps * 0.15) || 1 },
        { name: 'Vampiric', stat: 'Lifesteal', val: 5 },
        { name: 'Toxic', stat: 'Crit', val: 10 },
        { name: 'Swift', stat: 'Evasion', val: 5 }
      ];
      const suffixes = [
        { name: 'of the Blood God', stat: 'Lifesteal', val: 10 },
        { name: 'of the Void', stat: 'Crit', val: 15 },
        { name: 'of the Titan', stat: 'Atk', val: Math.floor(resultOutput.dps * 0.25) || 2 },
        { name: 'of the Wind', stat: 'Evasion', val: 10 }
      ];

      // 50% chance for a prefix
      if (Math.random() > 0.5) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        finalName = finalName.replace('[', `[${p.name} `);
        if (p.stat === 'Atk') bAtk += p.val;
        if (p.stat === 'Lifesteal') bLifesteal += p.val;
        if (p.stat === 'Crit') bCrit += p.val;
        if (p.stat === 'Evasion') bEvasion += p.val;
      }
      
      // 30% chance for a suffix
      if (Math.random() > 0.7) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        finalName = finalName.replace(']', ` ${s.name}]`);
        if (s.stat === 'Atk') bAtk += s.val;
        if (s.stat === 'Lifesteal') bLifesteal += s.val;
        if (s.stat === 'Crit') bCrit += s.val;
        if (s.stat === 'Evasion') bEvasion += s.val;
      }
      
      bAtk += resultOutput.dps;
      
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

      let eClass: any = 'ANY';
      const keyStr = resultOutput.key.toLowerCase();
      if (keyStr.includes('sword') || keyStr.includes('axe') || keyStr.includes('cleaver') || keyStr.includes('blade') || keyStr.includes('mace')) eClass = 'HEAVY_WEAPON';
      else if (keyStr.includes('dagger') || keyStr.includes('bow') || keyStr.includes('shiv') || keyStr.includes('rapier')) eClass = 'FINESSE_WEAPON';
      else if (keyStr.includes('staff') || keyStr.includes('wand') || keyStr.includes('tome') || keyStr.includes('grimoire')) eClass = 'MAGIC_WEAPON';

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
      const prefixes = [
        { name: 'Impenetrable', stat: 'Def', val: Math.floor(resultOutput.defense * 0.2) || 1 },
        { name: 'Spiked', stat: 'Atk', val: Math.floor(resultOutput.defense * 0.1) || 1 },
        { name: 'Nimble', stat: 'Evasion', val: 5 }
      ];
      const suffixes = [
        { name: 'of the Bastion', stat: 'Def', val: Math.floor(resultOutput.defense * 0.3) || 2 },
        { name: 'of Thorns', stat: 'Atk', val: Math.floor(resultOutput.defense * 0.15) || 1 }
      ];

      if (Math.random() > 0.5) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        finalName = finalName.replace('[', `[${p.name} `);
        if (p.stat === 'Def') bDef += p.val;
        if (p.stat === 'Atk') bAtk += p.val;
        if (p.stat === 'Evasion') bEvasion += p.val;
      }
      if (Math.random() > 0.7) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        finalName = finalName.replace(']', ` ${s.name}]`);
        if (s.stat === 'Def') bDef += s.val;
        if (s.stat === 'Atk') bAtk += s.val;
      }

      bDef += resultOutput.defense;
      
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

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
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

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
      abilityLog = '\n\n**✧ Awakened Abilities:**\n' + activeAbils.map((a: string, i: number) => {
          let rarityPrefix = '⬜';
          if (i === 1) rarityPrefix = '🟩';
          if (i === 2) rarityPrefix = '🟦';
          if (i === 3) rarityPrefix = '🟪';
          if (i === 4) rarityPrefix = '🟧';
          return `${rarityPrefix} \`${a}\``;
      }).join('\n');
  }

  const resultEmbed = new EmbedBuilder()
    .setTitle(`${flavorTitle} ${blueprint.name}`)
    .setColor(embedColor)
    .setDescription(`${flavorDesc}\n\n🎲 **Forging Roll:** \`${roll} / 100\`\n${logAddition}${abilityLog}`)
    .addFields({ name: '✨ Forged Output', value: `> ${getEmoji(recipeId)} **${finalName}**\n> ${statLog}` });

  return message.reply({ embeds: [resultEmbed] });
}
