export type ScaleStat = 'str' | 'dex' | 'vit' | 'int';

export interface CombatModifier {
  damageMult?: number;
  evadeBonus?: number;
  acBonus?: number;
  shieldBonus?: number;
  speedMult?: number;
  critBonus?: number;
  stealthEntry?: boolean;
}

export interface Action {
  name: string;
  description: string;
  scaleStat: ScaleStat;
  basePower: number; 
  baseSpeed: number;
  range: number;
}

export interface Reaction {
  name: string;
  trigger: 'onHitTaken' | 'onEvade' | 'onCritDealt' | 'onStealthBreak';
  effect: (user: any, target: any, value: number) => { log: string, damageDealtToTarget?: number, healUser?: number, applyStealth?: boolean, pushback?: number };
}

export type SlotType = 'head' | 'cloak' | 'chest' | 'legs' | 'feet' | 'hands' | 'neck' | 'ring' | 'mainhand' | 'offhand';

export interface Item {
  id: string;
  name: string;
  description: string;
  slot: SlotType;
  modifiers: CombatModifier;
  weight?: number;
  
  grantedAction?: Action;
  grantedReaction?: Reaction;
}

// --- FULL BODY ITEM REGISTRY ---

export const ITEMS: Record<string, Item> = {
  // Main Weapons
  heavy_greataxe: {
    id: 'heavy_greataxe',
    name: 'Heavy Greataxe',
    description: 'A slow crushing blow (Melee).',
    slot: 'mainhand',
    modifiers: { damageMult: 1.0, speedMult: 1.5, evadeBonus: -10 },
    weight: 35,
    grantedAction: {
      name: 'Greataxe Swing',
      description: 'Cleaves through armor.',
      scaleStat: 'str',
      basePower: 3.5,
      baseSpeed: 150,
      range: 1
    }
  },
  assassin_blade: {
    id: 'assassin_blade',
    name: 'Assassin Blade',
    description: 'Extremely fast puncture (Melee).',
    slot: 'mainhand',
    modifiers: { speedMult: 0.8 },
    weight: 4,
    grantedAction: {
      name: 'Shadow Stab',
      description: 'Quick strikes.',
      scaleStat: 'dex',
      basePower: 1.2,
      baseSpeed: 50,
      range: 1
    }
  },
  
  // Body Armor
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    description: 'Increases evasion and allows stealth.',
    slot: 'cloak',
    modifiers: { evadeBonus: 30, acBonus: 5, stealthEntry: true },
    weight: 2
  },
  paladin_plate: {
    id: 'paladin_plate',
    name: 'Paladin Chestplate',
    description: 'Massive Armor.',
    slot: 'chest',
    modifiers: { evadeBonus: -30, acBonus: 40, shieldBonus: 50 },
    weight: 55
  },

  // Offhands
  tower_shield: {
    id: 'tower_shield',
    name: 'Tower Shield',
    description: 'Massive flat shield ward + bash capability.',
    slot: 'offhand',
    modifiers: { shieldBonus: 150, evadeBonus: -20 },
    weight: 40,
    grantedReaction: {
      name: 'Shield Bash',
      trigger: 'onHitTaken',
      effect: (user, target, dmg) => { return { log: `🛡️ Shield bashed for 15 damage and 1 tile pushback!`, damageDealtToTarget: 15, pushback: 1}; }
    }
  },
  smoke_bomb: {
    id: 'smoke_bomb',
    name: 'Smoke Pouch',
    description: 'Offhand tool for vanishing.',
    slot: 'offhand',
    modifiers: { evadeBonus: 10 },
    weight: 1,
    grantedReaction: {
      name: 'Smoke Powder',
      trigger: 'onEvade',
      effect: () => { return { log: `💨 *Evading the attack created a smoke cloud, re-entering stealth!*`, applyStealth: true }; }
    }
  },
  
  // Accessories & Minor Slots
  amulet_of_speed: {
    id: 'amulet_of_speed',
    name: 'Amulet of Speed',
    description: 'Reduces action ticks.',
    slot: 'neck',
    modifiers: { speedMult: 0.85 }
  },
  ring_of_vitality: {
    id: 'ring_of_vitality',
    name: 'Ring of Vitality',
    description: 'Flat damage block via high AC.',
    slot: 'ring',
    modifiers: { acBonus: 20 }
  }
};
