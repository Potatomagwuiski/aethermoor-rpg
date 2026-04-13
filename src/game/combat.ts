import { User } from '@prisma/client';
import { STANCES, ACTIONS, REACTIONS, Stance, Action, Reaction } from './items';

export interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  stats: { str: number; dex: number; vit: number; int: number; };
  loadout: { stance?: Stance; action?: Action; reaction?: Reaction; };
  
  // Active State for Fractional Time Combat
  state: {
    stealth: boolean;
    shieldHp: number;
    nextActionTick: number; // Time until they can attack
  };
}

export function buildFighter(name: string, stats: any, loadout: any): Fighter {
  const hp = 50 + (stats.vit * 10);
  const stanceModifiers = loadout.stance?.modifiers || {};
  
  return {
    name,
    hp,
    maxHp: hp,
    level: 5,
    stats,
    loadout,
    state: {
      stealth: stanceModifiers.stealthEntry || false,
      shieldHp: stanceModifiers.shieldBonus || 0,
      nextActionTick: 0 // Everyone rolls initiative at start, but let's base it on dex later
    }
  };
}

const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function resolveCombat(fighterA: Fighter, fighterB: Fighter): string[] {
  const logs: string[] = [];
  const MAX_TICKS = 1500;
  
  // Initiative based on DEX
  fighterA.state.nextActionTick = Math.max(0, 50 - fighterA.stats.dex);
  fighterB.state.nextActionTick = Math.max(0, 50 - fighterB.stats.dex);

  logs.push(`*Combat begins! Fighters take position.*`);
  if (fighterA.state.stealth) logs.push(`🌫️ ${fighterA.name} vanishes into the shadows!`);
  if (fighterB.state.stealth) logs.push(`🌫️ ${fighterB.name} vanishes into the shadows!`);

  for (let tick = 0; tick <= MAX_TICKS; tick++) {
    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;

    // Check if it's A's turn
    if (tick === fighterA.state.nextActionTick) {
      executeAction(fighterA, fighterB, tick, logs);
      scheduleNextAction(fighterA);
    }
    
    if (fighterA.hp <= 0 || fighterB.hp <= 0) break;

    // Check if it's B's turn
    if (tick === fighterB.state.nextActionTick) {
      executeAction(fighterB, fighterA, tick, logs);
      scheduleNextAction(fighterB);
    }
  }

  logs.push(`\n**--- COMBAT OVER ---**`);
  if (fighterA.hp > 0 && fighterB.hp <= 0) logs.push(`🏆 **${fighterA.name} wins!** HP: ${fighterA.hp}`);
  else if (fighterB.hp > 0 && fighterA.hp <= 0) logs.push(`🏆 **${fighterB.name} wins!** HP: ${fighterB.hp}`);
  else logs.push(`⏳ **Draw due to time limit!**`);

  return logs;
}

function scheduleNextAction(fighter: Fighter) {
  const action = fighter.loadout.action;
  if (!action) {
    fighter.state.nextActionTick += 100; // default delay
    return;
  }
  
  const speedMult = fighter.loadout.stance?.modifiers?.speedMult || 1.0;
  // Let Dex reduce action delay slightly: roughly 1% faster per point of Dex
  const dexReduction = Math.max(0.5, 1 - (fighter.stats.dex * 0.01)); 
  
  const totalDelay = Math.floor(action.baseSpeed * speedMult * dexReduction);
  fighter.state.nextActionTick += totalDelay;
}

