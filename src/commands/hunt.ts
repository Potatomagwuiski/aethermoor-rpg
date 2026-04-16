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

  // Generate Monster
  const mLevel = player.level;
  const mHpMax = getRandomInt(50 + mLevel * 20, 100 + mLevel * 30);
  let mHp = mHpMax;
  
  // Monster AC/Evasion are scaled down slightly so players feel powerful
  let mAc = Math.floor(mLevel * 1);
  const mEv = Math.floor(5 + mLevel * 1);
  const mMinDmg = Math.floor(5 + mLevel * 2);
  const mMaxDmg = Math.floor(10 + mLevel * 2.5);
  
  // Monster Resistances
  const mRPoison = Math.floor(mLevel * 0.5);
  const mRFire = Math.floor(mLevel * 0.5);

  const mNames = ['Goblin Looter', 'Dire Wolf', 'Shadow Stalker', 'Iron Golem', 'Venom Spider'];
  const mName = mNames[getRandomInt(0, mNames.length - 1)];

  // Simulation Variables
  const MAX_ROUNDS = 5;
  let log = '';
  let playerCurrentHp = player.hp;

  let playerWon = false;
  let monsterWon = false;

  // Status Effects
  let mPoisonStacks = 0;

  for (let i = 1; i <= MAX_ROUNDS; i++) {
    log += `**Round ${i}**\n`;

    // Process Sunder passive (reduces monster armor permanently per hit)
    if (cStats.passives.includes('Sunder')) {
        mAc = Math.max(0, mAc - 2); 
    }

    // Determine how many strikes player makes based on Flurry
    let strikes = 1;
    if (cStats.passives.includes('Flurry')) strikes = 3;

    for (let s = 1; s <= strikes; s++) {
      if (mHp <= 0) break;

      const pRoll = getRandomInt(1, 100);
      if (pRoll < mEv) {
        log += `💨 You swung but the ${mName} evaded!\n`;
      } else {
        let dmg = getRandomInt(cStats.minDamage, cStats.maxDamage);
        
        // If flurry, each strike does less raw damage but procs effects
        if (strikes > 1) dmg = Math.floor(dmg / 2);

        let isCrit = false;
        if (getRandomInt(1, 100) <= cStats.critChance) {
          dmg = Math.floor(dmg * cStats.critMultiplier);
          isCrit = true;
          if (cStats.passives.includes('Execution') && mHp < (mHpMax * 0.3)) {
              dmg += Math.floor(dmg * 0.5); // 50% more dmg on low hp target
          }
        }
        
        // Armor mitigation
        let effectiveDmg = Math.max(1, dmg - mAc);
        // Armor Pierce ignores half armor
        if (cStats.passives.includes('Armor Pierce')) {
            effectiveDmg = Math.max(1, dmg - Math.floor(mAc / 2));
        }

        mHp -= effectiveDmg;
        
        const critStr = isCrit ? '💥 CRIT' : '';
        log += `🗡️ You hit for ${critStr} **${effectiveDmg}** DMG! (${mName}: ${Math.max(0, mHp)} HP)\n`;
        
        // On-Hit Passives
        if (cStats.passives.includes('Vampiric Drain') || cStats.passives.includes('Lifesteal 5%')) {
          const heal = Math.max(1, Math.floor(effectiveDmg * 0.1));
          playerCurrentHp = Math.min(cStats.maxHp, playerCurrentHp + heal);
          log += `   🩸 *Lifesteal healed you for ${heal} HP!*\n`;
        }
        
        if (cStats.passives.includes('Venom Strike') || cStats.passives.includes('Toxic Burst')) {
            mPoisonStacks += 10;
        }

        if (cStats.passives.includes('Ignite')) {
            const fireDmg = Math.max(1, 15 - mRFire);
            mHp -= fireDmg;
            log += `   🔥 *Ignite burned the enemy for ${fireDmg} Fire DMG!*\n`;
        }
      }
    }

    if (mHp <= 0) {
      playerWon = true;
      break;
    }

    // Monster Attacks Player
    const mHitRoll = getRandomInt(1, 100);
    // Shield Block Chance addition
    let effectiveEvasion = cStats.evasion;
    if (cStats.passives.includes('Deflect') || cStats.passives.includes('Parry')) {
        effectiveEvasion += 15; // Shields add 15% flat block chance masquerading as dodge
    }

    if (mHitRoll < effectiveEvasion) {
      log += `💨 You dodged the ${mName}'s attack!\n`;
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

    // End of Round Status Effects Tick
    if (mPoisonStacks > 0) {
        const poisonTaken = Math.max(1, mPoisonStacks - mRPoison);
        mHp -= poisonTaken;
        log += `🧪 Poison ticked on the ${mName} for **${poisonTaken}** DMG!\n`;
        
        if (mHp <= 0) {
            playerWon = true;
            break;
        }
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
    xpGained = getRandomInt(40 + mLevel * 10, 80 + mLevel * 20);
    goldGained = getRandomInt(20 + mLevel * 5, 50 + mLevel * 10);
    
    // Procedural Loot Generation
    const droppedItem = await rollLootDrop(player.level, discordId);
    if (droppedItem) {
      lootMsg = `\n\n✨ **LOOT DROP:** \`${droppedItem.name}\` added to inventory!`;
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
    apToGive += 2;
    leveledUp = true;
    xpNeeded = newLevel * 100;
  }

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

  const embedColor = playerWon ? '#2ECC71' : (monsterWon ? '#E74C3C' : '#95A5A6');
  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle(`Hunt Encounter: vs ${mName}`)
    .setDescription(log + (playerWon ? `\n\n**Rewards:** +${xpGained} XP | +${goldGained} Gold 🪙` + lootMsg : ''));

  if (leveledUp) {
    embed.addFields({ name: '🎉 L E V E L   U P ! 🎉', value: `You are now Level **${newLevel}**!\nYou have gained **${apToGive} Stat Points**. Use \`rpg assign\` to spend them.`, inline: false });
  }

  await message.reply({ embeds: [embed] });
}
