export interface Material {
  id: string;
  name: string;
  emoji: string;
  rarity: 'common' | 'uncommon' | 'rare';
  dropChanceMultiplier: number; // For weighting the RNG
}

export const MATERIALS: Record<string, Material> = {
  wood: {
    id: 'wood',
    name: 'Wood',
    emoji: '🪵',
    rarity: 'common',
    dropChanceMultiplier: 1.0,
  },
  stone: {
    id: 'stone',
    name: 'Stone',
    emoji: '𪨗', // Or standard rock emoji 🪨
    rarity: 'common',
    dropChanceMultiplier: 1.0,
  },
  copper_ore: {
    id: 'copper_ore',
    name: 'Copper Ore',
    emoji: '🪨',
    rarity: 'uncommon',
    dropChanceMultiplier: 0.5,
  },
  wild_herbs: {
    id: 'wild_herbs',
    name: 'Wild Herbs',
    emoji: '🌿',
    rarity: 'common',
    dropChanceMultiplier: 0.8,
  }
};
