import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { buildFighter, resolveCombat } from '../game/combat';
import { getUserEquipment } from './boss';

const MOBS = [
  {
    name: "Goblin Scavenger",
    minLevel: 1,
    stats: { str: 8, dex: 5, vit: 5, int: 0 },
    equipment: [{ templateId: 'dagger', slot: 'mainhand', weight: 2, name: "Rusted Shiv", modifiers: { damageMult: 0.8 } }], 
    xpReward: 15
  },
  {
    name: "Frenzied Wolf",
    minLevel: 1,
    stats: { str: 6, dex: 18, vit: 6, int: 0 },
    equipment: [{ templateId: 'dagger', slot: 'mainhand', weight: 0, name: "Razored Claws", modifiers: { damageMult: 1.1, speedMult: 0.8 } }], 
    xpReward: 20
  },
  {
    name: "Aether-Touched Stag",
    minLevel: 3,
    stats: { str: 12, dex: 10, vit: 15, int: 5 },
    equipment: [{ templateId: 'longsword', slot: 'mainhand', weight: 10, name: "Shattered Antlers", modifiers: { speedMult: 1.2 } }], 
    xpReward: 30
  },
  {
    name: "Corrupt Marksman",
    minLevel: 5,
    stats: { str: 5, dex: 15, vit: 5, int: 0 },
    equipment: [{ templateId: 'musket', slot: 'mainhand', weight: 12, name: "Splintered Musket", modifiers: { damageMult: 1.3, speedMult: 2.2 } }], 
    xpReward: 35
  }
];

export async function handleHunt(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id }, include: { inventory: true } });
  if (!user) return message.reply("You haven't anchored your form. Type `rpg start`.");

  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    getUserEquipment(user)
  );

  const viableMobs = MOBS.filter(m => user.level >= m.minLevel);
  const randomMob = viableMobs[Math.floor(Math.random() * viableMobs.length)];
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

    const goldReward = Math.floor(Math.random() * 50) + 10;
    await prisma.user.update({
      where: { id: user.id },
      data: { xp: newXp, level: newLevel, gold: user.gold + goldReward }
    });

    rewardText = `You extracted **${randomMob.xpReward} XP** and **${goldReward} Gold** from the ${enemy.name}!`;
    if (didLevelUp) rewardText += `\n🌟 **LEVEL UP! You are now XL ${newLevel}!**`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`Hunt Result: vs ${enemy.name}`)
    .setColor(color)
    .setDescription(`**${title}**\n\nThe clash ended in **${result.ticks} Ticks**.\nSurvivor HP: ${isVictory ? result.playerHpLeft : 0}\n\n${rewardText}`)
    .setFooter({ text: `Log ID: ${savedLog.id} | View timeline: dun logs get ${savedLog.id}` });
    
  await message.reply({ embeds: [embed] });
}
