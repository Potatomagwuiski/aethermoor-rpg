export const ITEM_SELL_PRICES: Record<string, number> = {
    // Basic Materials
    'wood': 2,
    'iron': 5,
    'gold_ore': 15,
    'elderwood': 25,
    'moon_herb': 50,
    'mythril': 100,
    
    // Tiered Woods & Mining (World Zones)
    'copper': 2,
    'tin': 3,
    'silver': 15,
    'steel_ore': 20,
    'obsidian': 50,
    'voidstone': 200,
    'ashwood': 2,
    'oakwood': 8,
    'aether_wood': 100,
    'basic_herb': 2,
    'mooncap_mushroom': 10,
    'frost_lotus': 25,
    'cinderbloom': 60,
    'nightmare_kelp': 150,
    
    // Monster Parts
    'goblin_ear': 5,
    'rusty_dagger': 10,
    'slime_core': 5,
    'acid_vial': 15,
    'wolf_pelt': 8,
    'wolf_fang': 20,
    'bat_wing': 6,
    'guano': 15,
    'bone_shard': 10,
    'living_wood': 25,
    'stone_core': 15,
    'demon_horn': 30,
    'hellfire_essence': 100,
    'shadow_dust': 40,
    'void_fragment': 200,
    'drake_scale': 80,
    'mythic_dragon_scale': 500,
    'rare_meteorite_ingot': 5000,
    'lich_soul': 1000,
    'behemoth_bone': 3000,
    
    // Forged Weapons
    'common_iron_sword': 100, 'uncommon_iron_sword': 300, 'rare_iron_sword': 800, 'epic_iron_sword': 2000,
    'rare_wolf_slayer': 1200, 'epic_wolf_slayer': 3500,
    'rare_void_blade': 5000, 'epic_void_blade': 15000, 'legendary_void_blade': 50000,
    
    'common_steel_greatsword': 300, 'uncommon_steel_greatsword': 800, 'rare_steel_greatsword': 2000, 'epic_steel_greatsword': 5000,
    'rare_mythril_cleaver': 3000, 'epic_mythril_cleaver': 8000,
    
    'common_iron_dagger': 100, 'uncommon_iron_dagger': 300, 'rare_iron_dagger': 800, 'epic_iron_dagger': 2000,
    'rare_venom_shiv': 1200, 'epic_venom_shiv': 3500,
    'rare_shadow_blade': 5000, 'epic_shadow_blade': 15000, 'legendary_shadow_blade': 50000,
    
    'common_wood_staff': 100, 'uncommon_wood_staff': 300, 'rare_wood_staff': 800, 'epic_wood_staff': 2000,
    'rare_moonlight_staff': 1500, 'epic_moonlight_staff': 4000,
    'rare_meteor_staff': 5000, 'epic_meteor_staff': 15000, 'legendary_meteor_staff': 50000,
    
    'common_bone_scythe': 150, 'uncommon_bone_scythe': 400, 'rare_bone_scythe': 1000, 'epic_bone_scythe': 2500,
    'rare_soul_reaper': 1500, 'epic_soul_reaper': 4000,
    'rare_lich_tome': 6000, 'epic_lich_tome': 18000, 'legendary_lich_tome': 60000,

    // Armor
    'common_iron_helmet': 100, 'uncommon_iron_helmet': 300, 'rare_iron_helmet': 800, 'epic_iron_helmet': 2000,
    'common_iron_chestplate': 200, 'uncommon_iron_chestplate': 600, 'rare_iron_chestplate': 1500, 'epic_iron_chestplate': 4000,
    'common_iron_boots': 100, 'uncommon_iron_boots': 300, 'rare_iron_boots': 800, 'epic_iron_boots': 2000,
    
    // Forged Tools
    'common_iron_pickaxe': 150, 'uncommon_iron_pickaxe': 500, 'rare_iron_pickaxe': 1500,
    'common_steel_pickaxe': 400, 'uncommon_steel_pickaxe': 1200, 'rare_steel_pickaxe': 3000,
    'common_mythril_pickaxe': 1000, 'uncommon_mythril_pickaxe': 3000, 'rare_mythril_pickaxe': 8000,
  
    'common_iron_axe': 150, 'uncommon_iron_axe': 500, 'rare_iron_axe': 1500,
    'common_steel_axe': 400, 'uncommon_steel_axe': 1200, 'rare_steel_axe': 3000,
    'common_mythril_axe': 1000, 'uncommon_mythril_axe': 3000, 'rare_mythril_axe': 8000,
  
    // Blueprints
    'blueprint_iron_sword': 2000,
    'blueprint_steel_greatsword': 5000,
    'blueprint_mythril_cleaver': 15000,
    'blueprint_iron_dagger': 2000,
    'blueprint_venom_shiv': 5000,
    'blueprint_shadow_blade': 50000,
    'blueprint_wood_staff': 2000,
    'blueprint_moonlight_staff': 5000,
    'blueprint_meteor_staff': 50000,
    'blueprint_bone_scythe': 3000,
    'blueprint_soul_reaper': 8000,
    'blueprint_lich_tome': 60000,

    'blueprint_iron_helmet': 2000,
    'blueprint_iron_chestplate': 4000,
    'blueprint_iron_boots': 2000,
    
    'blueprint_iron_pickaxe': 3000,
    'blueprint_steel_pickaxe': 8000,
    'blueprint_mythril_pickaxe': 20000,
    'blueprint_iron_axe': 3000,
    'blueprint_steel_axe': 8000,
    'blueprint_mythril_axe': 20000,
    
    'blueprint_wolf_slayer': 10000,
    'blueprint_void_blade': 50000,

    // Gold Sinks (Non-refundable)
    'guild_charter': 0,
    'hero_title': 0,
    'castle_deed': 0,
};

export function getSellPrice(itemKey: string): number {
    return ITEM_SELL_PRICES[itemKey] || 1; // default to 1 gold for unknown items
}
