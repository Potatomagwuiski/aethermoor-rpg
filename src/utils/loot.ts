import { prisma } from '../db';

// Helper for RNG
export function getRandomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

const WEAPONS = ['Iron Sword', 'Steel Axe', 'Mythril Dagger', 'Oak Staff', 'Bone Wand'];
const HELMETS = ['Leather Cap', 'Iron Helm', 'Steel Visor', 'Silk Cowl', 'Bone Mask'];
const CHESTS = ['Leather Tunic', 'Iron Cuirass', 'Steel Plate', 'Silk Robe', 'Bone Armor'];
const GLOVES = ['Leather Gloves', 'Iron Gauntlets', 'Steel Vambraces', 'Silk Wraps', 'Bone Grips'];
const BOOTS = ['Leather Boots', 'Iron Sabatons', 'Steel Greaves', 'Silk Shoes', 'Bone Treads'];
const CLOAKS = ['Tattered Cloak', 'Travelers Cape', 'Silk Mantle', 'Shadow Cloak', 'Heroic Drape'];
const RINGS = ['Iron Ring', 'Ruby Ring', 'Sapphire Ring', 'Gold Band', 'Bone Loop'];
const AMULETS = ['Simple Pendant', 'Ruby Amulet', 'Sapphire Amulet', 'Gold Necklace', 'Bone Talisman'];

const SLOTS = ['MainHand', 'Helmet', 'Chest', 'Gloves', 'Boots', 'Cloak', 'Ring', 'Amulet', 'OffHand'];

export async function rollLootDrop(playerLevel: number, playerId: string) {
  // 30% chance to drop nothing
  if (Math.random() < 0.3) return null;

  // Determine Rarity
  const r = Math.random();
  let rarity = 'Common';
  let modCount = 1;

  if (r > 0.98) { rarity = 'Legendary'; modCount = 4; }
  else if (r > 0.90) { rarity = 'Epic'; modCount = 3; }
  else if (r > 0.70) { rarity = 'Rare'; modCount = 2; }
  else if (r > 0.40) { rarity = 'Uncommon'; modCount = 1; }

  // Determine Slot
  const slotIndex = getRandomInt(0, SLOTS.length - 1);
  const slot = SLOTS[slotIndex];

  let namePool = WEAPONS;
  if (slot === 'Helmet') namePool = HELMETS;
  if (slot === 'Chest') namePool = CHESTS;
  if (slot === 'Gloves') namePool = GLOVES;
  if (slot === 'Boots') namePool = BOOTS;
  if (slot === 'Cloak') namePool = CLOAKS;
  if (slot === 'Ring') namePool = RINGS;
  if (slot === 'Amulet') namePool = AMULETS;
  
  const nameBase = namePool[getRandomInt(0, namePool.length - 1)];
  const itemName = `${rarity} ${nameBase}`;

  // Base Stats based on level and rarity
  let baseDamage = 0;
  let baseArmor = 0;
  const powerScale = playerLevel * (modCount * 1.5);

  if (slot === 'MainHand' || slot === 'OffHand') {
    baseDamage = getRandomInt(Math.floor(powerScale), Math.floor(powerScale * 2));
  } else if (['Helmet', 'Chest', 'Gloves', 'Boots'].includes(slot)) {
    baseArmor = getRandomInt(Math.floor(powerScale), Math.floor(powerScale * 2));
  }

  // Modifiers
  const availableMods = ['str', 'dex', 'int', 'vit', 'armor', 'evasion', 'critChance', 'rFire', 'rCold', 'rLightning', 'rPoison', 'rHoly', 'rAcid'];
  const modifiers: Record<string, number> = {};
  
  for (let i = 0; i < modCount; i++) {
    const modPick = availableMods[getRandomInt(0, availableMods.length - 1)];
    const val = getRandomInt(1, Math.floor(powerScale));
    modifiers[modPick] = (modifiers[modPick] || 0) + val;
  }

  // Passives (Only Rare+ Weapons)
  const passives = [];
  if ((slot === 'MainHand' || slot === 'OffHand') && (rarity === 'Epic' || rarity === 'Legendary')) {
    const randomPassives = ['Lifesteal 5%', 'On Critical Hit: Burn Enemy', 'Cleave', 'Armor Pierce'];
    passives.push(randomPassives[getRandomInt(0, randomPassives.length - 1)]);
  }

  // Save to DB
  const item = await prisma.item.create({
    data: {
      name: itemName,
      rarity,
      slot,
      baseDamage,
      baseArmor,
      modifiers: JSON.stringify(modifiers),
      passives: JSON.stringify(passives)
    }
  });

  // Map to inventory
  await prisma.inventoryItem.create({
    data: {
      playerId,
      itemId: item.id,
      amount: 1
    }
  });

  return item;
}
