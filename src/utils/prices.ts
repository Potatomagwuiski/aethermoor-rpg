export const ITEM_SELL_PRICES: Record<string, number> = {
    // Basic Materials
    'wood': 2,
    'iron': 5,
    'gold_ore': 15,
    'elderwood': 25,
    'moon_herb': 50,
    
    // Monster Drops
    'goblin_ear': 10,
    'slime_core': 15,
    'wolf_pelt': 20,
    'mythic_dragon_scale': 1000,
    
    // Forged Weapons
    'common_iron_sword': 100,
    'uncommon_iron_sword': 300,
    'rare_iron_sword': 800,
    'epic_iron_sword': 2000,
  
    'rare_void_blade': 5000,
    'epic_void_blade': 15000,
    'legendary_void_blade': 50000,
    
    // Forged Tools
    'common_iron_pickaxe': 150,
    'uncommon_iron_pickaxe': 500,
    'rare_iron_pickaxe': 1500,
  
    'common_iron_axe': 150,
    'uncommon_iron_axe': 500,
    'rare_iron_axe': 1500,
  
    // Blueprints
    'blueprint_iron_sword': 2000,
    'blueprint_iron_pickaxe': 3000,
    'blueprint_iron_axe': 3000,
    'blueprint_void_blade': 50000,
};

export function getSellPrice(itemKey: string): number {
    return ITEM_SELL_PRICES[itemKey] || 1; // default to 1 gold for unknown items
}
