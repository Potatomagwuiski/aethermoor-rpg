export interface CompiledStats {
  str: number;
  dex: number;
  int: number;
  vit: number;
  hp: number;
  maxHp: number;
  
  // Derivations
  armor: number; 
  evasion: number; 
  critChance: number; 
  critMultiplier: number; 
  
  // Base Damage (from weapon primarily)
  minDamage: number;
  maxDamage: number;

  // Resistances (Percentage reduction 0-100)
  rFire: number;
  rCold: number;
  rLightning: number;
  rPoison: number;
  rHoly: number;
  rAcid: number;

  // Passives/Triggers gathered from weapons
  passives: string[];
}

export function compilePlayerStats(player: any): CompiledStats {
  // Base core derivations
  const stats: CompiledStats = {
    str: player.str,
    dex: player.dex,
    int: player.int,
    vit: player.vit,
    hp: player.hp,
    maxHp: player.maxHp,
    armor: Math.floor(player.vit * 1.5),
    evasion: 5 + Math.floor(player.dex * 0.5),
    critChance: 5 + Math.floor(player.dex * 0.25),
    critMultiplier: 1.5,
    minDamage: Math.floor(player.str * 1.5),
    maxDamage: player.str * 2,
    rFire: 0,
    rCold: 0,
    rLightning: 0,
    rPoison: 0,
    rHoly: 0,
    rAcid: 0,
    passives: []
  };

  const eq = player.equipment;
  if (!eq) return stats;

  const slots = ['mainHand', 'offHand', 'helmet', 'chest', 'gloves', 'boots', 'cloak', 'ring1', 'ring2', 'amulet'];

  for (const slotName of slots) {
    const item = eq[slotName];
    if (item) {
      stats.armor += (item.baseArmor || 0);
      
      // Weapon base damage
      if (item.baseDamage) {
        stats.minDamage += item.baseDamage;
        stats.maxDamage += Math.floor(item.baseDamage * 1.5);
      }

      const mod = typeof item.modifiers === 'string' ? JSON.parse(item.modifiers) : item.modifiers;
      if (mod && typeof mod === 'object') {
        if (mod.str) stats.str += mod.str;
        if (mod.dex) stats.dex += mod.dex;
        if (mod.int) stats.int += mod.int;
        if (mod.vit) stats.vit += mod.vit;
        
        if (mod.armor) stats.armor += mod.armor;
        if (mod.evasion) stats.evasion += mod.evasion;
        if (mod.critChance) stats.critChance += mod.critChance;
        
        if (mod.rFire) stats.rFire += mod.rFire;
        if (mod.rCold) stats.rCold += mod.rCold;
        if (mod.rLightning) stats.rLightning += mod.rLightning;
        if (mod.rPoison) stats.rPoison += mod.rPoison;
        if (mod.rHoly) stats.rHoly += mod.rHoly;
        if (mod.rAcid) stats.rAcid += mod.rAcid;
      }
      
      const pass = typeof item.passives === 'string' ? JSON.parse(item.passives) : item.passives;
      if (Array.isArray(pass)) {
         stats.passives.push(...pass);
      }
    }
  }
  
  // Recalculate maxHp based on final Vit if gear provided massive Vit
  stats.maxHp = 100 + (stats.vit * 10);
  
  return stats;
}
