import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';
import { compilePlayerStats, CompiledStats } from '../utils/stats';
import { getRandomInt, rollLootDrop } from '../utils/loot';

export async function executeHunt(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
      equipment: {
        include: { mainHand: true, offHand: true, helmet: true, chest: true, gloves: true, boots: true, cloak: true, ring1: true, ring2: true, amulet: true }
      }
    }
  });

  if (!player) return message.reply('You do not have a profile yet! Use `rpg start`.');
  if (player.hp <= 0) return message.reply('You are too weak to hunt! Please wait to heal.');

  const pStats = compilePlayerStats(player);

  const mLevel = player.level;
  const mNames = ['Goblin Looter', 'Dire Wolf', 'Shadow Stalker', 'Iron Golem', 'Venom Spider'];
  const mName = mNames[getRandomInt(0, mNames.length - 1)];

  let mPassives: string[] = [];
  if (mName === 'Venom Spider') mPassives = ['Venom Strike', 'Agility', 'Evasive Maneuver'];
  else if (mName === 'Iron Golem') mPassives = ['Iron Skin', 'Sunder', 'Crushing Blow'];
  else if (mName === 'Dire Wolf') mPassives = ['Flurry', 'Bleed', 'Vampiric Drain'];
  else if (mName === 'Shadow Stalker') mPassives = ['First Strike', 'Shadow Veil', 'Backstab'];
  else mPassives = ['Quick Hands', 'Deflect'];

  const rawMonster = {
      str: 5 + mLevel * 5, dex: 5 + mLevel * 5, int: 5 + mLevel * 5, vit: 5 + mLevel * 5,
      hp: 1, maxHp: 1,
      equipment: {
          mainHand: { baseDamage: mLevel * 3, passives: JSON.stringify(mPassives), modifiers: {} },
          chest: { baseArmor: mLevel * 2, passives: '[]', modifiers: {} }
      }
  };
  
  const mStats = compilePlayerStats(rawMonster);
  mStats.maxHp = getRandomInt(60 + mLevel * 25, 120 + mLevel * 35);
  mStats.hp = mStats.maxHp;

  const safeAttackerName = `[${message.author.username}]`;
  const safeDefenderName = `[${mName}]`;

  const formatStats = (name: string, isPlayer: boolean, stats: CompiledStats, pInfo?: any) => {
      const typeStr = isPlayer ? 'PlayerData' : 'MonsterData';
      const lines = [
          `Stats for ${name} ------------------------------------------------------------------------------------------`,
          `FightEntity:`,
          `  Moves Left: 0.0`,
          `  Hp Left: ${stats.maxHp}`,
          `  Mana Left: 0`,
          `  - stats:`,
          `    ${typeStr}:`,
          `      Hp: ${stats.maxHp}`,
          `      Ac: ${stats.armor}`,
          `      Ev: ${stats.evasion}`,
          `      Attack Speed: ${stats.attackSpeed.toFixed(2)}`,
          `      Melee Accuracy: ${stats.accuracy}`,
          ...(isPlayer && pInfo ? [
              `      Str: ${pInfo.str}`,
              `      Dex: ${pInfo.dex}`,
              `      Int: ${pInfo.int}`,
              `      Vit: ${pInfo.vit}`
          ] : []),
          `      Damages: [DamageInfo(type=:punch: physical, min_amount=${stats.minDamage}, max_amount=${stats.maxDamage})]`,
          `      Passives: [${stats.passives.join(', ')}]`,
          `  Name: ${name}`,
          ``
      ];
      return lines.join('\n');
  };

  // Explicit Combat Log Header Formatting
  let log = `The fight happens between ${message.author.username} and ${mName}!\n\n`;
  log += formatStats(message.author.username, true, pStats, player);
  log += formatStats(mName, false, mStats);
  
  log += `Logs ------------------------------------------------------------------------------------------\n`;

  let distance = 7;
  log += `The distance between you is ${distance} tiles.\n`;

  let playerCurrentHp = pStats.hp;
  let mCurrentHp = mStats.hp;
  
  let playerMoves = 0.0;
  let monsterMoves = 0.0;
  let turn = 1;

  let playerWon = false;
  let monsterWon = false;

  const pStatus = { poison: 0 };
  const mStatus = { poison: 0 };

  // Turn 1 Initiative rule
  let sneakActive = false;
  if (pStats.passives.includes("First Strike") && !mStats.passives.includes("First Strike")) {
      sneakActive = true;
      log += `${safeAttackerName} starts first because ${safeDefenderName} haven't noticed them yet.\n`;
  } else {
      log += `Both combatants spot each other. Combat begins.\n`;
  }

  const simulateAttackGrid = (attacker: CompiledStats, defender: CompiledStats, attackerName: string, defenderName: string, attackerHp: number, defenderHp: number, defStatus: any) => {
      let turnLog = '';
      let drainHeal = 0;
      
      turnLog += `${attackerName} hits ${defenderName} with a melee attack! Applying each damage...\n`;
      
      let strikes = 1;
      if (attacker.passives.includes('Flurry')) strikes += 1;

      for (let s = 1; s <= strikes; s++) {
          if (defenderHp <= 0) break;
          
          const hitChance = Math.max(10, Math.min(95, 50 + (attacker.accuracy - defender.evasion)));
          const roll = getRandomInt(1, 100);
          
          if (roll > hitChance) {
              if (defender.passives.includes('Parry')) {
                  turnLog += `💥 ${defenderName} PARRIED the strike!\n`;
                  if (defender.passives.includes('Riposte')) {
                      let rDmg = Math.max(1, Math.floor(defender.minDamage * 0.5));
                      attackerHp -= rDmg;
                      turnLog += `   ⚔️ Riposte hit ${attackerName} for ${rDmg} damage!\n`;
                  }
              } else {
                  turnLog += `${attackerName} tries attacking in melee but misses! (${hitChance}% hit chance failed)\n`;
              }
          } else {
              let rawDmg = getRandomInt(attacker.minDamage, attacker.maxDamage);
              if (strikes > 1) rawDmg = Math.floor(rawDmg * 0.7);
              
              if (getRandomInt(1, 100) <= attacker.critChance && !defender.passives.includes('Stalwart')) {
                  rawDmg = Math.floor(rawDmg * attacker.stabMultiplier);
                  turnLog += `${attackerName} critically strikes!\n`;
              }
              
              turnLog += `${attackerName} rolls ${rawDmg} for :punch: physical!\n`;
              
              let armorMitigation = getRandomInt(Math.floor(defender.armor * 0.5), defender.armor);
              if (attacker.passives.includes('Armor Break') || attacker.passives.includes('Armor Pierce')) armorMitigation = Math.floor(armorMitigation / 2);
              
              let finalDmg = Math.max(1, rawDmg - armorMitigation);
              turnLog += `${defenderName} rolls ${armorMitigation} for AC and reduces the damage by ${armorMitigation}! Damage Left = ${finalDmg}\n`;
              
              defenderHp -= finalDmg;
              turnLog += `${defenderName} gets damaged by ${finalDmg} damage! HP Left = ${defenderHp}/${defender.maxHp}.\n`;
              
              if (attacker.passives.includes('Thorns')) {
                  const reflect = Math.floor(finalDmg * 0.1);
                  attackerHp -= reflect;
                  turnLog += `   🛡️ Thorns reflected ${reflect} DMG!\n`;
              }
              if (attacker.passives.includes('Venom Strike') || attacker.passives.includes('Toxic Burst')) {
                  defStatus.poison += 10;
              }
              if (attacker.passives.includes('Vampiric Drain')) {
                  drainHeal += Math.max(1, Math.floor(finalDmg * 0.1));
              }
              if (attacker.passives.includes('Ignite')) {
                  const fire = Math.max(1, 15 - defender.rFire);
                  defenderHp -= fire;
                  turnLog += `   🔥 Ignite burns for ${fire} Elemental DMG! HP Left = ${defenderHp}/${defender.maxHp}.\n`;
              }
          }
      }
      return { turnLog, defenderHp, attackerHp, drainHeal };
  };

  const processStatus = (hp: number, status: any, name: string, res: number) => {
      let tlog = '';
      if (status.poison > 0) {
          const dmg = Math.max(1, status.poison - res);
          hp -= dmg;
          tlog += `🧪 ${name} suffers ${dmg} Poison DMG!\n`;
          status.poison = Math.floor(status.poison * 0.8); // decrease poison slightly over time
      }
      return { hp, tlog };
  };

  while (playerCurrentHp > 0 && mCurrentHp > 0 && turn <= 999) {
      log += `TURN ${turn} ------------------------------------------------------------------------------------------\n`;
      
      if (playerMoves < 1.0 && monsterMoves < 1.0) {
          playerMoves += 1.0;
          monsterMoves += 1.0;
      }

      // Check player actions
      if (playerMoves >= 1.0 && playerCurrentHp > 0) {
          log += `${safeAttackerName} gains 1.0 moves. Moves left = ${playerMoves.toFixed(2)}. HP left: ${playerCurrentHp}/${pStats.maxHp}. Mana left: 0/0.\n`;
          
          if (distance > 1) {
              distance -= 1;
              if (turn === 1 && sneakActive) log += `${safeAttackerName} sneaks 1 space closer but alerts ${safeDefenderName}! Distance left = ${distance}.\n`;
              else log += `${safeAttackerName} moves 1 space closer to ${safeDefenderName}. Distance left = ${distance}.\n`;
              
              playerMoves -= 1.0;
              log += `${safeAttackerName} uses 1.0 moves! Moves left = ${Math.max(0, playerMoves).toFixed(2)}.\n`;
          } else {
              let attackCost = pStats.attackSpeed;
              const res = simulateAttackGrid(pStats, mStats, safeAttackerName, safeDefenderName, playerCurrentHp, mCurrentHp, mStatus);
              log += res.turnLog;
              
              mCurrentHp = res.defenderHp;
              playerCurrentHp = res.attackerHp;
              
              if (res.drainHeal > 0) {
                  playerCurrentHp = Math.min(pStats.maxHp, playerCurrentHp + res.drainHeal);
                  log += `🩸 ${safeAttackerName} healed ${res.drainHeal} HP from Vampiric Drain.\n`;
              }

              playerMoves -= attackCost;
              log += `${safeAttackerName} uses ${attackCost.toFixed(2)} moves! Moves left = ${Math.max(0, playerMoves).toFixed(2)}.\n`;
          }
      }

      if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;

      // Check monster actions
      if (monsterMoves >= 1.0 && mCurrentHp > 0) {
          log += `${safeDefenderName} gains 1.0 moves. Moves left = ${monsterMoves.toFixed(2)}. HP left: ${mCurrentHp}/${mStats.maxHp}. Mana left: 0/0.\n`;
          
          if (distance > 1) {
              distance -= 1;
              log += `${safeDefenderName} moves 1 space closer to ${safeAttackerName}. Distance left = ${distance}.\n`;
              monsterMoves -= 1.0;
              log += `${safeDefenderName} uses 1.0 moves! Moves left = ${Math.max(0, monsterMoves).toFixed(2)}.\n`;
          } else {
              let attackCost = mStats.attackSpeed;
              const res = simulateAttackGrid(mStats, pStats, safeDefenderName, safeAttackerName, mCurrentHp, playerCurrentHp, pStatus);
              log += res.turnLog;

              playerCurrentHp = res.defenderHp;
              mCurrentHp = res.attackerHp;

              if (res.drainHeal > 0) {
                  mCurrentHp = Math.min(mStats.maxHp, mCurrentHp + res.drainHeal);
                  log += `🩸 ${safeDefenderName} healed ${res.drainHeal} HP from Vampiric Drain.\n`;
              }

              monsterMoves -= attackCost;
              log += `${safeDefenderName} uses ${attackCost.toFixed(2)} moves! Moves left = ${Math.max(0, monsterMoves).toFixed(2)}.\n`;
          }
      }

      if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;

      // End of round statuses
      const pStatRes = processStatus(playerCurrentHp, pStatus, safeAttackerName, pStats.rPoison);
      if (pStatRes.tlog) log += pStatRes.tlog;
      playerCurrentHp = pStatRes.hp;
      
      const mStatRes = processStatus(mCurrentHp, mStatus, safeDefenderName, mStats.rPoison);
      if (mStatRes.tlog) log += mStatRes.tlog; 
      mCurrentHp = mStatRes.hp;

      turn++;
  }

  if (mCurrentHp <= 0 && playerCurrentHp > 0) {
      log += `${safeDefenderName} dies!\n`;
      log += `${safeAttackerName} wins the fight because ${safeDefenderName} has died!\n`;
      playerWon = true;
  } else if (playerCurrentHp <= 0) {
      log += `${safeAttackerName} dies!\n`;
      log += `${safeDefenderName} wins the fight because ${safeAttackerName} has died!\n`;
      monsterWon = true;
  }

  let outcome = 'Draw';
  if (playerWon) outcome = 'Win';
  if (monsterWon) outcome = 'Loss';

  let xpGained = 0;
  let goldGained = 0;
  let lootMsg = '';
  
  if (playerWon) {
    xpGained = getRandomInt(40 + mLevel * 10, 80 + mLevel * 20);
    goldGained = getRandomInt(20 + mLevel * 5, 50 + mLevel * 10);
    
    if (pStats.passives.includes('Wealth')) goldGained = Math.floor(goldGained * 1.5);
    if (pStats.passives.includes('Luck')) xpGained = Math.floor(xpGained * 1.2);

    const droppedItem = await rollLootDrop(player.level, discordId);
    if (droppedItem) lootMsg = `\n✨ **Loot:** \`${droppedItem.name}\` (ID: \`${droppedItem.id}\`)`;
  }

  let newXp = player.xp + xpGained;
  let newLevel = player.level;
  let leveledUp = false;
  let xpNeeded = newLevel * 100;
  let apToGive = 0;

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel++;
    apToGive += 2;
    leveledUp = true;
    xpNeeded = newLevel * 100;
  }

  const cLog = await prisma.combatLog.create({
      data: {
          playerId: discordId,
          target: mName,
          result: outcome,
          logText: log
      }
  });

  await prisma.player.update({
    where: { discordId },
    data: {
      xp: newXp,
      level: newLevel,
      gold: player.gold + goldGained,
      hp: pStats.maxHp, // Auto-heal remains
      statPoints: player.statPoints + apToGive,
      lastHuntMillis: BigInt(Date.now())
    },
  });

  let resText = '⚪ **Draw!** The enemy fled.';
  if (playerWon) resText = '🟢 **Victory!** You crushed the target.';
  else if (monsterWon) resText = '🔴 **Defeat...** You were laid to rest.';

  const embedColor = playerWon ? '#2ECC71' : (monsterWon ? '#E74C3C' : '#95A5A6');
  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setAuthor({ name: `Combat: ${message.author.username} vs Lvl ${mLevel} ${mName}`, iconURL: message.author.displayAvatarURL() })
    .setDescription(`${resText}\n\n` + 
                    `⏱️ **Duration:** \`${turn} Turn(s)\`\n` +
                    `❤️ **Your HP:** \`${Math.max(0, playerCurrentHp)} / ${pStats.maxHp}\`\n` + 
                    `💀 **Enemy HP:** \`${Math.max(0, mCurrentHp)} / ${mStats.maxHp}\`\n` +
                    (playerWon ? `\n🪙 **+${goldGained} Gold**\n✨ **+${xpGained} XP**${lootMsg}` : ''))
    .setFooter({ text: `Detailed Physics Log: rpg logs get ${cLog.id}` });

  if (leveledUp) {
    embed.addFields({ name: '🎉 LEVEL UP!', value: `You reached Level **${newLevel}**! (+${apToGive} AP)\n*Tip: Use \`rpg assign <stat> <amount>\` to allocate your points!*` });
  }

  await message.reply({ embeds: [embed] });
}
