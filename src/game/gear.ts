export type GearSlot = 'weapon' | 'helmet' | 'amulet' | 'ring' | 'armor' | 'boots' | 'gloves';

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

  // --- STARTER CHEST ARMOR (25g) ---
  copper_mail: { id: 'copper_mail', name: 'Copper Mail', emoji: '🛡️', slot: 'armor', price: 25, stats: { vit: 3, str: 1 } },
  leather_tunic: { id: 'leather_tunic', name: 'Leather Tunic', emoji: '🧥', slot: 'armor', price: 25, stats: { dex: 2, agi: 2 } },
  ripped_robes: { id: 'ripped_robes', name: 'Ripped Robes', emoji: '👘', slot: 'armor', price: 25, stats: { int: 2, vit: 1 } },

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
