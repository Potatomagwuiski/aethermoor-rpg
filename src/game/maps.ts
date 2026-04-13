import { GameMap } from './types';

export const MAPS: Record<string, GameMap> = {
  whispering_woods: {
    id: 'whispering_woods',
    name: 'The Whispering Woods',
    description: 'A lush, relatively safe forest biome teeming with introductory wildlife and low-level slimes.',
    minLevel: 1,
    maxLevel: 5,
    emoji: '🌲'
  },
  shattered_coast: {
    id: 'shattered_coast',
    name: 'The Shattered Coast',
    description: 'A jagged coastline home to scuttling crustaceans and rogue tide-bandits. Watch your step on the slick rocks.',
    minLevel: 5,
    maxLevel: 10,
    emoji: '🌊'
  },
  undercity_sewers: {
    id: 'undercity_sewers',
    name: 'The Undercity Sewers',
    description: 'Toxic sludge, corrupted vermin, and exiled assassins rule the damp underground tunnels beneath the capital.',
    minLevel: 10,
    maxLevel: 15,
    emoji: '🧪'
  },
  crimson_keep: {
    id: 'crimson_keep',
    name: 'The Crimson Keep',
    description: 'A haunted, blood-stained fortress serving as the first major existential threat. Magic is heavy in the air here.',
    minLevel: 15,
    maxLevel: 20,
    emoji: '🏰'
  },
  fractured_abyss: {
    id: 'fractured_abyss',
    name: 'The Fractured Abyss',
    description: 'A chaotic dimension of pure energy. Only hardened veterans dare brave the twisting gravity and elite horrors inside.',
    minLevel: 20,
    maxLevel: 100, // Denotes endgame for now
    emoji: '🌌'
  }
};

/**
 * Helper function to retrieve a map by its ID safely.
 */
export function getMap(mapId: string): GameMap | undefined {
  return MAPS[mapId];
}

/**
 * Returns an array of all available maps, sorted by minimum level.
 */
export function getAllMaps(): GameMap[] {
  return Object.values(MAPS).sort((a, b) => a.minLevel - b.minLevel);
}
