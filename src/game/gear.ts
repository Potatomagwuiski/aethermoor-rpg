export type GearSlot = 'weapon' | 'helmet' | 'amulet' | 'ring' | 'armor' | 'boots' | 'gloves' | 'cloak';

export interface Gear {
  id: string;
  name: string;
  emoji: string;
  slot: GearSlot;
  price: number;
  stats: {
    str?: number;
    dex?: number;
    vit?: number;
    agi?: number;
    int?: number;
  };
}

export const GEAR: Record<string, Gear> = {
  // --- STARTER WEAPONS (25g) ---
  rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', emoji: '🗡️', slot: 'weapon', price: 25, stats: { str: 2, agi: 1 } },
  wooden_bow: { id: 'wooden_bow', name: 'Wooden Bow', emoji: '🏹', slot: 'weapon', price: 25, stats: { dex: 3 } },
  chipped_wand: { id: 'chipped_wand', name: 'Chipped Wand', emoji: '🪄', slot: 'weapon', price: 25, stats: { int: 3 } },
  iron_dagger: { id: 'iron_dagger', name: 'Iron Dagger', emoji: '🔪', slot: 'weapon', price: 25, stats: { dex: 2, agi: 1 } },
  dull_axe: { id: 'dull_axe', name: 'Dull Axe', emoji: '🪓', slot: 'weapon', price: 25, stats: { str: 3 } },
  heavy_mace: { id: 'heavy_mace', name: 'Heavy Mace', emoji: '🔨', slot: 'weapon', price: 25, stats: { str: 2, vit: 1 } },
  wooden_spear: { id: 'wooden_spear', name: 'Wooden Spear', emoji: '🔱', slot: 'weapon', price: 25, stats: { str: 1, dex: 2 } },
  light_crossbow: { id: 'light_crossbow', name: 'Light Crossbow', emoji: '🏹', slot: 'weapon', price: 25, stats: { dex: 2, str: 1 } },
  gnarled_staff: { id: 'gnarled_staff', name: 'Gnarled Staff', emoji: '🏑', slot: 'weapon', price: 25, stats: { int: 2, vit: 1 } },
  iron_scythe: { id: 'iron_scythe', name: 'Iron Scythe', emoji: '🌾', slot: 'weapon', price: 25, stats: { int: 1, str: 2 } },
  leather_knuckles: { id: 'leather_knuckles', name: 'Leather Knuckles', emoji: '🤜', slot: 'weapon', price: 25, stats: { agi: 2, str: 1 } },

  // --- STARTER CHEST ARMOR (25g) ---
  copper_mail: { id: 'copper_mail', name: 'Copper Mail', emoji: '🛡️', slot: 'armor', price: 25, stats: { vit: 3, str: 1 } },
  leather_tunic: { id: 'leather_tunic', name: 'Leather Tunic', emoji: '🧥', slot: 'armor', price: 25, stats: { dex: 2, agi: 2 } },
  ripped_robes: { id: 'ripped_robes', name: 'Ripped Robes', emoji: '👘', slot: 'armor', price: 25, stats: { int: 2, vit: 1 } },
  bronze_plate: { id: 'bronze_plate', name: 'Bronze Plate', emoji: '🦺', slot: 'armor', price: 25, stats: { vit: 4 } },
  chainmail_hauberk: { id: 'chainmail_hauberk', name: 'Chainmail Hauberk', emoji: '👕', slot: 'armor', price: 25, stats: { vit: 2, str: 1, agi: 1 } },
  silk_vest: { id: 'silk_vest', name: 'Silk Vest', emoji: '🥻', slot: 'armor', price: 25, stats: { int: 2, agi: 2 } },
  hunters_garb: { id: 'hunters_garb', name: 'Hunter\'s Garb', emoji: '🎽', slot: 'armor', price: 25, stats: { dex: 2, vit: 2 } },

  // --- STARTER CLOAKS (20g) ---
  simple_cape: { id: 'simple_cape', name: 'Simple Cape', emoji: '🦸', slot: 'cloak', price: 20, stats: { vit: 1, agi: 1 } },
  tattered_cloak: { id: 'tattered_cloak', name: 'Tattered Cloak', emoji: '🧛', slot: 'cloak', price: 20, stats: { dex: 1, agi: 1 } },
  travelers_mantle: { id: 'travelers_mantle', name: 'Traveler\'s Mantle', emoji: '🧝', slot: 'cloak', price: 20, stats: { int: 1, vit: 1 } },
  heavy_cowl: { id: 'heavy_cowl', name: 'Heavy Cowl', emoji: '🥷', slot: 'cloak', price: 20, stats: { str: 1, vit: 1 } },

  // --- STARTER HELMETS (15g) ---
  iron_coif: { id: 'iron_coif', name: 'Iron Coif', emoji: '🪖', slot: 'helmet', price: 15, stats: { vit: 2 } },
  leather_cap: { id: 'leather_cap', name: 'Leather Cap', emoji: '🧢', slot: 'helmet', price: 15, stats: { agi: 1, dex: 1 } },
  apprentice_hood: { id: 'apprentice_hood', name: 'Apprentice Hood', emoji: '🧙', slot: 'helmet', price: 15, stats: { int: 2 } },

  // --- STARTER BOOTS (15g) ---
  heavy_sabatons: { id: 'heavy_sabatons', name: 'Heavy Sabatons', emoji: '🥾', slot: 'boots', price: 15, stats: { vit: 1, str: 1 } },
  leather_boots: { id: 'leather_boots', name: 'Leather Boots', emoji: '👢', slot: 'boots', price: 15, stats: { agi: 2 } },
  cloth_shoes: { id: 'cloth_shoes', name: 'Cloth Shoes', emoji: '👞', slot: 'boots', price: 15, stats: { int: 1, agi: 1 } },

  // --- STARTER GLOVES (15g) ---
  iron_gauntlets: { id: 'iron_gauntlets', name: 'Iron Gauntlets', emoji: '🧤', slot: 'gloves', price: 15, stats: { str: 2 } },
  leather_gloves: { id: 'leather_gloves', name: 'Leather Gloves', emoji: '🧤', slot: 'gloves', price: 15, stats: { dex: 2 } },
  cloth_mitts: { id: 'cloth_mitts', name: 'Cloth Mitts', emoji: '🧤', slot: 'gloves', price: 15, stats: { int: 2 } },

  // --- STARTER ACCESSORIES (50g - Slightly more premium) ---
  brass_amulet: { id: 'brass_amulet', name: 'Brass Amulet', emoji: '🧿', slot: 'amulet', price: 50, stats: { vit: 3, str: 2 } },
  bone_necklace: { id: 'bone_necklace', name: 'Bone Necklace', emoji: '📿', slot: 'amulet', price: 50, stats: { dex: 3, agi: 2 } },
  glass_pendant: { id: 'glass_pendant', name: 'Glass Pendant', emoji: '🔮', slot: 'amulet', price: 50, stats: { int: 4, vit: 1 } },

  copper_ring: { id: 'copper_ring', name: 'Copper Ring', emoji: '💍', slot: 'ring', price: 40, stats: { str: 2 } },
  wooden_band: { id: 'wooden_band', name: 'Wooden Band', emoji: '🪵', slot: 'ring', price: 40, stats: { dex: 2 } },
  glass_ring: { id: 'glass_ring', name: 'Glass Ring', emoji: '💎', slot: 'ring', price: 40, stats: { int: 2 } },
};
