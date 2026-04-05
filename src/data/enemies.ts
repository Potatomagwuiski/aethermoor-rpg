import { EntityData } from '../engine/types.js';
import { LootTableEntry } from '../engine/loot.js';

export interface EnemyData extends EntityData {
    lootTable: LootTableEntry[];
    xpReward: number; 
}

export const ENEMY_REGISTRY: Record<string, EnemyData> = {
    "goblin": {
        id: "goblin",
        name: "Goblin",
        hp: 120, maxHp: 120, mana: 0, maxMana: 0,
        baseStats: { str: 5, dex: 10, int: 2 },
        defenses: { ac: 2, ev: 10, sh: 0 },
        damages: [{ type: 'physical', minAmount: 1, maxAmount: 8 }],
        attackSpeed: 1.0, meleeAccuracy: 0, hpRegen: 0.0, mpRegen: 0.0,
        xpReward: 90,
        lootTable: [
            // Micro-Material: 40% Drop Rate (Not Equipment, just raw mats)
            { itemId: "dagger", chance: 0.05, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 },
            { itemId: "buckler", chance: 0.02, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 }
        ]
    },
    "lonomia": {
        id: "lonomia",
        name: "Lonomia",
        hp: 200, maxHp: 200, mana: 0, maxMana: 0,
        baseStats: { str: 10, dex: 10, int: 5 },
        defenses: { ac: 8, ev: 50, sh: 2 }, // Ultra-high evasion mimicking logs
        damages: [{ type: 'physical', minAmount: 4, maxAmount: 15 }],
        attackSpeed: 1.0, meleeAccuracy: 0, hpRegen: 0.0, mpRegen: 0.0,
        xpReward: 101,
        lootTable: [
            // The items
            { itemId: "short_sword", chance: 0.05, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 },
            { itemId: "helmet", chance: 0.03, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 },
            { itemId: "robe", chance: 0.03, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 },
            { itemId: "shortbow", chance: 0.02, isEquipmentRoll: true, minQuantity: 1, maxQuantity: 1 },
            
            // Enchantment Scrolls (Boss Exclusives)
            { itemId: "scroll_finesse", chance: 0.02, isEquipmentRoll: false, minQuantity: 1, maxQuantity: 1 },
            { itemId: "scroll_heavy", chance: 0.02, isEquipmentRoll: false, minQuantity: 1, maxQuantity: 1 },
            { itemId: "scroll_light_ward", chance: 0.015, isEquipmentRoll: false, minQuantity: 1, maxQuantity: 1 },
            { itemId: "scroll_chaos", chance: 0.005, isEquipmentRoll: false, minQuantity: 1, maxQuantity: 1 },
            { itemId: "scroll_cleansing", chance: 0.002, isEquipmentRoll: false, minQuantity: 1, maxQuantity: 1 }
        ]
    }
};
