import { EntityData, FightEntity } from './types.js';

/**
 * Initializes a mutable FightEntity from static EntityData for a combat session.
 */
export function initializeFightEntity(data: EntityData): FightEntity {
    return {
        data: { ...data }, // shallow copy for combat state
        movesLeft: 0,
        hpLeft: data.hp,
        manaLeft: data.mana,
        isSilenced: false,
        // Formula extracted: EV contributes to Evade Chance logarithmically/flat depending on level
        // Simplification for v1: 1 EV = ~0.8% evade chance scaled 
        evadeChance: calculateEvadeChance(data.defenses.ev),
    };
}

/**
 * Formula for Evasion Chance based on EV rating.
 */
export function calculateEvadeChance(ev: number): number {
    return Math.min(80, ev * 0.85); // Caps out at 80% dodge chance
}

/**
 * AC Mitigation works by rolling randomly between 0 and max AC score to reduce incoming damage.
 */
export function rollACMitigation(ac: number): number {
    if (ac <= 0) return 0;
    // Uniform random roll between 0 and AC. 
    return Math.floor(Math.random() * (ac + 1));
}

/**
 * Calculates a random damage swing between min and max bounds.
 */
export function rollDamage(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
