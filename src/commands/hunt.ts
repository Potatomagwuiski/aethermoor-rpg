import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';
import { compilePlayerStats } from '../utils/stats';
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

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start`.');
  }

  if (player.hp <= 0) {
    return message.reply('You are too weak to hunt! Please wait to heal or use a potion.');
  }

  const cStats = compilePlayerStats(player);

  // Generate Monster based on Player Level
  const mLevel = player.level;
  const mHpMax = getRandomInt(50 + mLevel * 20, 100 + mLevel * 30);
  let mHp = mHpMax;
  const mAc = Math.floor(mLevel * 1.5);
  const mEv = Math.floor(5 + mLevel * 1.2);
  const mMinDmg = Math.floor(5 + mLevel * 2);
  const mMaxDmg = Math.floor(10 + mLevel * 2.5);
  const mNames = ['Goblin Looter', 'Dire Wolf', 'Shadow Stalker', 'Iron Golem', 'Venom Spider'];
  const mName = mNames[getRandomInt(0, mNames.length - 1)];

  // Simulation Loop
  const MAX_ROUNDS = 5;
  let log = '';
  let roundSkippedToDeath = false;
  let playerCurrentHp = player.hp;

  let playerWon = false;
  let monsterWon = false;

  for (let i = 1; i <= MAX_ROUNDS; i++) {
    log += `**Round ${i}**\n`;

    // Player Attacks Monster
    const pRoll = getRandomInt(1, 100);
    if (pRoll < mEv) {
      log += `💨 You swung but the ${mName} evaded!\n`;
    } else {
      let dmg = getRandomInt(cStats.minDamage, cStats.maxDamage);
      let isCrit = false;
      if (getRandomInt(1, 100) <= cStats.critChance) {
        dmg = Math.floor(dmg * cStats.critMultiplier);
        isCrit = true;
      }
      // Armor mitigation
      const effectiveDmg = Math.max(1, dmg - mAc);
      mHp -= effectiveDmg;
      
      const critStr = isCrit ? '💥 CRITICAL' : '';
      log += `🗡️ You hit for ${critStr} **${effectiveDmg}** DMG! (${mName}: ${Math.max(0, mHp)} HP)\n`;
      
      if (cStats.passives.includes('Lifesteal 5%')) {
        const heal = Math.max(1, Math.floor(effectiveDmg * 0.05));
        playerCurrentHp = Math.min(cStats.maxHp, playerCurrentHp + heal);
        log += `   🩸 *Lifesteal healed you for ${heal} HP!*\n`;
      }
    }

    if (mHp <= 0) {
      playerWon = true;
      break;
    }

    // Monster Attacks Player
    const mHitRoll = getRandomInt(1, 100);
    if (mHitRoll < cStats.evasion) {
      log += `💨 You gracefully dodged the ${mName}'s attack!\n`;
    } else {
      let mDmg = getRandomInt(mMinDmg, mMaxDmg);
      const effectiveMDmg = Math.max(1, mDmg - cStats.armor);
      playerCurrentHp -= effectiveMDmg;
      log += `🩸 ${mName} hit you for **${effectiveMDmg}** DMG! (You: ${Math.max(0, playerCurrentHp)} HP)\n`;
    }

    if (playerCurrentHp <= 0) {
      monsterWon = true;
      break;
    }
  }

  // Combat Resolution Data
  if (!playerWon && !monsterWon) {
    log += `\n*The fight ended in a draw after ${MAX_ROUNDS} rounds. The ${mName} fled!*`;
  } else if (playerWon) {
    log += `\n🎉 **You defeated the ${mName}!**`;
  } else if (monsterWon) {
    log += `\n💀 **The ${mName} defeated you...**`;
  }

  // Rewards
  let xpGained = 0;
  let goldGained = 0;
  let lootMsg = '';
  
  if (playerWon) {
    xpGained = getRandomInt(20 + mLevel * 5, 40 + mLevel * 10);
    goldGained = getRandomInt(10 + mLevel * 2, 30 + mLevel * 5);
    
    // Procedural Loot Generation
    const droppedItem = await rollLootDrop(player.level, discordId);
    if (droppedItem) {
      lootMsg = `\n\n✨ **LOOT DROP:** \`${droppedItem.name}\` added to inventory! Use \`rpg inv\` to view.`;
    }
  }

  let newXp = player.xp + xpGained;
  let newLevel = player.level;
  let newGold = player.gold + goldGained;
  let newHp = Math.max(0, playerCurrentHp);
  let leveledUp = false;
  let xpNeeded = newLevel * 100;
  let apToGive = 0;

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel++;
    apToGive += 2; // Give 2 stat points per level
    leveledUp = true;
    xpNeeded = newLevel * 100;
  }

  // Save to database
  await prisma.player.update({
    where: { discordId },
    data: {
      xp: newXp,
      level: newLevel,
      gold: newGold,
      hp: newHp,
      statPoints: player.statPoints + apToGive,
      lastHuntMillis: BigInt(Date.now())
    },
  });

  // Construct response
  const embedColor = playerWon ? '#2ECC71' : (monsterWon ? '#E74C3C' : '#95A5A6');
  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`Hunt Encounter: ${message.author.username} vs ${mName}`)
    .setDescription(log + (playerWon ? `\n\n**Rewards:** +${xpGained} XP | +${goldGained} Gold 🪙` + lootMsg : ''));

  if (leveledUp) {
    embed.addFields({ name: '🎉 L E V E L   U P ! 🎉', value: `You are now Level **${newLevel}**!\nYou have gained **${apToGive} Stat Points**. Use \`rpg assign\` to spend them.`, inline: false });
  }

  await message.reply({ embeds: [embed] });
}
