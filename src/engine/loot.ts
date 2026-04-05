import { generateRandomAffixes, ModifierStringBox } from './modifiers.js';
import { ITEM_REGISTRY } from '../data/items.js';

export interface LootTableEntry {
    itemId: string; // Must map to items.ts
    // 0.0 to 1.0 (1.0 = 100% drop rate)
    chance: number; 
    // Is it a randomized equipment drop that gets modifiers, or just a crafting shard?
    isEquipmentRoll: boolean;
    // For stacking micro-materials
    minQuantity: number;
    maxQuantity: number;
}

export interface DroppedItem {
    itemId: string;
    quantity: number;
    affixData: ModifierStringBox | null;
    upgradeLevel: number;
}

/**
 * Evaluates the entire loot table for a specific enemy defeat.
 */
export function rollLoot(lootTable: LootTableEntry[]): DroppedItem[] {
    const drops: DroppedItem[] = [];

    for (const entry of lootTable) {
        if (Math.random() <= entry.chance) {
            let qty = 1;
            if (entry.minQuantity < entry.maxQuantity) {
                qty = Math.floor(Math.random() * (entry.maxQuantity - entry.minQuantity + 1)) + entry.minQuantity;
            } else {
                qty = entry.minQuantity;
            }

            let affixes: ModifierStringBox | null = null;
            let upgradeLvl = 0;

            if (entry.isEquipmentRoll) {
                // Generates random RNG modifiers
                affixes = generateRandomAffixes(0.20); // 20% chance any gear has an affix

                // Tiny baseline chance to drop naturally upgraded items
                if (Math.random() < 0.05) upgradeLvl = 1;
                if (Math.random() < 0.01) upgradeLvl = 2;
            }

            drops.push({
                itemId: entry.itemId,
                quantity: qty,
                affixData: affixes,
                upgradeLevel: upgradeLvl
            });
        }
    }

    return drops;
}

/**
 * Format drops sequentially for Discord text.
 */
export function formatLootString(drops: DroppedItem[]): string {
    const parts: string[] = [];
    
    for (const drop of drops) {
        const itemRecord = ITEM_REGISTRY[drop.itemId];
        if (!itemRecord) continue;

        if (drop.affixData) {
            // e.g. "AD: 🗡️ +0 Short Sword {STR+2}"
            const adPrefix = itemRecord.slot === 'AD' ? 'AD: ' : (itemRecord.slot ? `${itemRecord.slot}: ` : '');
            parts.push(`${adPrefix}${itemRecord.icon} +${drop.upgradeLevel} ${itemRecord.name} ${drop.affixData.text}`);
        } else {
            if (drop.quantity > 1) {
                parts.push(`${drop.quantity} ${itemRecord.icon} ${itemRecord.name}s`);
            } else {
                // Either gear with no affixes, or single mats
                const prefix = drop.upgradeLevel > 0 ? `+${drop.upgradeLevel} ` : '';
                parts.push(`${itemRecord.icon} ${prefix}${itemRecord.name}`);
            }
        }
    }

    if (parts.length === 0) return '';
    return parts.join(' and ');
}
