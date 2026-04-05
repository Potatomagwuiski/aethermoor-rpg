export type ItemSlot = 'AD' | 'OFF' | 'AU' | 'AP' | 'AL' | 'AF' | 'AH' | 'AR' | 'AJ' | 'AV' | 'CONSUMABLE';
export type WeaponType = 'melee_fast' | 'melee_med' | 'melee_heavy' | 'bow' | 'rifle';
export type ArmorType = 'light' | 'heavy' | 'accessory';

// Base definitions for items before upgrades and modifiers
export interface BaseItem {
    id: string;
    name: string;
    description: string;
    icon: string;
    slot: ItemSlot;
    
    // Cost in gold
    basePrice: number;

    // For weapons
    weaponType?: WeaponType;
    minDmg?: number;
    maxDmg?: number;
    attackSpeed?: number;
    accuracyBonus?: number;

    // For armors
    armorType?: ArmorType;
    baseAc?: number;
    baseEv?: number;
    baseSh?: number;
    
    // Scale vectors (1.0 = 100% scale)
    strScale?: number;
    dexScale?: number;
    intScale?: number;
}

export const ITEM_REGISTRY: Record<string, BaseItem> = {
    // ---- WEAPONS ----
    "dagger": {
        id: "dagger", name: "Dagger", description: "A simple, fast blade.", icon: "🗡️",
        slot: "AD", basePrice: 40, weaponType: "melee_fast",
        minDmg: 2, maxDmg: 5, attackSpeed: 0.5, accuracyBonus: 5, dexScale: 1.5
    },
    "short_sword": {
        id: "short_sword", name: "Short Sword", description: "Standard issue blade.", icon: "⚔️", // Image had pickaxe symbol but let's use crossed swords or standard
        slot: "AD", basePrice: 90, weaponType: "melee_fast",
        minDmg: 4, maxDmg: 10, attackSpeed: 0.8, accuracyBonus: 3, dexScale: 1.2, strScale: 0.8
    },
    "sword": {
        id: "sword", name: "Sword", description: "Balanced weapon.", icon: "🗡️",
        slot: "AD", basePrice: 49, weaponType: "melee_med",
        minDmg: 5, maxDmg: 12, attackSpeed: 1.0, accuracyBonus: 0, dexScale: 1.0, strScale: 1.0
    },
    "greatsword": {
        id: "greatsword", name: "Greatsword", description: "Massive two-handed sword.", icon: "🗡️",
        slot: "AD", basePrice: 120, weaponType: "melee_heavy",
        minDmg: 15, maxDmg: 35, attackSpeed: 1.8, accuracyBonus: -5, strScale: 1.8
    },
    "mace": {
        id: "mace", name: "Mace", description: "Heavy blunt weapon.", icon: "🔨",
        slot: "AD", basePrice: 50, weaponType: "melee_heavy",
        minDmg: 8, maxDmg: 18, attackSpeed: 1.4, strScale: 1.6
    },
    "hatchet": {
        id: "hatchet", name: "Hatchet", description: "Small throwing axe.", icon: "🪓",
        slot: "AD", basePrice: 45, weaponType: "melee_med",
        minDmg: 4, maxDmg: 12, attackSpeed: 0.9, strScale: 1.1, dexScale: 0.5
    },
    "axe": {
        id: "axe", name: "Axe", description: "Heavy chopping weapon.", icon: "🪓",
        slot: "AD", basePrice: 95, weaponType: "melee_heavy",
        minDmg: 10, maxDmg: 25, attackSpeed: 1.6, strScale: 1.7
    },
    "spear": {
        id: "spear", name: "Spear", description: "Long reach, accurate.", icon: "🦯",
        slot: "AD", basePrice: 50, weaponType: "melee_med",
        minDmg: 6, maxDmg: 14, attackSpeed: 1.1, accuracyBonus: 10, dexScale: 1.0, strScale: 1.0
    },
    "trident": {
        id: "trident", name: "Trident", description: "Three-pronged spear.", icon: "🔱",
        slot: "AD", basePrice: 90, weaponType: "melee_med",
        minDmg: 8, maxDmg: 18, attackSpeed: 1.2, accuracyBonus: 5, dexScale: 0.8, strScale: 1.2
    },
    "flail": {
        id: "flail", name: "Flail", description: "Spiked ball on a chain.", icon: "🏏",
        slot: "AD", basePrice: 85, weaponType: "melee_heavy",
        minDmg: 2, maxDmg: 30, attackSpeed: 1.5, strScale: 1.5 // High variance
    },
    
    // CUSTOM REQUEST: Bows
    "shortbow": {
        id: "shortbow", name: "Shortbow", description: "Fires reliably from a distance.", icon: "🏹",
        slot: "AD", basePrice: 60, weaponType: "bow",
        minDmg: 3, maxDmg: 9, attackSpeed: 1.0, dexScale: 1.4
    },
    // CUSTOM REQUEST: Rifles
    "musket": {
        id: "musket", name: "Musket", description: "Slow to load, ignores massive armor.", icon: "🔫",
        slot: "AD", basePrice: 150, weaponType: "rifle",
        minDmg: 20, maxDmg: 40, attackSpeed: 2.5, intScale: 1.5
    },

    // ---- OFFHANDS ----
    "buckler": {
        id: "buckler", name: "Buckler", description: "Small shield.", icon: "🛡️",
        slot: "OFF", basePrice: 55, armorType: "light", baseSh: 8, baseEv: 2
    },
    "kite_shield": {
        id: "kite_shield", name: "Kite Shield", description: "Large defensive shield.", icon: "🛡️",
        slot: "OFF", basePrice: 145, armorType: "heavy", baseSh: 18, baseAc: 4, baseEv: -5
    },

    // ---- ARMORS ----
    "robe": {
        id: "robe", name: "Robe", description: "Cloth robes.", icon: "🥋",
        slot: "AR", basePrice: 30, armorType: "light", baseAc: 2, baseEv: 5
    },
    "leather_armor": {
        id: "leather_armor", name: "Leather Armor", description: "Basic leather protection.", icon: "🦺",
        slot: "AR", basePrice: 60, armorType: "light", baseAc: 6, baseEv: 3
    },
    "chainmail_armor": {
        id: "chainmail_armor", name: "Chainmail Armor", description: "Protective mail.", icon: "🎽",
        slot: "AR", basePrice: 110, armorType: "heavy", baseAc: 15, baseEv: -3
    },
    "plate_armor": {
        id: "plate_armor", name: "Plate Armor", description: "Impervious steel.", icon: "👕",
        slot: "AR", basePrice: 160, armorType: "heavy", baseAc: 25, baseEv: -10
    },

    // ---- ACCESSORIES ----
    "helmet": { id: "helmet", name: "Helmet", description: "Head protection.", icon: "⛑️", slot: "AU", basePrice: 60, baseAc: 4 },
    "boots": { id: "boots", name: "Boots", description: "Foot protection.", icon: "🥾", slot: "AV", basePrice: 70, baseAc: 2, baseEv: 2 },
    "gloves": { id: "gloves", name: "Gloves", description: "Hand protection.", icon: "🧤", slot: "AH", basePrice: 70, baseAc: 2, accuracyBonus: 2 },
    "cloak": { id: "cloak", name: "Cloak", description: "Shoulder protection.", icon: "🧥", slot: "AJ", basePrice: 70, baseAc: 1, baseEv: 4 },
    "amulet_shielding": { id: "amulet_shielding", name: "Amulet of Shielding", description: "Magical defense.", icon: "📿", slot: "AP", basePrice: 200, baseAc: 5 },
    "ring_fire": { id: "ring_fire", name: "Ring of Fire", description: "Magical ring.", icon: "💍", slot: "AL", basePrice: 150 }, // rFire handled by generated JSON modifiers later

    // ---- ENCHANTMENT SCROLLS (Not sold in shops usually basePrice=0, but we'll set to 0) ----
    "scroll_finesse": { id: "scroll_finesse", name: "Scroll of Finesse", description: "Enchants Daggers and Short Swords.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_heavy": { id: "scroll_heavy", name: "Scroll of Heavy Arms", description: "Enchants Maces, Axes, and Greatswords.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_standard": { id: "scroll_standard", name: "Scroll of Standard Arms", description: "Enchants Swords and Spears.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_ranged": { id: "scroll_ranged", name: "Scroll of Ranged Weaponry", description: "Enchants Bows and Rifles.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_light_ward": { id: "scroll_light_ward", name: "Scroll of the Light Ward", description: "Enchants Robes, Leather, and Bucklers.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_heavy_bastion": { id: "scroll_heavy_bastion", name: "Scroll of the Heavy Bastion", description: "Enchants Chainmail, Plate, and Kite Shields.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    
    "scroll_chaos": { id: "scroll_chaos", name: "Scroll of Chaos", description: "Rerolls the innate physical base stats of a weapon.", icon: "🌌", slot: "CONSUMABLE", basePrice: 0 },
    "scroll_cleansing": { id: "scroll_cleansing", name: "Scroll of Cleansing", description: "Wipes a weapon completely clean of all modifiers.", icon: "🧼", slot: "CONSUMABLE", basePrice: 0 },

    // ---- RAW MATERIALS ----
    "iron_ore": { id: "iron_ore", name: "Iron Ore", description: "Standard metal ore.", icon: "🪨", slot: "CONSUMABLE", basePrice: 5 },
    "oak_log": { id: "oak_log", name: "Oak Log", description: "Standard wood.", icon: "🪵", slot: "CONSUMABLE", basePrice: 5 },
    "goblin_herb": { id: "goblin_herb", name: "Goblin Herb", description: "A strange smelling plant.", icon: "🌿", slot: "CONSUMABLE", basePrice: 3 },
    "raw_salmon": { id: "raw_salmon", name: "Raw Salmon", description: "Fresh fish.", icon: "🐟", slot: "CONSUMABLE", basePrice: 8 },
    "goblin_ear": { id: "goblin_ear", name: "Goblin Ear", description: "Gruesome trophy.", icon: "👂", slot: "CONSUMABLE", basePrice: 4 },
    "spider_silk": { id: "spider_silk", name: "Spider Silk", description: "Strong binding material.", icon: "🕸️", slot: "CONSUMABLE", basePrice: 6 },

    // ---- FOOD ----
    "fish_stew": { id: "fish_stew", name: "Fish Stew", description: "Temporarily grants +10 STR.", icon: "🍲", slot: "CONSUMABLE", basePrice: 0 },
    "meat_stew": { id: "meat_stew", name: "Meat Stew", description: "Temporarily grants +50 HP.", icon: "🍲", slot: "CONSUMABLE", basePrice: 0 },

    // ---- RECIPE SCROLLS ----
    "recipe_fish_stew": { id: "recipe_fish_stew", name: "Recipe: Fish Stew", description: "Teaches you how to cook Fish Stew.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
    "recipe_upgrade_short_sword": { id: "recipe_upgrade_short_sword", name: "Blacksmith Blueprint: Short Sword", description: "Teaches you the upgrade schematic for Short Swords.", icon: "📜", slot: "CONSUMABLE", basePrice: 0 },
};
