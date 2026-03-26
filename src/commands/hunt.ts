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
  let jackpotTriggered = false;
  let jackpotMessage = '';

  // Class-Specific Instant Mathematics
  switch (player.activeClass) {
    case PlayerClass.ROGUE: {
      // The Dex Ratio (Agility vs Endurance)
      const dmgMultiplier = player.agi / Math.max(1, player.end);
      baseDamage = Math.floor(15 * dmgMultiplier);

      // 3% Shadow Clone Jackpot
      if (Math.random() <= 0.03) {
        jackpotTriggered = true;
        linesOfExecution = 5;
        jackpotMessage = '🌩️ **SHADOW CLONE ACTIVATED!** You hit the 3% Jackpot and resolved 5 hunts instantly!';
      }
      break;
    }
    case PlayerClass.WARRIOR: {
      // The Raw Strength Hitter
      baseDamage = player.str * 5; // Simulates holding a heavy weapon

      // 2% Decapitation Execute
      if (Math.random() <= 0.02) {
        jackpotTriggered = true;
        jackpotMessage = '🪓 **DECAPITATION!** You hit the 2% Jackpot and instantly executed the enemy!';
        baseDamage = 999999; 
      }
      break;
    }
    case PlayerClass.MAGE: {
      // The Glass Cannon Ratio
      const dmgMultiplier = player.int / Math.max(1, player.str);
      baseDamage = Math.floor(20 * dmgMultiplier);

      // 3% Wild Magic
      if (Math.random() <= 0.03) {
        jackpotTriggered = true;
        linesOfExecution = 3;
        jackpotMessage = '🎇 **WILD MAGIC!** You hit the 3% Jackpot and cast your spell 3 times instantly!';
      }
      break;
    }
    case PlayerClass.NONE:
    default:
      baseDamage = 5;
      break;
  }

  // Format the Dopamine Delivery (Discord Embed)
  const embed = new EmbedBuilder()
    .setTitle(`⚔️ Hunt Resolved: Goblin`)
    .setColor(jackpotTriggered ? 0xFFD700 : 0x2B2D31)
    .setDescription(`The engine calculated your stats in an instant.`)
    .addFields(
      { name: 'Your Class', value: player.activeClass, inline: true },
      { name: 'Raw Damage Output', value: `${baseDamage} DMG`, inline: true }
    );

  if (jackpotTriggered) {
    embed.addFields({ name: '!!! JACKPOT !!!', value: jackpotMessage });
    embed.addFields({ name: 'Loot Multiplier', value: `x${linesOfExecution} Rewards!` });
  } else {
    embed.addFields({ name: 'Result', value: `Standard victory. Try again to hit your Jackpot.` });
  }

  return message.reply({ embeds: [embed] });
}
