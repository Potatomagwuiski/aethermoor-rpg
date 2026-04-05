/**
 * The specific statistical modifiers that gear drops can randomly roll.
 */

// Possible stat keys to boost or debuff
export type ModStat = 'str' | 'dex' | 'int' | 'ev' | 'ac' | 'sh' | 'hp' | 'mana' | 'hpRegen' | 'mpRegen' | 'acc' | 'rElec' | 'rFire';

export interface ModifierArchetype {
    key: ModStat;
    isPercent?: boolean; // E.g. flat integer vs decimal multi
    minValue: number;
    maxValue: number;
    displayName: string; // The text shown in the brackets, e.g. "STR", "HPRegen"
    isPositive: boolean; // Is it a buff or a cursed drop?
}

const MOD_POOL: ModifierArchetype[] = [
    { key: 'str', minValue: 1, maxValue: 5, displayName: 'STR', isPositive: true },
    { key: 'dex', minValue: 1, maxValue: 5, displayName: 'DEX', isPositive: true },
    { key: 'int', minValue: 1, maxValue: 5, displayName: 'INT', isPositive: true },
    { key: 'hp', minValue: 2, maxValue: 15, displayName: 'HP', isPositive: true },
    { key: 'hpRegen', minValue: 1, maxValue: 2, displayName: 'HPRegen', isPositive: true },
    { key: 'ev', minValue: 1, maxValue: 5, displayName: 'EV', isPositive: true },
    { key: 'ac', minValue: 1, maxValue: 5, displayName: 'AC', isPositive: true },
    { key: 'acc', minValue: 1, maxValue: 5, displayName: 'ACC', isPositive: true },
    { key: 'rElec', minValue: 1, maxValue: 1, displayName: 'rElec', isPositive: true },
    { key: 'rFire', minValue: 1, maxValue: 1, displayName: 'rFire', isPositive: true },
    
    // Curses / Trade-offs
    { key: 'ev', minValue: -5, maxValue: -1, displayName: 'EV', isPositive: false },
    { key: 'hp', minValue: -10, maxValue: -2, displayName: 'HP', isPositive: false }
];

export interface GeneratedModifier {
    [stat: string]: number | boolean; 
}

export interface ModifierStringBox {
    text: string; // e.g. "{HP-2 HPRegen+}"
    modifiers: GeneratedModifier;
}

/**
 * Procedurally rolls 0-3 modifiers onto a dropped piece of equipment.
 */
export function generateRandomAffixes(baseChance: number = 0.3): ModifierStringBox | null {
    if (Math.random() > baseChance) return null; // Item rolled naked (+0, no mods)

    // Roll 1 to 3 mods
    const modCount = Math.floor(Math.random() * 3) + 1;
    const finalModifiers: GeneratedModifier = {};
    const stringParts: string[] = [];

    // Simple random picking 
    const poolSize = MOD_POOL.length;
    
    for (let i = 0; i < modCount; i++) {
        const selected = MOD_POOL[Math.floor(Math.random() * poolSize)];
        const value = Math.floor(Math.random() * (selected.maxValue - selected.minValue + 1)) + selected.minValue;
        
        // Prevent stacking the exact same stat key twice on the same weapon roll
        if (finalModifiers[selected.key] !== undefined) continue;
        
        finalModifiers[selected.key] = value;
        
        // Build the `{STR+5}` or `{rElec+}` text output
        const prefix = value > 0 ? '+' : ''; // e.g. +5 vs -2
        // If it's a boolean logic flag like "rElec", just say "rElec+"
        if (selected.maxValue === 1 && selected.minValue === 1) {
             stringParts.push(`${selected.displayName}+`);
        } else {
             stringParts.push(`${selected.displayName}${prefix}${value}`);
        }
    }

    if (stringParts.length === 0) return null;

    return {
        text: `{${stringParts.join(' ')}}`,
        modifiers: finalModifiers
    };
}
