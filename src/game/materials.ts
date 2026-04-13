export type ProfessionCategory = 'mining' | 'woodcutting' | 'fishing' | 'herbalism';

export interface Material {
  id: string;
  name: string;
  emoji: string;
  category: ProfessionCategory; // Specifies which command drops this
  rarity: 'common' | 'uncommon' | 'rare';
  dropChanceMultiplier: number; // For weighting the RNG
}

export const MATERIALS: Record<string, Material> = {
  // Woodcutting
  wood: { id: 'wood', name: 'Wood', emoji: '🪵', category: 'woodcutting', rarity: 'common', dropChanceMultiplier: 1.0 },
  
  // Mining
  stone: { id: 'stone', name: 'Stone', emoji: '𪨗', category: 'mining', rarity: 'common', dropChanceMultiplier: 1.0 },
  copper_ore: { id: 'copper_ore', name: 'Copper Ore', emoji: '🪨', category: 'mining', rarity: 'uncommon', dropChanceMultiplier: 0.5 },
  
  // Herbalism
  wild_herbs: { id: 'wild_herbs', name: 'Wild Herbs', emoji: '🌿', category: 'herbalism', rarity: 'common', dropChanceMultiplier: 0.8 },
  
  // Fishing
  raw_trout: { id: 'raw_trout', name: 'Raw Trout', emoji: '🐟', category: 'fishing', rarity: 'common', dropChanceMultiplier: 1.0 },
  raw_salmon: { id: 'raw_salmon', name: 'Raw Salmon', emoji: '🍣', category: 'fishing', rarity: 'uncommon', dropChanceMultiplier: 0.5 }
};
