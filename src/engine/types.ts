export interface BaseStats {
    str: number;
    dex: number;
    int: number;
}

export interface Defenses {
    ac: number; // Armor Class
    ev: number; // Evasion
    sh: number; // Shield Block
}

export interface DamageInfo {
    type: 'physical' | 'magical';
    minAmount: number;
    maxAmount: number;
}

export interface EntityData {
    id: string;
    name: string;
    hp: number;
    maxHp: number;
    mana: number;
    maxMana: number;
    baseStats: BaseStats;
    defenses: Defenses;
    damages: DamageInfo[];
    attackSpeed: number; 
    meleeAccuracy: number;
    hpRegen: number;
    mpRegen: number;
    weaponType?: 'melee_fast' | 'melee_med' | 'melee_heavy' | 'bow' | 'rifle';
}

export interface FightEntity {
    data: EntityData;
    movesLeft: number;
    hpLeft: number;
    manaLeft: number;
    isSilenced: boolean;
    // Evade chance computed dynamically
    evadeChance: number;
}
