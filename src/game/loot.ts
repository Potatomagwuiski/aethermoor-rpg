import { Prisma } from '@prisma/client';
import { Action, Reaction, SlotType } from './items';

const RARITY_WEIGHTS = [
  { tier: 'Common', chance: 60, statBudget: 2 },
  { tier: 'Rare', chance: 25, statBudget: 6 },
  { tier: 'Epic', chance: 14, statBudget: 12 },
  { tier: 'Legendary', chance: 1, statBudget: 25 }
];

const WEAPON_TEMPLATES = [
  { id: 'dagger', slot: 'mainhand', name: 'Dagger', baseWeight: 4, action: { name: 'Quick Strike', scaleStat: 'dex', basePower: 1.0, baseSpeed: 45, range: 1 } },
  { id: 'longsword', slot: 'mainhand', name: 'Longsword', baseWeight: 12, action: { name: 'Slashing Arc', scaleStat: 'str', basePower: 2.0, baseSpeed: 90, range: 1 } },
  { id: 'musket', slot: 'mainhand', name: 'Flintlock', baseWeight: 14, action: { name: 'Piercing Lead', scaleStat: 'dex', basePower: 5.0, baseSpeed: 250, range: 10 } }
];

const ARMOR_TEMPLATES = [
  { id: 'leather_chest', slot: 'chest', name: 'Leather Jerkin', baseWeight: 5 },
  { id: 'plate_chest', slot: 'chest', name: 'Heavy Cuirass', baseWeight: 45 },
  { id: 'shadow_cloak', slot: 'cloak', name: 'Veil', baseWeight: 2 }
];

export function rollLoot(userId: string, forcedType?: 'weapon' | 'armor') {
  // 1. Roll Rarity
  const roll = Math.random() * 100;
  let rarityObj = RARITY_WEIGHTS[0];
  let cumulative = 0;
  for (const r of RARITY_WEIGHTS) {
    cumulative += r.chance;
    if (roll <= cumulative) {
      rarityObj = r;
      break;
    }
  }

  // 2. Select Template
  let isWeapon = Math.random() > 0.5;
  if (forcedType === 'weapon') isWeapon = true;
  if (forcedType === 'armor') isWeapon = false;
  
  const templatePool = isWeapon ? WEAPON_TEMPLATES : ARMOR_TEMPLATES;
  const template = templatePool[Math.floor(Math.random() * templatePool.length)];

  const statsCore = { str: 0, dex: 0, vit: 0, int: 0 };
  const statKeys = ['str', 'dex', 'vit', 'int'];
  let budget = rarityObj.statBudget;
  while(budget > 0) {
    const k = statKeys[Math.floor(Math.random() * statKeys.length)] as 'str' | 'dex' | 'vit' | 'int';
    statsCore[k] += 1;
    budget -= 1;
  }

  const modifiers: any = {};
  if (template.id === 'plate_chest') { modifiers.acBonus = 20; modifiers.evadeBonus = -10; modifiers.shieldBonus = 50; }
  else if (template.id === 'leather_chest') { modifiers.acBonus = 5; modifiers.evadeBonus = 5; }
  else if (template.id === 'shadow_cloak') { modifiers.stealthEntry = true; }
  else if (template.id === 'dagger') { modifiers.speedMult = 0.6; }
  else if (template.id === 'musket') { modifiers.speedMult = 2.0; modifiers.damageMult = 1.2; }

  // 3. Roll Passives for Epics/Legendaries
  const passives: string[] = [];
  if (rarityObj.tier === 'Epic' || rarityObj.tier === 'Legendary') {
    if (isWeapon) passives.push('onCrit_Haste');
    else passives.push('onEvade_Riposte');
  }

  return {
    userId,
    templateId: template.id,
    slot: template.slot,
    rarity: rarityObj.tier,
    name: `${rarityObj.tier} ${template.name}`,
    weight: template.baseWeight,
    baseStats: statsCore as Prisma.InputJsonValue,
    modifiers: modifiers as Prisma.InputJsonValue,
    passives: passives as Prisma.InputJsonValue,
  };
}
