export const ITEM_EMOJIS: Record<string, string> = {
    // Basic Materials
    'wood': '🪵',
    'iron': '🪨',
    'coal': '🌑',
    'mythril': '✨',
    'copper_ore': '🟤',
    'iron_ore': '🪨',
    'gold_ore': '🟡',
    'elderwood': '🌳',
    'moon_herb': '🌿',
    
    // Tiered Mining Ores (World Zones)
    'copper': '🟤',
    'tin': '⚪',
    'silver': '💍',
    'steel_ore': '🪨',
    'obsidian': '⬛',
    'voidstone': '🌑',
    
    // Tiered Woods (World Zones)
    'ashwood': '🌳',
    'oakwood': '🪵',
    'aether_wood': '🌌',

    // Tiered Foraging (World Zones)
    'basic_herb': '🌾',
    'mooncap_mushroom': '🍄',
    'frost_lotus': '❄️',
    'cinderbloom': '🌺',
    'nightmare_kelp': '🦑',
    
    // Aquatic (Fishing)
    'seaweed': '🌿',
    'river_trout': '🐟',
    'golden_koi': '🐡',
    'glacier_cod': '🐟',
    'lava_eel': '🐍',
    'void_bass': '🦑',
    'golden_pearl': '🦪',
    
    // Ingots
    'copper_ingot': '🟧',
    'iron_ingot': '⬜',
    'steel_ingot': '⚙️',
    'mythril_ingot': '🌟',
    
    // Tools
    'basic_pickaxe': '⛏️',
    'bronze_pickaxe': '⛏️',
    'iron_pickaxe': '⛏️',
    'mythril_pickaxe': '⛏️',
    'basic_axe': '🪓',
    'bronze_axe': '🪓',
    'iron_axe': '🪓',
    'mythril_axe': '🪓',
    
    // Weapons
    'copper_sword': '🗡️',
    'bronze_sword': '🗡️',
    'steel_sword': '⚔️',
    'mythril_sword': '🗡️',
    
    'iron_greatsword': '⚔️',
    'mythril_cleaver': '🪓',
    'bronze_dagger': '🔪',
    'venom_shiv': '🦂',
    'shadow_blade': '🌌',
    'wood_staff': '🦯',
    'moonlight_staff': '🌔',
    'meteor_staff': '☄️',
    'bone_scythe': '🦴',
    'soul_reaper': '👻',
    'lich_tome': '📖',
    
    // Armor
    'bronze_helmet': '🪖',
    'bronze_chestplate': '👕',
    'iron_chestplate': '👕',
    'steel_chestplate': '👕',
    'bronze_boots': '👞',
    
    'leather_tunic': '🦺',
    'apprentice_robe': '🥋',
    'scout_cloak': '🧥',
    'mystic_robe': '👘',
    'shadow_tunic': '🥋',
    'lich_mantle': '🥻',
    
    // Blueprints
    'blueprint_bronze_pickaxe': '📜',
    'blueprint_iron_pickaxe': '📜',
    'blueprint_mythril_pickaxe': '📜',
    'blueprint_bronze_axe': '📜',
    'blueprint_iron_axe': '📜',
    'blueprint_mythril_axe': '📜',
    
    'blueprint_bronze_sword': '📜',
    'blueprint_iron_greatsword': '📜',
    'blueprint_mythril_cleaver': '📜',
    'blueprint_bronze_dagger': '📜',
    'blueprint_venom_shiv': '📜',
    'blueprint_shadow_blade': '📜',
    'blueprint_wood_staff': '📜',
    'blueprint_moonlight_staff': '📜',
    'blueprint_meteor_staff': '📜',
    'blueprint_bone_scythe': '📜',
    'blueprint_soul_reaper': '📜',
    'blueprint_lich_tome': '📜',

    'blueprint_iron_chestplate': '📜',
    'blueprint_steel_chestplate': '📜',
    'blueprint_scout_cloak': '📜',
    'blueprint_mystic_robe': '📜',
    'blueprint_shadow_tunic': '📜',
    'blueprint_lich_mantle': '📜',
    'blueprint_bronze_helmet': '📜',
    'blueprint_bronze_chestplate': '📜',
    'blueprint_bronze_boots': '📜',
    'blueprint_wolf_slayer': '📜',
    'blueprint_void_blade': '📜',
    
    // Sinks
    'guild_charter': '📜',
    'hero_title': '👑',
    'castle_deed': '🏰',
    
    // Consumables
    'health_potion_1': '🧪',
    'health_potion_2': '🧪',
    'mana_potion_1': '🧪',
    
    // Monster Drops
    'goblin_ear': '👺',
    'rusty_dagger': '🗡️',
    'slime_core': '💧',
    'acid_vial': '🧪',
    'wolf_pelt': '🐺',
    'wolf_fang': '🦴',
    'bat_wing': '🦇',
    'guano': '💩',
    'bone_shard': '🦴',
    'living_wood': '🌳',
    'stone_core': '🪨',
    'demon_horn': '👿',
    'hellfire_essence': '🔥',
    'shadow_dust': '🌑',
    'void_fragment': '🌌',
    'drake_scale': '🐉',
    'mythic_dragon_scale': '🟪',
    'dungeon_key': '🗝️',
    'rare_meteorite_ingot': '☄️',
    'lich_soul': '👻',
    'behemoth_bone': '🦖',
    
    // Universal Monster Cores
    'beast_core': '🐾',
    'monster_core': '👿',
    'abyssal_core': '👁️',
    'void_core': '🌌',
    
    // Default fallback
    'default': '📦'
};

export function getEmoji(itemKey: string): string {
    return ITEM_EMOJIS[itemKey] || ITEM_EMOJIS['default'];
}
