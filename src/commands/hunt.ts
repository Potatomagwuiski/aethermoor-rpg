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

  // ASSYMMETRIC MONSTER GHOST GENERATION
  const mLevel = player.level;
  const mNames = ['Goblin Looter', 'Dire Wolf', 'Shadow Stalker', 'Iron Golem', 'Venom Spider'];
  const mName = mNames[getRandomInt(0, mNames.length - 1)];

  let mPassives: string[] = [];
  if (mName === 'Venom Spider') mPassives = ['Venom Strike', 'Agility', 'Evasive Maneuver'];
  else if (mName === 'Iron Golem') mPassives = ['Iron Skin', 'Sunder', 'Crushing Blow'];
  else if (mName === 'Dire Wolf') mPassives = ['Flurry', 'Bleed', 'Vampiric Drain'];
  else if (mName === 'Shadow Stalker') mPassives = ['First Strike', 'Shadow Veil', 'Backstab'];
  else mPassives = ['Quick Hands', 'Deflect']; // Goblin

  const rawMonster = {
      str: 5 + mLevel * 5, dex: 5 + mLevel * 5, int: 5 + mLevel * 5, vit: 5 + mLevel * 5,
      hp: 1, maxHp: 1,
      equipment: {
          mainHand: { baseDamage: mLevel * 3, passives: JSON.stringify(mPassives), modifiers: {} },
          chest: { baseArmor: mLevel * 2, passives: '[]', modifiers: {} }
      }
  };
  
  const mStats = compilePlayerStats(rawMonster);
  // Manual overrides for boss-like scale
  mStats.maxHp = getRandomInt(60 + mLevel * 25, 120 + mLevel * 35);
  mStats.hp = mStats.maxHp;

  // Trackers
  const MAX_ROUNDS = 5;
  let log = `COMBAT INITIATED: ${message.author.username} vs ${mName}\n`;
  log += `PLAYER: ${pStats.hp} HP | ${pStats.accuracy} ACC | ${pStats.evasion} EV | ${pStats.armor} AC | ${pStats.attackSpeed.toFixed(2)} SPD\n`;
  log += `ENEMY: ${mStats.hp} HP | ${mStats.accuracy} ACC | ${mStats.evasion} EV | ${mStats.armor} AC | ${mStats.attackSpeed.toFixed(2)} SPD\n`;
  log += `-------------------------------------------------\n`;

  let playerCurrentHp = pStats.hp;
  let mCurrentHp = mStats.hp;

  let playerWon = false;
  let monsterWon = false;

  const pStatus = { poison: 0 };
  const mStatus = { poison: 0 };

  // Helper for attacking identically
  const simulateAttack = (attacker: CompiledStats, defender: CompiledStats, attackerName: string, defenderName: string, attackerHp: number, defenderHp: number, defStatus: any) => {
      let turnLog = '';
      let dmgDealt = 0;
      let drainHeal = 0;

      const baseStrikes = Math.floor(attacker.attackSpeed);
      // Chance for an extra strike based on the decimal
      let strikes = baseStrikes + (Math.random() < (attacker.attackSpeed % 1) ? 1 : 0);
      if (attacker.passives.includes('Flurry')) strikes += 1; // Native additional strikes

      for (let s = 1; s <= strikes; s++) {
          if (defenderHp <= 0) break;

          // Accuracy vs Evasion calculation
          const hitChance = Math.max(10, Math.min(95, 50 + (attacker.accuracy - defender.evasion)));
          const roll = getRandomInt(1, 100);

          if (roll > hitChance) {
              // Check Parry before simple dodge
              if (defender.passives.includes('Parry')) {
                  turnLog += `💥 ${defenderName} PARRIED the strike!\n`;
                  // Riposte applies back
                  if (defender.passives.includes('Riposte')) {
                      attackerHp -= Math.max(1, Math.floor(defender.minDamage * 0.5));
                      turnLog += `   ⚔️ Riposte hit ${attackerName}!\n`;
                  }
              } else {
                  turnLog += `💨 ${attackerName} missed! (${hitChance}% hit chance failed)\n`;
              }
          } else {
              let dmg = getRandomInt(attacker.minDamage, attacker.maxDamage);
              if (strikes > 1) dmg = Math.floor(dmg * 0.7); // Multi-hit penalty scaling

              let isCrit = false;
              if (getRandomInt(1, 100) <= attacker.critChance && !defender.passives.includes('Stalwart')) {
                  dmg = Math.floor(dmg * attacker.stabMultiplier);
                  isCrit = true;
              }

              // Armor Mitigation Math
              let defenderArmor = defender.armor;
              if (attacker.passives.includes('Armor Break') || attacker.passives.includes('Armor Pierce')) defenderArmor = Math.floor(defenderArmor / 2);
              
              const physicalDmg = Math.max(1, dmg - defenderArmor);
              defenderHp -= physicalDmg;
              dmgDealt += physicalDmg;

              const critStr = isCrit ? '💥 CRIT ' : '';
              turnLog += `🗡️ ${attackerName} hits for ${critStr}**${physicalDmg}** Physical DMG!\n`;

              // Passives
              if (attacker.passives.includes('Thorns')) {
                  const reflect = Math.floor(physicalDmg * 0.1);
                  attackerHp -= reflect;
                  turnLog += `   🛡️ Thorns reflected ${reflect} DMG!\n`;
              }
              if (attacker.passives.includes('Venom Strike') || attacker.passives.includes('Toxic Burst')) {
                  defStatus.poison += 10;
              }
              if (attacker.passives.includes('Vampiric Drain')) {
                  drainHeal += Math.max(1, Math.floor(physicalDmg * 0.1));
              }
              if (attacker.passives.includes('Ignite')) {
                  // Fire elemental hit bypasses physical armor, checks rFire exclusively.
                  const fire = Math.max(1, 15 - defender.rFire);
                  defenderHp -= fire;
                  turnLog += `   🔥 Ignite burns for ${fire} Elemental DMG!\n`;
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
      }
      return { hp, tlog };
  };

  let roundCount = 0;
  for (let i = 1; i <= MAX_ROUNDS; i++) {
    roundCount = i;
    log += `\n**--- Round ${i} ---**\n`;

    // SNEAK CHANCE / FIRST STRIKE handling
    let playerGoesFirst = true;
    if (mStats.passives.includes('First Strike') && !pStats.passives.includes('First Strike')) playerGoesFirst = false;

    // Both functions resolve asynchronously if one dies during the hit logic.
    if (playerGoesFirst) {
        // Player attacks
        const pRes = simulateAttack(pStats, mStats, message.author.username, mName, playerCurrentHp, mCurrentHp, mStatus);
        log += pRes.turnLog;
        mCurrentHp = pRes.defenderHp;
        playerCurrentHp = pRes.attackerHp;
        if (pRes.drainHeal > 0) {
            playerCurrentHp = Math.min(pStats.maxHp, playerCurrentHp + pRes.drainHeal);
            log += `🩸 ${message.author.username} healed ${pRes.drainHeal} HP from Vampiric Drain.\n`;
        }
        
        if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;

        // Monster attacks
        const mRes = simulateAttack(mStats, pStats, mName, message.author.username, mCurrentHp, playerCurrentHp, pStatus);
        log += mRes.turnLog;
        playerCurrentHp = mRes.defenderHp;
        mCurrentHp = mRes.attackerHp;
        if (mRes.drainHeal > 0) {
            mCurrentHp = Math.min(mStats.maxHp, mCurrentHp + mRes.drainHeal);
            log += `🩸 ${mName} healed ${mRes.drainHeal} HP from Vampiric Drain.\n`;
        }

    } else {
         // Monster first!
         const mRes = simulateAttack(mStats, pStats, mName, message.author.username, mCurrentHp, playerCurrentHp, pStatus);
         log += mRes.turnLog;
         playerCurrentHp = mRes.defenderHp;
         mCurrentHp = mRes.attackerHp;
         
         if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;
         
         const pRes = simulateAttack(pStats, mStats, message.author.username, mName, playerCurrentHp, mCurrentHp, mStatus);
         log += pRes.turnLog;
         mCurrentHp = pRes.defenderHp;
         playerCurrentHp = pRes.attackerHp;
    }

    if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;

    // Tick Statuses
    const pStatRes = processStatus(playerCurrentHp, pStatus, message.author.username, pStats.rPoison);
    log += pStatRes.tlog; playerCurrentHp = pStatRes.hp;
    
    const mStatRes = processStatus(mCurrentHp, mStatus, mName, mStats.rPoison);
    log += mStatRes.tlog; mCurrentHp = mStatRes.hp;

    if (mCurrentHp <= 0 || playerCurrentHp <= 0) break;
  }

  if (mCurrentHp <= 0 && playerCurrentHp > 0) playerWon = true;
  else if (playerCurrentHp <= 0) monsterWon = true;

  log += `\n-------------------------------------------------\n`;
  let outcome = 'Draw';
  if (!playerWon && !monsterWon) log += `FIGHT OVER: DRAW. Target fled!`;
  else if (playerWon) { log += `FIGHT OVER: VICTORY for ${message.author.username}!`; outcome = 'Win'; }
  else if (monsterWon) { log += `FIGHT OVER: DEFEAT for ${message.author.username}.`; outcome = 'Loss'; }

  // Rewards Logic
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

  // Push Verbose Log to Database!
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
      hp: pStats.maxHp, // Auto-heal
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
                    `⏱️ **Duration:** \`${roundCount} Round(s)\`\n` +
                    `❤️ **Your HP:** \`${Math.max(0, playerCurrentHp)} / ${pStats.maxHp}\`\n` + 
                    `💀 **Enemy HP:** \`${Math.max(0, mCurrentHp)} / ${mStats.maxHp}\`\n` +
                    (playerWon ? `\n🪙 **+${goldGained} Gold**\n✨ **+${xpGained} XP**${lootMsg}` : ''))
    .setFooter({ text: `Detailed Physics Log: rpg logs get ${cLog.id}` });

  if (leveledUp) {
    embed.addFields({ name: '🎉 LEVEL UP!', value: `You reached Level **${newLevel}**! (+${apToGive} AP)` });
  }

  await message.reply({ embeds: [embed] });
}
