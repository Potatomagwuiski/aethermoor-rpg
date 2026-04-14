import { ITEMS, Item, Action, Reaction } from './items';

export interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  stats: { str: number; dex: number; vit: number; int: number; };
  equipment: Item[];
  
  stanceMods: { 
    damageMult: number; evadeBonus: number; acBonus: number; shieldBonus: number; speedMult: number; critBonus: number; 
    chronosFirstStrike: boolean; maxHpMult: number; evadeCapOverride?: number; pacifism: boolean; realityFractureChance: number;
  };
  primaryAction?: Action;
  reactions: Reaction[];

  state: {
    stealth: boolean;
    shieldHp: number;
    nextActionTick: number; 
    totalWeight: number;
    maxWeight: number;
    encumbranceFactor: number;
  };
}

export interface Encounter { distance: number; }

export function buildFighter(name: string, stats: any, equipmentIds: string[]): Fighter {
  let hp = 50 + (stats.vit * 10);
  const equipment = equipmentIds.map(id => ITEMS[id]).filter(Boolean);
  
  const stanceMods = { 
    damageMult: 1.0, evadeBonus: 0, acBonus: 0, shieldBonus: 0, speedMult: 1.0, critBonus: 0, 
    chronosFirstStrike: false, maxHpMult: 1.0, evadeCapOverride: undefined as number | undefined, pacifism: false, realityFractureChance: 0
  };
  
  let primaryAction: Action | undefined = undefined;
  const reactions: Reaction[] = [];
  let stealthEntry = false;
  let totalWeight = 0;

  for (const item of equipment) {
    if (item.weight) totalWeight += item.weight;
    if (item.modifiers.damageMult) stanceMods.damageMult *= item.modifiers.damageMult;
    if (item.modifiers.evadeBonus !== undefined) stanceMods.evadeBonus += item.modifiers.evadeBonus;
    if (item.modifiers.acBonus !== undefined) stanceMods.acBonus += item.modifiers.acBonus;
    if (item.modifiers.shieldBonus !== undefined) stanceMods.shieldBonus += item.modifiers.shieldBonus;
    if (item.modifiers.speedMult !== undefined) stanceMods.speedMult *= item.modifiers.speedMult;
    if (item.modifiers.critBonus !== undefined) stanceMods.critBonus += item.modifiers.critBonus;
    if (item.modifiers.stealthEntry) stealthEntry = true;
    if (item.modifiers.chronosFirstStrike) stanceMods.chronosFirstStrike = true;
    if (item.modifiers.maxHpMult) stanceMods.maxHpMult *= item.modifiers.maxHpMult;
    if (item.modifiers.evadeCapOverride !== undefined) stanceMods.evadeCapOverride = item.modifiers.evadeCapOverride;
    if (item.modifiers.pacifism) stanceMods.pacifism = true;
    if (item.modifiers.realityFractureChance) stanceMods.realityFractureChance += item.modifiers.realityFractureChance;

    if (item.grantedAction) primaryAction = item.grantedAction; 
    if (item.grantedReaction) reactions.push(item.grantedReaction);
  }

  hp = Math.floor(hp * stanceMods.maxHpMult);

  const maxWeight = 10 + (stats.str * 3);
  let encumbranceFactor = 0;
  if (totalWeight > maxWeight) {
    encumbranceFactor = totalWeight - maxWeight;
    stanceMods.speedMult *= (1 + (encumbranceFactor * 0.03));
    stanceMods.evadeBonus -= encumbranceFactor;
  }

  return {
    name, hp, maxHp: hp, level: 5, stats, equipment,
    stanceMods, primaryAction, reactions,
    state: {
      stealth: stealthEntry, shieldHp: stanceMods.shieldBonus, nextActionTick: 0,
      totalWeight, maxWeight, encumbranceFactor
    }
  };
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export interface CombatResult { winner: string; loser: string; ticks: number; playerHpLeft: number; logs: string[]; }

export function resolveCombat(fighterA: Fighter, fighterB: Fighter): CombatResult {
  const logs: string[] = [];
  const MAX_TICKS = 1500;
  const encounter: Encounter = { distance: rand(4, 10) };

  fighterA.state.nextActionTick = fighterA.stanceMods.chronosFirstStrike ? 0 : Math.max(0, 50 - fighterA.stats.dex);
  fighterB.state.nextActionTick = fighterB.stanceMods.chronosFirstStrike ? 0 : Math.max(0, 50 - fighterB.stats.dex);

  logs.push(`*Combat begins! Fighters start ${encounter.distance} tiles apart.*`);
  if (fighterA.state.stealth) logs.push(`🌫️ ${fighterA.name} vanishes into the shadows!`);
  if (fighterB.state.stealth) logs.push(`🌫️ ${fighterB.name} vanishes into the shadows!`);

  let finalTick = 0;
  for (let tick = 0; tick <= MAX_TICKS; tick++) {
    finalTick = tick;
    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;

    // Check Cloak distances passively
    if (encounter.distance >= 5) {
      if (fighterA.equipment.find(i=>i.id==='cloak_of_shadow_walker') && !fighterA.state.stealth) fighterA.state.stealth = true;
      if (fighterB.equipment.find(i=>i.id==='cloak_of_shadow_walker') && !fighterB.state.stealth) fighterB.state.stealth = true;
    }

    if (tick === fighterA.state.nextActionTick) {
      const moved = executeTurn(fighterA, fighterB, tick, encounter, logs);
      scheduleNextAction(fighterA, !moved);
    }
    
    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;

    if (tick === fighterB.state.nextActionTick) {
      const moved = executeTurn(fighterB, fighterA, tick, encounter, logs);
      scheduleNextAction(fighterB, !moved);
    }
  }

  let winner = "Draw"; let loser = "Draw";
  if (fighterA.hp > 0 && fighterB.hp <= 0) { winner = fighterA.name; loser = fighterB.name; logs.push(`🏆 **${fighterA.name} wins!** HP: ${fighterA.hp}`); }
  else if (fighterB.hp > 0 && fighterA.hp <= 0) { winner = fighterB.name; loser = fighterA.name; logs.push(`🏆 **${fighterB.name} wins!** HP: ${fighterB.hp}`); }
  else logs.push(`⏳ **Draw due to time limit!**`);

  return { winner, loser, ticks: finalTick, playerHpLeft: fighterA.hp, logs };
}

function scheduleNextAction(fighter: Fighter, executedFullAttack: boolean) {
  const action = fighter.primaryAction;
  const speedMult = fighter.stanceMods.speedMult;
  const dexReduction = Math.max(0.5, 1 - (fighter.stats.dex * 0.01)); 

  let baseDelay = 50; 
  if (executedFullAttack && action) baseDelay = action.baseSpeed;

  const totalDelay = Math.floor(baseDelay * speedMult * dexReduction);
  fighter.state.nextActionTick += Math.max(1, totalDelay); // Minimum 1 tick delay
}

function processReactions(trigger: Reaction['trigger'], actor: Fighter, target: Fighter, logs: string[], value: number = 0) {
  for (const r of target.reactions) {
    if (r.trigger === trigger) {
      const react = r.effect(target, actor, value);
      if (react.log) logs.push(react.log);
      if (react.applyStealth) target.state.stealth = true;
      if (react.damageDealtToTarget) {
        actor.hp -= react.damageDealtToTarget;
      }
      if (react.healUser) {
        target.hp = Math.min(target.maxHp, target.hp + react.healUser);
      }
      return react; // Return for explicit overrides like pushback
    }
  }
}

function executeTurn(actor: Fighter, target: Fighter, tick: number, encounter: Encounter, logs: string[]): boolean {
  if (actor.stanceMods.pacifism) {
    logs.push(`[Tick ${tick}] 🕊️ ${actor.name} simply walks the battlefield (Pacifism).`);
    return false;
  }

  const action = actor.primaryAction;
  if (!action) return false;

  if (encounter.distance > action.range) {
    encounter.distance -= 1;
    logs.push(`[Tick ${tick}] 🏃 ${actor.name} dashes into ${action.range} Range! (Distance: ${encounter.distance} tiles)`);
    return true; 
  }

  logs.push(`\n[Tick ${tick}] ⚔️ **${actor.name}** attacks with **${action.name}**!`);

  if (actor.stanceMods.realityFractureChance > 0) {
    if (rand(0, 100) < actor.stanceMods.realityFractureChance) {
      logs.push(`🌌 The attack slipped right through physical reality and did 0 damage! (Reality Fractured)`);
      return false;
    }
  }

  let isAmbush = false;
  if (actor.state.stealth) {
    isAmbush = true;
    actor.state.stealth = false; 
    logs.push(`🔪 *AMBUSH! ${actor.name} strikes from the shadows!*`);
  }

  const defStanceMods = target.stanceMods;
  let evadeChance = 5 + Math.floor(target.stats.dex / 2) + defStanceMods.evadeBonus;
  
  if (defStanceMods.evadeCapOverride !== undefined) {
    evadeChance = defStanceMods.evadeCapOverride; // E.g. Stagnant Heart forces 0
  } else {
    evadeChance = Math.max(0, Math.min(80, evadeChance)); 
  }

  if (!isAmbush && rand(0, 100) < evadeChance) {
    logs.push(`💨 ${target.name} evaded the strike!`);
    processReactions('onEvade', actor, target, logs, 0);
    return false;
  }

  const attStanceMods = actor.stanceMods;
  const statKey = action.scaleStat as keyof typeof actor.stats;
  const baseStatVal = actor.stats[statKey];
  
  let rawDamage = Math.max(1, Math.floor(baseStatVal * action.basePower * attStanceMods.damageMult));
  
  let isCrit = isAmbush; 
  if (!isCrit) {
    let critChance = 5 + Math.floor(actor.stats.dex / 2) + attStanceMods.critBonus;
    if (rand(0, 100) < critChance) isCrit = true;
  }
  
  if (isCrit) {
    rawDamage = Math.floor(rawDamage * 1.5);
    logs.push(`💥 **Critical Strike!** (${rawDamage} raw)`);
    processReactions('onCritDealt', target, actor, logs, rawDamage); // target=actor dealing it
  }

  const armorClass = target.stats.vit + defStanceMods.acBonus;
  let mitigatedDamage = rawDamage;
  if (armorClass > 0) mitigatedDamage = Math.floor(rawDamage * (100 / (100 + armorClass)));
  else if (armorClass < 0) mitigatedDamage = Math.floor(rawDamage * (1 + Math.abs(armorClass)*0.01));

  const totalMitigated = rawDamage - mitigatedDamage;
  if (totalMitigated > 0) {
    processReactions('onHitMitigated', actor, target, logs, totalMitigated);
  }

  if (target.state.shieldHp > 0) {
    if (target.state.shieldHp >= mitigatedDamage) {
      target.state.shieldHp -= mitigatedDamage;
      logs.push(`🛡️ Shield absorbed the blow! (Shield HP left: ${target.state.shieldHp})`);
      mitigatedDamage = 0;
    } else {
      const rem = mitigatedDamage - target.state.shieldHp;
      logs.push(`🛡️ Shield shattered! Overkill damage: ${rem}`);
      target.state.shieldHp = 0;
      mitigatedDamage = rem;
    }
  }

  if (mitigatedDamage > 0) {
     target.hp -= mitigatedDamage;
     logs.push(`🩸 ${target.name} takes **${mitigatedDamage}** actual damage!`);
     
     const react = processReactions('onHitTaken', actor, target, logs, mitigatedDamage);
     if (react && react.pushback) {
       encounter.distance += react.pushback;
       logs.push(`🛡️ *Pushback! The distance is now ${encounter.distance} tiles.*`);
     }
  } else {
     logs.push(`🛡️ Attack completely mitigated.`);
  }

  return false;
}
