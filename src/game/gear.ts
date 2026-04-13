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
  // Starter Weapons (25g)
  rusty_sword: { id: 'rusty_sword', name: 'Rusty Sword', emoji: '🗡️', slot: 'weapon', price: 25, stats: { str: 2, agi: 1 } },
  wooden_bow: { id: 'wooden_bow', name: 'Wooden Bow', emoji: '🏹', slot: 'weapon', price: 25, stats: { dex: 3 } },
  chipped_wand: { id: 'chipped_wand', name: 'Chipped Wand', emoji: '🪄', slot: 'weapon', price: 25, stats: { int: 3 } },

  // Starter Armor (25g)
  copper_mail: { id: 'copper_mail', name: 'Copper Mail', emoji: '🛡️', slot: 'armor', price: 25, stats: { vit: 3, str: 1 } },
  leather_tunic: { id: 'leather_tunic', name: 'Leather Tunic', emoji: '🧥', slot: 'armor', price: 25, stats: { dex: 2, agi: 2 } },
  ripped_robes: { id: 'ripped_robes', name: 'Ripped Robes', emoji: '👘', slot: 'armor', price: 25, stats: { int: 2, vit: 1 } },
};
