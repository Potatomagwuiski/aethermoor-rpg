export type ScaleStat = 'str' | 'dex' | 'vit' | 'int';

export interface CombatModifier {
  damageMult?: number;
  evadeBonus?: number;
  acBonus?: number;
  shieldBonus?: number;
  speedMult?: number;
  critBonus?: number;
  stealthEntry?: boolean;
  chronosFirstStrike?: boolean;
  maxHpMult?: number;
  evadeCapOverride?: number;
  pacifism?: boolean;
  realityFractureChance?: number; 
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
  trigger: 'onHitTaken' | 'onHitMitigated' | 'onEvade' | 'onCritDealt' | 'onStealthBreak';
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

export const ITEMS: Record<string, Item> = {
  // === WEAPONS ===
  heavy_greataxe: {
    id: 'heavy_greataxe', name: 'Heavy Greataxe', description: 'A slow crushing blow (Melee).', slot: 'mainhand',
    modifiers: { damageMult: 1.8, speedMult: 1.6, evadeBonus: -15 }, weight: 35,
    grantedAction: { name: 'Greataxe Swing', description: 'Cleaves through armor.', scaleStat: 'str', basePower: 3.5, baseSpeed: 150, range: 1 }
  },
  assassin_blade: {
    id: 'assassin_blade', name: 'Assassin Blade', description: 'Extremely fast puncture (Melee).', slot: 'mainhand',
    modifiers: { speedMult: 0.6 }, weight: 4,
    grantedAction: { name: 'Shadow Stab', description: 'Quick strikes.', scaleStat: 'dex', basePower: 1.0, baseSpeed: 45, range: 1 }
  },
  aether_tome: {
    id: 'aether_tome', name: 'Aether Tome', description: 'Casts magical bolts from afar.', slot: 'mainhand',
    modifiers: { speedMult: 1.1 }, weight: 5,
    grantedAction: { name: 'Arcane Bolt', description: 'Magic projectile.', scaleStat: 'int', basePower: 2.0, baseSpeed: 80, range: 8 }
  },
  halberd_polearm: {
    id: 'halberd_polearm', name: 'Halberd', description: 'Zoning mid-range melee.', slot: 'mainhand',
    modifiers: { damageMult: 1.3, speedMult: 1.2 }, weight: 15,
    grantedAction: { name: 'Thrusting Zone', description: 'Mid-range poke.', scaleStat: 'str', basePower: 2.2, baseSpeed: 95, range: 3 }
  },

  // === OFFHANDS ===
  tower_shield: {
    id: 'tower_shield', name: 'Tower Shield', description: 'Massive flat shield ward + bash capability.', slot: 'offhand',
    modifiers: { shieldBonus: 1000, evadeBonus: -30 }, weight: 40,
    grantedReaction: { name: 'Shield Bash', trigger: 'onHitTaken', effect: (user, target, dmg) => { return { log: `🛡️ Shield bashed for 15 damage and 2 tile pushback!`, damageDealtToTarget: 15, pushback: 2}; } }
  },
  smoke_bomb: {
    id: 'smoke_bomb', name: 'Smoke Pouch', description: 'Offhand tool for vanishing.', slot: 'offhand',
    modifiers: { evadeBonus: 10 }, weight: 1,
    grantedReaction: { name: 'Smoke Powder', trigger: 'onEvade', effect: () => { return { log: `💨 *Evaded the attack into a smoke cloud, re-entering stealth!*`, applyStealth: true }; } }
  },
  parrying_dagger: {
    id: 'parrying_dagger', name: 'Parrying Dagger', description: 'Provides flat evasion.', slot: 'offhand',
    modifiers: { evadeBonus: 25 }, weight: 3,
    grantedReaction: { name: 'Riposte', trigger: 'onEvade', effect: () => { return { log: `⚔️ *Riposte! Counter-attack landed for 25 free damage.*`, damageDealtToTarget: 25 }; } }
  },

  // === ARMOR ===
  shadow_cloak: {
    id: 'shadow_cloak', name: 'Shadow Cloak', description: 'Increases evasion and allows stealth.', slot: 'cloak',
    modifiers: { evadeBonus: 30, acBonus: 5, stealthEntry: true }, weight: 2
  },
  cloak_of_shadow_walker: {
    id: 'cloak_of_shadow_walker', name: 'Cloak of the Shadow-Walker', description: 'Guaranteed stealth if 5+ tiles away.', slot: 'cloak',
    modifiers: { evadeBonus: 15 }, weight: 3,
    grantedReaction: { name: 'Distance Vanish', trigger: 'onHitTaken', effect: () => { return { log: `...The cloak shifts.` }; } } 
  },
  aether_silk: {
    id: 'aether_silk', name: 'Aether-Silk Robes', description: 'Increases speed drastically but negatively impacts AC.', slot: 'chest',
    modifiers: { acBonus: -20, speedMult: 0.6, stealthEntry: true }, weight: 1
  },
  rogues_leather: {
    id: 'rogues_leather', name: 'Rogue Leather', description: 'Balanced armor.', slot: 'chest',
    modifiers: { acBonus: 15, evadeBonus: 15 }, weight: 10
  },
  paladin_plate: {
    id: 'paladin_plate', name: 'Juggernaut Plate', description: 'Massive Armor. Negates almost all evasion.', slot: 'chest',
    modifiers: { evadeBonus: -100, acBonus: 60, shieldBonus: 200 }, weight: 55
  },

  // === ACCESSORIES ===
  amulet_of_chronos: {
    id: 'amulet_of_chronos', name: 'Amulet of Chronos', description: 'Always strike first.', slot: 'neck',
    modifiers: { chronosFirstStrike: true }, weight: 1
  },
  vampiric_ring: {
    id: 'vampiric_ring', name: 'Vampiric Ring', description: 'Heal on Critical Strikes.', slot: 'ring',
    modifiers: { critBonus: 5 }, weight: 1,
    grantedReaction: { name: 'Blood Craze', trigger: 'onCritDealt', effect: (user, target, val) => { return { log: `🦇 *Blood Craze triggered! Healed for ${Math.floor(val * 0.15)} HP.*`, healUser: Math.floor(val * 0.15) }; } }
  },
  ring_of_retribution: {
    id: 'ring_of_retribution', name: 'Ring of Retribution', description: 'Reflects mitigated AC damage.', slot: 'ring',
    modifiers: { acBonus: 10 }, weight: 1,
    grantedReaction: { name: 'Spikes', trigger: 'onHitMitigated', effect: (u, t, val) => { return { log: `✨ *Ring of Retribution reflected ${Math.floor(val * 0.1)} true damage!*`, damageDealtToTarget: Math.floor(val * 0.1) }; } }
  },

  // === AETHER-CORRUPTIONS (Endgame Trade-offs) ===
  stagnant_heart: {
    id: 'stagnant_heart', name: 'The Stagnant Heart', description: 'Triples Max HP, hardlocks Evasion to 0%.', slot: 'neck',
    modifiers: { maxHpMult: 3.0, evadeCapOverride: 0 }, weight: 15
  },
  fractured_gauntlets: {
    id: 'fractured_gauntlets', name: 'Fractured Reality Gauntlets', description: 'Insane speed, 80% chance to do zero physical damage.', slot: 'hands',
    modifiers: { speedMult: 0.1, realityFractureChance: 80 }, weight: 5
  },
  pacifists_boots: {
    id: 'pacifists_boots', name: 'The Pacifist\'s Boots', description: 'Massive surviveability. Cannot attack.', slot: 'feet',
    modifiers: { pacifism: true, acBonus: 50, shieldBonus: 1000, evadeBonus: 50 }, weight: 2
  }
};
