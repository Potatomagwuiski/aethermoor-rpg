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

  // Baseline Engine Stats
  let baseDamage = 10;
  let linesOfExecution = 1;
  // --- ECONOMY REWARDS ---
  let goldReward = 5;
  let xpReward = 10;
  let craftingItemDrop: string | null = null;
  let jackpotTriggered = false;
  let jackpotMessage = '';

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

  // Handle Database Transactions for Real Rewards
  const updateData: any = {
    gold: { increment: goldReward },
    xp: { increment: xpReward }
  };

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
    if (rarityRoll > 0.999) gachaLootString = '🟧 `[✨ LEGENDARY VOID CORE ✨]`';
    else if (rarityRoll > 0.98) gachaLootString = '🟪 `[Epic Mage Staff]`';
    else if (rarityRoll > 0.90) gachaLootString = '🟦 `[Rare Cobalt Shard]`';
    else if (rarityRoll > 0.70) gachaLootString = '🟩 `[Uncommon Iron Helmet]`';
    else gachaLootString = '⬜ `[Common Wooden Sword]`';
  }

  // Format the Dopamine Delivery
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: Goblin`)
    .setColor(jackpotTriggered ? (player.activeClass === PlayerClass.ROGUE ? 0xFF0000 : 0xFFD700) : 0x2B2D31)
    .setDescription(`The engine calculated your stats in an instant.`)
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

  // Inject Gacha visual pulling addiction
  if (gachaLootString) {
    embed.addFields({ name: '🎁 MYSTERY LOOT DROP!', value: `You found a Gacha Egg... it hatched into:\n${gachaLootString}`});
  }

  return message.reply({ embeds: [embed] });
}
