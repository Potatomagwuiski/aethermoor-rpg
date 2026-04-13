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

export interface Stance {
  id: string;
  name: string;
  description: string;
  modifiers: CombatModifier;
}

export interface Action {
  id: string;
  name: string;
  description: string;
  scaleStat: ScaleStat;
  basePower: number; 
  baseSpeed: number;
  range: number; // Maximum attack distance in tiles (e.g., 1 for melee, 10 for bow)
  grantsStealth?: boolean;
}

export interface Reaction {
  id: string;
  name: string;
  trigger: 'onHitTaken' | 'onEvade' | 'onCritDealt' | 'onStealthBreak';
  effect: (user: any, target: any, value: number) => { log: string, damageDealtToTarget?: number, healUser?: number, applyStealth?: boolean, pushback?: number };
}

// --- INITIAL REGISTRIES ---

export const STANCES: Record<string, Stance> = {
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    description: 'A stealth-oriented stance that severely increases evasion but offers no Armor.',
    modifiers: { evadeBonus: 30, acBonus: -10, speedMult: 0.8, stealthEntry: true }
  },
  paladin_aura: {
    id: 'paladin_aura',
    name: 'Paladin Aura',
    description: 'Generates a massive holy shield and heavy AC, but removes all evasion.',
    modifiers: { evadeBonus: -100, acBonus: 50, shieldBonus: 200 }
  },
  ranger_stance: {
    id: 'ranger_stance',
    name: 'Ranger Stance',
    description: 'Faster movement speed.',
    modifiers: { speedMult: 0.7 } 
  }
};

export const ACTIONS: Record<string, Action> = {
  heavy_greataxe: {
    id: 'heavy_greataxe',
    name: 'Heavy Greataxe',
    description: 'A slow crushing blow (Melee).',
    scaleStat: 'str',
    basePower: 3.5,
    baseSpeed: 150,
    range: 1
  },
  assassin_blade: {
    id: 'assassin_blade',
    name: 'Assassin Blade',
    description: 'Extremely fast puncture (Melee).',
    scaleStat: 'dex',
    basePower: 1.2,
    baseSpeed: 50,
    range: 1
  },
  longbow: {
    id: 'longbow',
    name: 'Hunting Longbow',
    description: 'A ranged weapon. Keep your distance!',
    scaleStat: 'dex',
    basePower: 1.8,
    baseSpeed: 100,
    range: 10
  }
};

export const REACTIONS: Record<string, Reaction> = {
  smoke_powder: {
    id: 'smoke_powder',
    name: 'Smoke Powder',
    trigger: 'onEvade',
    effect: () => {
      return { log: `💨 *Evading the attack created a smoke cloud, re-entering stealth!*`, applyStealth: true };
    }
  },
  shield_bash: {
    id: 'shield_bash',
    name: 'Shield Bash',
    trigger: 'onHitTaken',
    effect: (user, target, damageTaken) => {
      return { log: `🛡️ *Blocked with Shield and bashed back for 15 damage, knocking the target back 1 tile!*`, damageDealtToTarget: 15, pushback: 1 };
    }
  }
};
