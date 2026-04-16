import { prisma } from '../db';

export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const WEAPONS = [
  'Dagger', 'Greatsword', 'Wand', 'Warhammer', 
  'Spear', 'Scythe', 'Bow', 'Spellblade'
];
const OFFHANDS = ['Shield', 'Buckler', 'Tome', 'Orb'];

const HELMETS = ['Leather Cap', 'Iron Helm', 'Steel Visor', 'Silk Cowl'];
const CHESTS = ['Leather Tunic', 'Iron Cuirass', 'Steel Plate', 'Silk Robe'];
const GLOVES = ['Leather Gloves', 'Iron Gauntlets', 'Steel Vambraces', 'Silk Wraps'];
const BOOTS = ['Leather Boots', 'Iron Sabatons', 'Steel Greaves', 'Silk Shoes'];
const CLOAKS = ['Tattered Cloak', 'Travelers Cape', 'Silk Mantle', 'Shadow Cloak'];
const RINGS = ['Iron Ring', 'Ruby Ring', 'Sapphire Ring', 'Gold Band'];
const AMULETS = ['Pendant', 'Ruby Amulet', 'Sapphire Amulet', 'Talisman'];

const SLOTS = ['Weapon', 'OffHand', 'Helmet', 'Chest', 'Gloves', 'Boots', 'Cloak', 'Ring', 'Amulet'];

const PASSIVE_POOLS: Record<string, string[]> = {
  // WEAPONS
  'Dagger': ['Flurry', 'Toxic Burst', 'Toxic Scales', 'Venom Strike', 'Backstab'],
  'Greatsword': ['Execution', 'Cleave', 'Sunder', 'Crushing Blow', 'Sweeping Edge'],
  'Wand': ['Ignite', 'Frostbite', 'Arc Burst', 'Mana Surge', 'Elemental Penetration'],
  'Warhammer': ['Sunder', 'Staggering Blow', 'Armor Break', 'Earthshatter'],
  'Spear': ['Armor Pierce', 'First Strike', 'Lunge', 'Vengeance'],
  'Scythe': ['Vampiric Drain', 'Soul Siphon', 'Death Knell', 'Reaper'],
  'Bow': ['First Strike', 'Piercing Shot', 'Volley', 'Hunter Mark'],
  'Spellblade': ['Dual Strike', 'Ignite', 'Arc Burst', 'Frostbite'],
  
  // OFFHANDS
  'Shield': ['Shield Bash', 'Fortify', 'Deflect', 'Vanguard'],
  'Buckler': ['Parry', 'Riposte', 'Deflect'],
  'Tome': ['Mana Shield', 'Mind Clear', 'Overcharge'],
  'Orb': ['Mana Shield', 'Overcharge', 'Frostbite'],
  
  // ARMORS & ACCESSORIES (Mapped by Slot implicitly if SubType fails)
  'Helmet': ['Thorn Helm', 'Mind Clear', 'Aura: Fear'],
  'Chest': ['Thorns', 'Iron Skin', 'Vanguard', 'Stalwart'],
  'Gloves': ['Quick Hands', 'Deflect', 'Crushing Grip'],
  'Boots': ['Agility', 'Fleet Footed', 'Evasive Maneuver'],
  'Cloak': ['Shadow Veil', 'Aura: Fear', 'Evasive Maneuver'],
  'Ring': ['Mana Regen', 'Luck', 'Wealth'],
  'Amulet': ['Mana Regen', 'Aura: Fear', 'Luck']
};

export async function rollLootDrop(playerLevel: number, playerId: string) {
  if (Math.random() < 0.3) return null;

  const r = Math.random();
  let rarity = 'Common';
  let modCount = 1;

  if (r > 0.98) { rarity = 'Legendary'; modCount = 4; }
  else if (r > 0.90) { rarity = 'Epic'; modCount = 3; }
  else if (r > 0.70) { rarity = 'Rare'; modCount = 2; }
  else if (r > 0.40) { rarity = 'Uncommon'; modCount = 1; }

  const slotIndex = getRandomInt(0, SLOTS.length - 1);
  const slot = SLOTS[slotIndex];

  let namePool: string[] = [];
  if (slot === 'Weapon') namePool = WEAPONS;
  else if (slot === 'OffHand') namePool = OFFHANDS;
  else if (slot === 'Helmet') namePool = HELMETS;
  else if (slot === 'Chest') namePool = CHESTS;
  else if (slot === 'Gloves') namePool = GLOVES;
  else if (slot === 'Boots') namePool = BOOTS;
  else if (slot === 'Cloak') namePool = CLOAKS;
  else if (slot === 'Ring') namePool = RINGS;
  else if (slot === 'Amulet') namePool = AMULETS;
  
  const subType = namePool[getRandomInt(0, namePool.length - 1)];
  const itemName = `${rarity} ${subType}`; // e.g. "Legendary Dagger" OR "Legendary Ruby Ring"

  let baseDamage = 0;
  let baseArmor = 0;
  const powerScale = playerLevel * (modCount * 2); 

  if (slot === 'Weapon') {
    baseDamage = getRandomInt(Math.floor(powerScale), Math.floor(powerScale * 2.5));
  } else if (['Helmet', 'Chest', 'Gloves', 'Boots', 'Shield'].includes(slot) || subType === 'Shield' || subType === 'Buckler') {
    baseArmor = getRandomInt(Math.floor(powerScale), Math.floor(powerScale * 1.5));
  }

  const availableMods = ['str', 'dex', 'int', 'vit', 'armor', 'evasion', 'critChance', 'rFire', 'rCold', 'rLightning', 'rPoison', 'rHoly', 'rAcid'];
  const modifiers: Record<string, number> = {};
  
  for (let i = 0; i < modCount; i++) {
    const modPick = availableMods[getRandomInt(0, availableMods.length - 1)];
    const val = getRandomInt(1, Math.floor(powerScale));
    modifiers[modPick] = (modifiers[modPick] || 0) + val;
  }

  const passives = [];
  // Assign procedural passives bound by SubType pools! Only Rare+ can roll passives usually.
  if (rarity === 'Epic' || rarity === 'Legendary' || rarity === 'Rare') {
    const pool = PASSIVE_POOLS[subType] || PASSIVE_POOLS[slot] || [];
    if (pool.length > 0) {
      // Pick 1 to 2 unique passives depending on rarity
      const numPassives = rarity === 'Legendary' ? 2 : 1;
      for (let i = 0; i < numPassives; i++) {
        const picked = pool[getRandomInt(0, pool.length - 1)];
        if (!passives.includes(picked)) passives.push(picked);
      }
    }
  }

  const item = await prisma.item.create({
    data: {
      name: itemName,
      rarity,
      slot: slot === 'Weapon' ? 'MainHand' : slot, // Backwards compatible with legacy database slot naming
      baseDamage,
      baseArmor,
      modifiers: JSON.stringify(modifiers),
      passives: JSON.stringify(passives)
    }
  });

  await prisma.inventoryItem.create({
    data: {
      playerId,
      itemId: item.id,
      amount: 1
    }
  });

  return item;
}
