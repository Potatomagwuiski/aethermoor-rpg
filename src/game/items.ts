export type ScaleStat = 'str' | 'dex' | 'vit' | 'int';

export interface CombatModifier {
  damageMult?: number;   // 1.0 is default
  evadeBonus?: number;   // Flat addition to evade%
  critBonus?: number;    // Flat addition to crit%
  lifeSteal?: number;    // % of damage returned as HP
  damageReduction?: number; // % of damage ignored
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
  basePower: number; // The base multiplier for the stat
  hits: number;      // Number of times damage is calculated
}

export interface Reaction {
  id: string;
  name: string;
  description: string;
  trigger: 'onHitTaken' | 'onEvade' | 'onCritDealt';
  effect: (user: any, target: any, value: number) => { log: string, damageDealtToTarget?: number, healUser?: number };
}

// --- INITIAL REGISTRIES ---

export const STANCES: Record<string, Stance> = {
  vampiric_stance: {
    id: 'vampiric_stance',
    name: 'Vampiric Stance',
    description: 'Sacrifices defense for extreme lifesteal.',
    modifiers: { lifeSteal: 0.3, damageReduction: -0.15 } // 30% lifesteal, take 15% more damage
  },
  shadow_dance: {
    id: 'shadow_dance',
    name: 'Shadow Dance',
    description: 'Increases evasion drastically but lowers raw damage.',
    modifiers: { evadeBonus: 25, damageMult: 0.8 } 
  },
  juggernaut_form: {
    id: 'juggernaut_form',
    name: 'Juggernaut Form',
    description: 'Increases damage mitigation but sets evasion to 0.',
    modifiers: { damageReduction: 0.40, evadeBonus: -100 }
  }
};

export const ACTIONS: Record<string, Action> = {
  heavy_greataxe: {
    id: 'heavy_greataxe',
    name: 'Heavy Greataxe',
    description: 'A slow, single-hit crushing blow.',
    scaleStat: 'str',
    basePower: 2.5,
    hits: 1
  },
  twin_daggers: {
    id: 'twin_daggers',
    name: 'Twin Daggers',
    description: 'A flurry of 3 quick strikes.',
    scaleStat: 'dex',
    basePower: 0.8, // 3 hits * 0.8 = 2.4 total power, but proc on-hit effects 3 times!
    hits: 3
  },
  mana_bolt: {
    id: 'mana_bolt',
    name: 'Mana Bolt',
    description: 'A focused hit of pure magic energy.',
    scaleStat: 'int',
    basePower: 2.0,
    hits: 1
  }
};

export const REACTIONS: Record<string, Reaction> = {
  thorned_armor: {
    id: 'thorned_armor',
    name: 'Thorned Armor',
    description: 'Reflect flat damage when hit.',
    trigger: 'onHitTaken',
    effect: (user, target, damageTaken) => {
      const reflect = Math.floor(damageTaken * 0.2) + 5;
      return { log: `🛡️ *Thorned Armor reflected ${reflect} damage back!*`, damageDealtToTarget: reflect };
    }
  },
  shadow_step: {
    id: 'shadow_step',
    name: 'Shadow Step',
    description: 'Heal slightly when you evade an attack.',
    trigger: 'onEvade',
    effect: (user, target) => {
      const heal = user.level * 2 + 5;
      return { log: `💨 *Shadow Step restored ${heal} HP!*`, healUser: heal };
    }
  },
  blood_surge: {
    id: 'blood_surge',
    name: 'Blood Surge',
    description: 'Deal an extra burst of true damage on a critical hit.',
    trigger: 'onCritDealt',
    effect: (user, target, critDamage) => {
      const burst = Math.floor(critDamage * 0.3);
      return { log: `🩸 *Blood Surge caused an explosive laceration for ${burst} bonus damage!*`, damageDealtToTarget: burst };
    }
  }
};
