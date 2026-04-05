/**
 * Maps the specific inputs required to forge, cook, or craft specific outputs.
 */

export type RecipeType = 'blacksmith' | 'cooking';

export interface RequiredMaterial {
    itemId: string;
    quantity: number;
}

export interface RecipeEntry {
    id: string;             // Must match what is tracked in the DB `PlayerRecipe` table
    type: RecipeType;
    outputItemId: string;   // The item being crafted or upgraded
    requiredLevel: number;  // For upgrading existing gear (e.g., 0 means it upgrades a +0 item to +1)
    materials: RequiredMaterial[];
    goldCost: number;
}

export const RECIPE_REGISTRY: Record<string, RecipeEntry> = {
    // ---- BLACKSMITHING ----
    "blueprint_short_sword": {
        id: "recipe_upgrade_short_sword",
        type: "blacksmith",
        outputItemId: "short_sword",
        requiredLevel: 0, // This is the recipe to upgrade +0 -> +1
        materials: [
            { itemId: "iron_ore", quantity: 10 },
            { itemId: "oak_log", quantity: 5 },
            { itemId: "goblin_ear", quantity: 2 }
        ],
        goldCost: 50
    },

    // ---- COOKING ----
    "recipe_fish_stew": {
        id: "recipe_fish_stew",
        type: "cooking",
        outputItemId: "fish_stew",
        requiredLevel: 0, // Not applicable for food
        materials: [
            { itemId: "raw_salmon", quantity: 2 },
            { itemId: "goblin_herb", quantity: 5 }
        ],
        goldCost: 10
    }
};
