export type ScaleStat = 'str' | 'dex' | 'vit' | 'int';

export interface CombatModifier {
  damageMult?: number;
  evadeBonus?: number;
  acBonus?: number;       // Armor Class - Reduces incoming damage (%)
  shieldBonus?: number;   // Flat Shield HP added at the start of combat
  speedMult?: number;     // Action speed multiplier (lower = faster)
  critBonus?: number;
  stealthEntry?: boolean; // Does this stance/action enter stealth?
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
  baseSpeed: number; // Base Ticks required to attack again (e.g. 100 is standard, 50 is fast)
  grantsStealth?: boolean; // e.g. Smoke Bomb attack
}

export interface Reaction {
  id: string;
  name: string;
  trigger: 'onHitTaken' | 'onEvade' | 'onCritDealt' | 'onStealthBreak';
  effect: (user: any, target: any, value: number) => { log: string, damageDealtToTarget?: number, healUser?: number, applyStealth?: boolean };
}

// --- INITIAL REGISTRIES ---

export const STANCES: Record<string, Stance> = {
  shadow_cloak: {
    id: 'shadow_cloak',
    name: 'Shadow Cloak',
    description: 'A stealth-oriented stance that severely increases evasion but offers no Armor.',
    modifiers: { evadeBonus: 30, acBonus: -10, speedMult: 0.8, stealthEntry: true } // Starts in stealth, 20% faster
  },
  paladin_aura: {
    id: 'paladin_aura',
    name: 'Paladin Aura',
    description: 'Generates a massive holy shield and heavy AC, but removes all evasion.',
    modifiers: { evadeBonus: -100, acBonus: 50, shieldBonus: 200 } // +50 Armor Class, +200 Shield HP
  }
};

export const ACTIONS: Record<string, Action> = {
  heavy_greataxe: {
    id: 'heavy_greataxe',
    name: 'Heavy Greataxe',
    description: 'A slow crushing blow.',
    scaleStat: 'str',
    basePower: 3.5,
    baseSpeed: 150 // Very slow (1.5x normal standard of 100)
  },
  assassin_blade: {
    id: 'assassin_blade',
    name: 'Assassin Blade',
    description: 'Extremely fast puncture. Bonus if stealthed.',
    scaleStat: 'dex',
    basePower: 1.2,
    baseSpeed: 50 // Extremely fast (2 attacks per standard)
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
      return { log: `🛡️ *Blocked with Shield and bashed back for 15 damage!*`, damageDealtToTarget: 15 };
    }
  }
};
