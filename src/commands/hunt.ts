import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { buildFighter, resolveCombat } from '../game/combat';
import { getUserEquipmentIds } from './boss';

const MOBS = [
  {
    name: "Aether-Touched Stag",
    stats: { str: 5, dex: 15, vit: 10, int: 5 },
    equipment: ['assassin_blade'], 
    xpReward: 15
  },
  {
    name: "Goblin Scavenger",
    stats: { str: 10, dex: 10, vit: 5, int: 0 },
    equipment: ['heavy_greataxe'], 
    xpReward: 20
  },
  {
    name: "Frenzied Wolf",
    stats: { str: 8, dex: 20, vit: 8, int: 0 },
    equipment: ['assassin_blade'], 
    xpReward: 18
  }
];

export async function handleHunt(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (!user) return message.reply("You haven't anchored your form. Type `rpg start`.");

  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    getUserEquipmentIds(user)
  );

  const randomMob = MOBS[Math.floor(Math.random() * MOBS.length)];
  const enemy = buildFighter(
    randomMob.name,
    randomMob.stats,
    randomMob.equipment
  );

  const result = resolveCombat(player, enemy);
  
  const savedLog = await prisma.combatLog.create({
    data: {
      userId: user.id,
      enemyName: enemy.name,
      outcome: result.winner === player.name ? "Victory" : (result.winner === enemy.name ? "Defeat" : "Draw"),
      duration: result.ticks,
      content: result.logs.join("\n")
    }
  });

  const isVictory = result.winner === player.name;
  let title = "💀 Defeat...";
  let color = 0xe74c3c;
  let rewardText = "You succumb to the wilds. No XP gained.";

  if (isVictory) {
    title = "⚔️ Victory!";
    color = 0x2ecc71;
    
    let newXp = user.xp + randomMob.xpReward;
    let newLevel = user.level;
    let didLevelUp = false;

    if (newXp >= 100) {
      newXp -= 100;
      newLevel += 1;
      didLevelUp = true;
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { xp: newXp, level: newLevel }
    });

    rewardText = `You extracted **${randomMob.xpReward} XP** from the ${enemy.name}!`;
    if (didLevelUp) rewardText += `\n🌟 **LEVEL UP! You are now XL ${newLevel}!**`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Hunt Result: vs ${enemy.name}`)
    .setColor(color)
    .setDescription(`**${title}**\n\nThe clash ended in **${result.ticks} Ticks**.\nSurvivor HP: ${isVictory ? result.playerHpLeft : 0}\n\n${rewardText}`)
    .setFooter({ text: `Log ID: ${savedLog.id} | View timeline: dun logs get ${savedLog.id}` });
    
  await message.reply({ embeds: [embed] });
}
