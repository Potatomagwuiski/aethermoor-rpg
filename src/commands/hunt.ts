import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import { PlayerClass } from '@prisma/client';

export async function execute(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('You have not created a character yet!');
  }

  if (player.hp <= 0) {
    return message.reply('💀 **YOU ARE DEAD.**\nYou cannot hunt until your body is restored. Buy a 🧪 **[Life Potion]** from the `rpg shop` and type `rpg heal`.');
  }

  // Baseline Engine Stats
  let baseDamage = 10;
  let linesOfExecution = 1;
  // --- ECONOMY REWARDS ---
  let goldReward = 5;
  let xpReward = 10;
  let craftingItemDrop: string | null = null;
  let jackpotTriggered = false;
  let jackpotMessage = '';
  
  // The HP Penalty
  const damageTaken = Math.floor(Math.random() * 8) + 3; // 3 to 10 damage per hunt

  // Class-Specific Instant Mathematics & Rewards
  switch (player.activeClass) {
    case PlayerClass.ROGUE: {
      const dmgMultiplier = player.agi / Math.max(1, player.end);
      baseDamage = Math.floor(15 * dmgMultiplier);

      // ROGUE: Combat Style = Fast Crits | Special Thing = Loot Hoarder
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        baseDamage = Math.floor(baseDamage * 2.5); // The satisfying crit
        goldReward = 500; // The Loot Hoarder economy injector
        jackpotMessage = '🗡️ **ASSASSIN\'S CRIT!** You found a massive stash of pure gold!';
      }
      break;
    }
    case PlayerClass.WARRIOR: {
      baseDamage = player.str * 5; 

      // WARRIOR: Combat Style = Heavy Hits | Special Thing = Crafting Master
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        baseDamage = 9999;
        craftingItemDrop = "rare_meteorite_ingot"; // The Crafting Master unique drop
        jackpotMessage = '🪓 **DECAPITATION!** You shattered their armor and salvaged a Rare Meteorite Ingot!';
      }
      break;
    }
    case PlayerClass.MAGE: {
      const dmgMultiplier = player.int / Math.max(1, player.str);
      baseDamage = Math.floor(20 * dmgMultiplier);

      // MAGE: Combat Style = Magic | Special Thing = EXP Booster
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        xpReward = 500; // The EXP Booster progression multiplier
        jackpotMessage = '🎇 **WILD MAGIC!** You absorbed the chaotic leylines for a massive EXP Surge!';
      }
      break;
    }
    case PlayerClass.NECROMANCER: {
      const dmgMultiplier = (player.int + player.end) / 20; // Needs both intelligence for magic, and endurance for pets
      const swarmSize = Math.floor(5 + (dmgMultiplier * 5)); // Between 5 and infinite minions
      const dmgPerMinion = Math.floor(2 * dmgMultiplier);
      baseDamage = swarmSize * dmgPerMinion;

      // NECROMANCER: Combat Style = Swarm Attrition | Special Thing = Gacha Feeder
      if (Math.random() > 0.8) {
        jackpotTriggered = true;
        baseDamage = Math.floor(baseDamage * 1.5);
        const soulsHarvested = 10;
        jackpotMessage = `💀 **SOUL HARVEST!** Your swarm ripped out ${soulsHarvested} souls to feed your abomination!`;
      }
      break;
    }
    case PlayerClass.NONE:
    default:
      baseDamage = 5;
      break;
  }

  // Provide Leveling Engine Logic
  let currentLevel = player.level;
  let currentXp = player.xp + xpReward;
  let pointsGained = 0;

  while (currentXp >= currentLevel * 100) {
    currentXp -= currentLevel * 100;
    currentLevel++;
    pointsGained += 3;
  }

  const levelsGained = currentLevel - player.level;

  // Handle Database Transactions for Real Rewards
  const updateData: any = {
    gold: { increment: goldReward },
    level: currentLevel,
    xp: currentXp,
    hp: { decrement: damageTaken }
  };

  if (levelsGained > 0) {
    updateData.pointsAvailable = { increment: pointsGained };
  }

  const dbOperations = [];
  dbOperations.push(prisma.player.update({
    where: { discordId },
    data: updateData
  }));

  if (craftingItemDrop) {
    dbOperations.push(prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: craftingItemDrop } },
      update: { quantity: { increment: 1 } },
      create: { playerId: player.id, itemKey: craftingItemDrop, quantity: 1 }
    }));
  }

  await prisma.$transaction(dbOperations);

  // --- THE GACHA LOOT SYSTEM ---
  let gachaLootString = '';
  if (Math.random() <= 0.15) { // 15% chance to trigger an item drop
    const rarityRoll = Math.random();
    let dropKey = '';

    if (rarityRoll > 0.999) {
      gachaLootString = '🟧 `[✨ Blueprint: Void Blade ✨]`';
      dropKey = 'blueprint_void_blade';
    }
    else if (rarityRoll > 0.98) gachaLootString = '🟪 `[Blueprint: Epic Mage Staff]`';
    else if (rarityRoll > 0.95) {
      gachaLootString = '🗝️ `[Dungeon Key]`';
      dropKey = 'dungeon_key';
    }
    else if (rarityRoll > 0.90) gachaLootString = '🟦 `[Rare Cobalt Shard]`';
    else if (rarityRoll > 0.70) gachaLootString = '🟩 `[Blueprint: Iron Helmet]`';
    else {
      gachaLootString = '⬜ `[Blueprint: Iron Sword]`';
      dropKey = 'blueprint_iron_sword';
    }

    if (dropKey) {
      dbOperations.push(prisma.inventoryItem.upsert({
        where: { playerId_itemKey: { playerId: player.id, itemKey: dropKey } },
        update: { quantity: { increment: 1 } },
        create: { playerId: player.id, itemKey: dropKey, quantity: 1 }
      }));
    }
  }

  // Format the Dopamine Delivery
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: Goblin`)
    .setColor(jackpotTriggered ? (player.activeClass === PlayerClass.ROGUE ? 0xFF0000 : 0xFFD700) : 0x2B2D31)
    .setDescription(`You swung your 🗡️ weapon resulting in a rapid clash. The 👺 Goblin retaliated.\n\n**Combat Log:**\nDamage Dealt: 💥 ${baseDamage}\nDamage Taken: 🩸 ${damageTaken}\n\n🏆 **Reward:** 🪙 ${goldReward} Gold | ✨ ${xpReward} XP\n\n`)
    .addFields(
      { name: 'Your Class', value: player.activeClass, inline: true },
      { name: 'Raw Damage Output', value: jackpotTriggered && player.activeClass === PlayerClass.ROGUE ? `**💥 ${baseDamage} CRIT! 💥**` : (player.activeClass === PlayerClass.NECROMANCER ? `[${Math.floor(baseDamage/10)} DMG x 10 Minions]` : `${baseDamage} DMG`), inline: true }
    );

  if (jackpotTriggered) {
    embed.addFields({ name: '!!! JACKPOT !!!', value: jackpotMessage });
    if (player.activeClass === PlayerClass.ROGUE) embed.addFields({ name: 'Loot Stolen', value: `💰 +${goldReward} Gold`});
    if (player.activeClass === PlayerClass.MAGE) embed.addFields({ name: 'Knowledge Gained', value: `✨ +${xpReward} EXP`});
    if (player.activeClass === PlayerClass.WARRIOR) embed.addFields({ name: 'Salvaged Material', value: `🔨 1x Rare Meteorite Ingot`});
  } else {
    embed.addFields({ name: 'Rewards', value: `+${goldReward} Gold, +${xpReward} EXP` });
  }

  if (levelsGained > 0) {
    embed.addFields({ name: '🌟 LEVEL UP!', value: `You reached Level **${currentLevel}**! (+${pointsGained} Stat Points). Type \`rpg stat\` to spend them!`});
  }

  // Inject Gacha visual pulling addiction
  if (gachaLootString) {
    embed.addFields({ name: '🎁 MYSTERY LOOT DROP!', value: `You found a rare blueprint schematic:\n${gachaLootString}`});
  }

  return message.reply({ embeds: [embed] });
}
