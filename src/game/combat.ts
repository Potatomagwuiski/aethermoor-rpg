import { User } from '@prisma/client';
import { STANCES, ACTIONS, REACTIONS, Stance, Action, Reaction } from './items';

export interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  stats: { str: number; dex: number; vit: number; int: number; };
  loadout: { stance?: Stance; action?: Action; reaction?: Reaction; };
  
  state: {
    stealth: boolean;
    shieldHp: number;
    nextActionTick: number; 
  };
}

export interface Encounter {
  distance: number;
}

export function buildFighter(name: string, stats: any, loadout: any): Fighter {
  const hp = 50 + (stats.vit * 10);
  const stanceModifiers = loadout.stance?.modifiers || {};
  return {
    name, hp, maxHp: hp, level: 5, stats, loadout,
    state: {
      stealth: stanceModifiers.stealthEntry || false,
      shieldHp: stanceModifiers.shieldBonus || 0,
      nextActionTick: 0
    }
  };
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export interface CombatResult {
  winner: string;
  loser: string;
  ticks: number;
  playerHpLeft: number;
  logs: string[];
}

export function resolveCombat(fighterA: Fighter, fighterB: Fighter): CombatResult {
  const logs: string[] = [];
  const MAX_TICKS = 1500;
  
  // Encounter starts explicitly at 4 to 10 tiles away as requested
  const encounter: Encounter = { distance: rand(4, 10) };

  fighterA.state.nextActionTick = Math.max(0, 50 - fighterA.stats.dex);
  fighterB.state.nextActionTick = Math.max(0, 50 - fighterB.stats.dex);

  logs.push(`*Combat begins! Fighters start ${encounter.distance} tiles apart.*`);
  if (fighterA.state.stealth) logs.push(`🌫️ ${fighterA.name} vanishes into the shadows!`);
  if (fighterB.state.stealth) logs.push(`🌫️ ${fighterB.name} vanishes into the shadows!`);

  let finalTick = 0;
  for (let tick = 0; tick <= MAX_TICKS; tick++) {
    finalTick = tick;
    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;

    // Resolve turns sequentially based on tick timeline
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

  logs.push(`\n**--- COMBAT OVER ---**`);
  
  let winner = "Draw";
  let loser = "Draw";
  if (fighterA.hp > 0 && fighterB.hp <= 0) {
     winner = fighterA.name;
     loser = fighterB.name;
     logs.push(`🏆 **${fighterA.name} wins!** HP: ${fighterA.hp}`);
  }
  else if (fighterB.hp > 0 && fighterA.hp <= 0) {
     winner = fighterB.name;
     loser = fighterA.name;
     logs.push(`🏆 **${fighterB.name} wins!** HP: ${fighterB.hp}`);
  }
  else logs.push(`⏳ **Draw due to time limit!**`);

  return {
    winner,
    loser,
    ticks: finalTick,
    playerHpLeft: fighterA.hp,
    logs
  };
}

function scheduleNextAction(fighter: Fighter, executedFullAttack: boolean) {
  const action = fighter.loadout.action;
  const speedMult = fighter.loadout.stance?.modifiers?.speedMult || 1.0;
  const dexReduction = Math.max(0.5, 1 - (fighter.stats.dex * 0.01)); 

  let baseDelay = 50; 
  if (executedFullAttack && action) baseDelay = action.baseSpeed;

  const totalDelay = Math.floor(baseDelay * speedMult * dexReduction);
  fighter.state.nextActionTick += totalDelay;
}

function executeTurn(actor: Fighter, target: Fighter, tick: number, encounter: Encounter, logs: string[]): boolean {
  const action = actor.loadout.action;
  if (!action) return false;

  if (encounter.distance > action.range) {
    encounter.distance -= 1;
    logs.push(`[Tick ${tick}] 🏃 ${actor.name} dashes closer! (Distance: ${encounter.distance} tiles)`);
    return true; // Returned true, meaning they moved
  }


  logs.push(`\n[Tick ${tick}] ⚔️ **${actor.name}** attacks with **${action.name}**!`);

  let isAmbush = false;
  if (actor.state.stealth) {
    isAmbush = true;
    actor.state.stealth = false; 
    logs.push(`🔪 *AMBUSH! ${actor.name} strikes from the shadows, guaranteeing a critical hit!*`);
  }

  const defStanceMods = target.loadout.stance?.modifiers || {};
  let evadeChance = 5 + Math.floor(target.stats.dex / 2) + (defStanceMods.evadeBonus || 0);
  evadeChance = Math.max(0, Math.min(80, evadeChance)); 

  if (!isAmbush && rand(0, 100) < evadeChance) {
    logs.push(`💨 ${target.name} evaded the strike!`);
    if (target.loadout.reaction?.trigger === 'onEvade') {
        const react = target.loadout.reaction.effect(target, actor, 0);
        logs.push(react.log);
        if (react.applyStealth) target.state.stealth = true;
    }
    return false;
  }

  const attStanceMods = actor.loadout.stance?.modifiers || {};
  const baseStatVal = actor.stats[action.scaleStat];
  const dmgMult = attStanceMods.damageMult ?? 1.0;
  
  let rawDamage = Math.max(1, Math.floor(baseStatVal * action.basePower * dmgMult));
  
  let isCrit = isAmbush; 
  if (!isCrit) {
    let critChance = 5 + Math.floor(actor.stats.dex / 2) + (attStanceMods.critBonus || 0);
    if (rand(0, 100) < critChance) isCrit = true;
  }
  
  if (isCrit) {
    rawDamage = Math.floor(rawDamage * 1.5);
    logs.push(`💥 **Critical Strike!**`);
  }

  // AC layer
  const armorClass = target.stats.vit + (defStanceMods.acBonus || 0);
  let mitigatedDamage = rawDamage;
  if (armorClass > 0) mitigatedDamage = Math.floor(rawDamage * (100 / (100 + armorClass)));
  else if (armorClass < 0) mitigatedDamage = Math.floor(rawDamage * (1 + Math.abs(armorClass)*0.01));

  // Shield layer
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
     logs.push(`🩸 ${target.name} takes **${mitigatedDamage}** damage!`);
     
     if (target.loadout.reaction?.trigger === 'onHitTaken') {
        const react = target.loadout.reaction.effect(target, actor, mitigatedDamage);
        logs.push(react.log);
        if (react.damageDealtToTarget) actor.hp -= react.damageDealtToTarget;
        if (react.pushback) {
           encounter.distance += react.pushback;
           logs.push(`🛡️ *Pushback! The distance is now ${encounter.distance} tiles.*`);
        }
     }
  }

  return false;
}