function executeAction(attacker: Fighter, defender: Fighter, tick: number, logs: string[]) {
  const action = attacker.loadout.action;
  if (!action) {
    logs.push(`[Tick ${tick}] ${attacker.name} waits idly.`);
    return;
  }

  logs.push(`\n[Tick ${tick}] ⚔️ **${attacker.name}** attacks with **${action.name}**!`);

  // --- STEALTH AMBUSH CHECK ---
  let isAmbush = false;
  if (attacker.state.stealth) {
    isAmbush = true;
    attacker.state.stealth = false; // Attacking breaks stealth unless a skill says otherwise
    logs.push(`🔪 *AMBUSH! ${attacker.name} strikes from the shadows, guaranteeing a critical hit!*`);
  }

  // --- DEFENSE LAYER 1: EVASION ---
  const defStanceMods = defender.loadout.stance?.modifiers || {};
  let evadeChance = 5 + Math.floor(defender.stats.dex / 2) + (defStanceMods.evadeBonus || 0);
  evadeChance = Math.max(0, Math.min(80, evadeChance)); 

  // If stealthed, you cannot be evaded easily (skip evasion logic)
  if (!isAmbush && rand(0, 100) < evadeChance) {
    logs.push(`💨 ${defender.name} neatly evaded the strike!`);
    if (defender.loadout.reaction?.trigger === 'onEvade') {
        const react = defender.loadout.reaction.effect(defender, attacker, 0);
        logs.push(react.log);
        if (react.applyStealth) defender.state.stealth = true;
    }
    return;
  }

  // --- RAW DAMAGE CALCULATION ---
  const attStanceMods = attacker.loadout.stance?.modifiers || {};
  const baseStatVal = attacker.stats[action.scaleStat];
  const dmgMult = attStanceMods.damageMult ?? 1.0;
  
  let rawDamage = Math.max(1, Math.floor(baseStatVal * action.basePower * dmgMult));
  
  // Crit Check
  let isCrit = isAmbush; // Ambush = auto crit
  if (!isCrit) {
    let critChance = 5 + Math.floor(attacker.stats.dex / 2) + (attStanceMods.critBonus || 0);
    if (rand(0, 100) < critChance) isCrit = true;
  }
  
  if (isCrit) {
    rawDamage = Math.floor(rawDamage * 1.5);
    logs.push(`💥 **Critical Strike!**`);
  }

  // --- DEFENSE LAYER 2: ARMOR CLASS (AC) ---
  // AC acts as % mitigation: Formula: Damage = Raw * (100 / (100 + AC)). Also uses vit for base flat AC.
  const armorClass = defender.stats.vit + (defStanceMods.acBonus || 0);
  let mitigatedDamage = rawDamage;
  if (armorClass > 0) mitigatedDamage = Math.floor(rawDamage * (100 / (100 + armorClass)));
  else if (armorClass < 0) mitigatedDamage = Math.floor(rawDamage * (1 + Math.abs(armorClass)*0.01)); // Negative AC takes more damage

  // --- DEFENSE LAYER 3: SHIELD (WARD HP) ---
  if (defender.state.shieldHp > 0) {
    if (defender.state.shieldHp >= mitigatedDamage) {
      defender.state.shieldHp -= mitigatedDamage;
      logs.push(`🛡️ The attack hit ${defender.name}'s shield! (Shield HP left: ${defender.state.shieldHp})`);
      mitigatedDamage = 0;
    } else {
      const remainder = mitigatedDamage - defender.state.shieldHp;
      logs.push(`🛡️ The attacks shattered ${defender.name}'s shield and dealt ${remainder} overflow carry-through damage!`);
      defender.state.shieldHp = 0;
      mitigatedDamage = remainder;
    }
  }

  // Final Health applied
  if (mitigatedDamage > 0) {
     defender.hp -= mitigatedDamage;
     logs.push(`🩸 ${defender.name} takes **${mitigatedDamage}** damage!`);
     
     // onHitTaken Reaction
     if (defender.loadout.reaction?.trigger === 'onHitTaken') {
        const react = defender.loadout.reaction.effect(defender, attacker, mitigatedDamage);
        logs.push(react.log);
        if (react.damageDealtToTarget) attacker.hp -= react.damageDealtToTarget;
     }
  } else {
     logs.push(`🛡️ Attack completely mitigated.`);
  }
}
