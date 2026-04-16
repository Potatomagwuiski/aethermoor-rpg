import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

// Simple RNG generator for integers
function getRandomInt(min: number, max: number) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export async function executeHunt(message: Message) {
  const discordId = message.author.id;

  const player = await prisma.player.findUnique({
    where: { discordId },
  });

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start` to begin your journey.');
  }

  if (player.hp <= 0) {
    return message.reply('You are too weak to hunt! Please wait to heal or use a potion.');
  }

  // Calculate rewards and penalties
  const xpGained = getRandomInt(15, 30);
  const goldGained = getRandomInt(5, 20);
  const damageTaken = getRandomInt(0, 5);

  let newHp = player.hp - damageTaken;
  if (newHp < 0) newHp = 0;

  let newXp = player.xp + xpGained;
  let newLevel = player.level;
  let newGold = player.gold + goldGained;
  
  // Level up logic (Level * 100 XP required)
  let leveledUp = false;
  let xpNeeded = newLevel * 100;

  while (newXp >= xpNeeded) {
    newXp -= xpNeeded;
    newLevel++;
    leveledUp = true;
    xpNeeded = newLevel * 100;
  }
  
  // If leveled up, restore HP to max and maybe increase Max HP? We'll just restore to max for now.
  let newMaxHp = player.maxHp;
  if (leveledUp) {
    // Grant +10 Max HP on level up
    const hpBoost = (newLevel - player.level) * 10;
    newMaxHp += hpBoost;
    newHp = newMaxHp; // Fully heal on level up
  }

  // Save to database
  const updatedPlayer = await prisma.player.update({
    where: { discordId },
    data: {
      xp: newXp,
      level: newLevel,
      gold: newGold,
      hp: newHp,
      maxHp: newMaxHp,
      // lastHuntMillis could be set here for cooldowns later
      lastHuntMillis: BigInt(Date.now())
    },
  });

  // Construct response embed
  const embed = new EmbedBuilder()
    .setColor('#E74C3C')
    .setTitle(`Hunt Encounter: ${message.author.username}`)
    .setDescription(`You ventured into the wilds of Aethermoor and encountered a monster!`)
    .addFields(
      { name: 'Damage Taken', value: `${damageTaken} ❤️ (Remaining: ${updatedPlayer.hp}/${updatedPlayer.maxHp})`, inline: false },
      { name: 'Rewards', value: `+${xpGained} XP | +${goldGained} Gold 🪙`, inline: false }
    )
    .setThumbnail(message.author.displayAvatarURL());

  if (leveledUp) {
    embed.addFields({ name: '🎉 level Up! 🎉', value: `You are now Level **${newLevel}**! Your HP has been fully restored and increased!`, inline: false });
    embed.setColor('#F1C40F');
  }

  await message.reply({ embeds: [embed] });
}
