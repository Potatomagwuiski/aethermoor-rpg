import { User } from '@prisma/client';
import { STANCES, ACTIONS, REACTIONS, Stance, Action, Reaction } from './items';

export interface Fighter {
  name: string;
  hp: number;
  maxHp: number;
  level: number;
  stats: {
    str: number;
    dex: number;
    vit: number;
    int: number;
  };
  loadout: {
    stance?: Stance;
    action?: Action;
    reaction?: Reaction;
  };
}

export function buildFighterFromUser(user: User, username: string): Fighter {
  const hp = 50 + (user.vitality * 5);
  return {
    name: username,
    hp: hp,
    maxHp: hp,
    level: user.level,
    stats: {    str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    loadout: {
      stance: user.stanceId ? STANCES[user.stanceId] : undefined,
      action: user.actionId ? ACTIONS[user.actionId] : undefined,
      reaction: user.reactionId ? REACTIONS[user.reactionId] : undefined,
    }
  };
}

// Helper for random integer
const rand = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;

export function resolveCombatTurn(attacker: Fighter, defender: Fighter): string[] {
  const logs: string[] = [];
  logs.push(`\n⚔️ **${attacker.name}'s turn!**`);

  // 1. Calculate Base Attack
  const action = attacker.loadout.action;
  if (!action) {
    logs.push(`${attacker.name} has no action equipped and flails wildly (0 damage).`);
    return logs;
  }

  // Calculate Base Stats
  const baseStatVal = attacker.stats[action.scaleStat];
  const stanceModifiers = attacker.loadout.stance?.modifiers || {};
  const defenseModifiers = defender.loadout.stance?.modifiers || {};

  // Crit & Evade Chances
  let critChance = 5 + Math.floor(attacker.stats.dex / 2) + (stanceModifiers.critBonus || 0);
  let evadeChance = 5 + Math.floor(defender.stats.dex / 2) + (defenseModifiers.evadeBonus || 0);
  
  // Ensure bounds
  evadeChance = Math.max(0, Math.min(80, evadeChance)); 
  
  // Damage Mitigation from Defender
  const damageReduction = defenseModifiers.damageReduction || 0;
  const flatDef = defender.stats.vit;

  // Execute Hits
  let totalDamageDealt = 0;
  let totalHeal = 0;
  logs.push(`*${attacker.name} uses [${action.name}]!*`);

  for (let i = 0; i < action.hits; i++) {
    // Check Evade
    if (rand(0, 100) < evadeChance) {
      logs.push(`💨 ${defender.name} evaded the attack!`);
      // Trigger Defender's onEvade
      if (defender.loadout.reaction?.trigger === 'onEvade') {
        const reactRes = defender.loadout.reaction.effect(defender, attacker, 0);
        logs.push(reactRes.log);
        if (reactRes.healUser) defender.hp = Math.min(defender.maxHp, defender.hp + reactRes.healUser);
      }
      continue;
    }

    // Calculate Raw Damage
    const baseDamage = baseStatVal * action.basePower;
    const damageMult = stanceModifiers.damageMult ?? 1.0;
    let finalHitDamage = Math.max(1, Math.floor(baseDamage * damageMult + rand(-2, 2)));

    // Check Crit
    let isCrit = false;
    if (rand(0, 100) < critChance) {
      isCrit = true;
      finalHitDamage = Math.floor(finalHitDamage * 1.5);
    }

    // Apply Defender Mitigation
    finalHitDamage = Math.floor(finalHitDamage * (1 - damageReduction));
    finalHitDamage = Math.max(1, finalHitDamage - Math.floor(flatDef / 4)); // Flat reduction
    
    totalDamageDealt += finalHitDamage;
    defender.hp -= finalHitDamage;

    logs.push(`💥 ${isCrit ? '**CRITICAL HIT!** ' : ''}${attacker.name} hit for **${finalHitDamage}** damage!`);

    // Trigger Attacker onCrit
    if (isCrit && attacker.loadout.reaction?.trigger === 'onCritDealt') {
      const reactRes = attacker.loadout.reaction.effect(attacker, defender, finalHitDamage);
      logs.push(reactRes.log);
      if (reactRes.damageDealtToTarget) defender.hp -= reactRes.damageDealtToTarget;
    }

    // Trigger Defender onHitTaken
    if (defender.loadout.reaction?.trigger === 'onHitTaken') {
        const reactRes = defender.loadout.reaction.effect(defender, attacker, finalHitDamage);
        logs.push(reactRes.log);
        if (reactRes.damageDealtToTarget) attacker.hp -= reactRes.damageDealtToTarget;
    }
  }

  // Apply Attacker Lifesteal
  if (totalDamageDealt > 0 && stanceModifiers.lifeSteal) {
    const heal = Math.floor(totalDamageDealt * stanceModifiers.lifeSteal);
    if (heal > 0) {
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + heal);
      logs.push(`🩸 *Vampiric drain restored ${heal} HP to ${attacker.name}!*`);
    }
  }

  return logs;
}
