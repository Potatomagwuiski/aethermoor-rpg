export const ITEM_EMOJIS: Record<string, string> = {
    // Basic Materials
    'wood': '🪵',
    'iron': '🪨',
    'coal': '🌑',
    'mythril': '✨',
    'copper_ore': '🟤',
    'iron_ore': '🪨',
    'gold_ore': '🟡',
    
    // Ingots
    'copper_ingot': '🟧',
    'iron_ingot': '⬜',
    'steel_ingot': '⚙️',
    'mythril_ingot': '🌟',
    
    // Tools
    'basic_pickaxe': '⛏️',
    'iron_pickaxe': '⛏️',
    'steel_pickaxe': '⛏️',
    'mythril_pickaxe': '⛏️',
    'basic_axe': '🪓',
    'iron_axe': '🪓',
    'steel_axe': '🪓',
    'mythril_axe': '🪓',
    
    // Weapons
    'copper_sword': '🗡️',
    'iron_sword': '🗡️',
    'steel_sword': '⚔️',
    'mythril_sword': '🗡️',
    'copper_dagger': '🔪',
    'wood_staff': '🦯',
    'iron_staff': '🪄',
    
    // Blueprints
    'blueprint_iron_pickaxe': '📜',
    'blueprint_steel_pickaxe': '📜',
    'blueprint_mythril_pickaxe': '📜',
    'blueprint_iron_axe': '📜',
    'blueprint_steel_axe': '📜',
    'blueprint_mythril_axe': '📜',
    'blueprint_iron_sword': '📜',
    
    // Consumables
    'health_potion_1': '🧪',
    'health_potion_2': '🧪',
    'mana_potion_1': '🧪',
    
    // Default fallback
    'default': '📦'
};

export function getEmoji(itemKey: string): string {
    return ITEM_EMOJIS[itemKey] || ITEM_EMOJIS['default'];
}
