import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { STANCES, ACTIONS, REACTIONS } from '../game/items';
import { buildFighter, resolveCombat } from '../game/combat';

export function createVoidWeaver() {
  return buildFighter(
    "The Void Weaver",
    { str: 25, dex: 10, vit: 40, int: 50 },
    {
      stance: STANCES['paladin_aura'], 
      action: ACTIONS['heavy_greataxe'], // Extremely slow, brutal hits
    }
  );
}

export async function handleBossMenu(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (!user) return message.reply("You haven't anchored your form. Type `rpg start`.");

  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    {
      stance: user.stanceId ? STANCES[user.stanceId] : undefined,
      action: user.actionId ? ACTIONS[user.actionId] : undefined,
      reaction: user.reactionId ? REACTIONS[user.reactionId] : undefined,
    }
  );

  const boss = createVoidWeaver();

  // Pre-Cognition Math Simulation
  const pAction = player.loadout.action;
  
  // Simplified tick estimation for player attack speed
  const playerSpeedMod = player.loadout.stance?.modifiers?.speedMult || 1.0;
  const pDex = Math.max(0.5, 1 - (player.stats.dex * 0.01));
  const playerAttackTicks = pAction ? Math.floor(pAction.baseSpeed * playerSpeedMod * pDex) : 100;
  
  // Simplified boss advance tick cost
  const bossSpeedMod = boss.loadout.stance?.modifiers?.speedMult || 1.0;
  const bDex = Math.max(0.5, 1 - (boss.stats.dex * 0.01));
  const bossMoveTicks = Math.floor(50 * bossSpeedMod * bDex); 

  const startDistance = 8;
  const ticksToCloseDistance = (startDistance - 1) * bossMoveTicks; 

  let attacksBeforeMeleeText = "0 (You have a melee weapon, you must close the gap first!)";
  if (pAction && pAction.range >= startDistance) {
    const projectedShots = Math.floor(ticksToCloseDistance / playerAttackTicks);
    attacksBeforeMeleeText = `**${projectedShots} free attacks** before contact`;
  }

  const bossAC = boss.stats.vit + (boss.loadout.stance?.modifiers?.acBonus || 0);
  const mitigationApprox = Math.floor((1 - (100 / (100 + Math.max(0, bossAC)))) * 100);
  
  const evadePlayer = Math.max(0, Math.min(80, 5 + Math.floor(player.stats.dex / 2) + (player.loadout.stance?.modifiers?.evadeBonus || 0)));

  const embed = new EmbedBuilder()
    .setTitle(`⚠️ BOSS ENCOUNTER: ${boss.name}`)
    .setColor(0x9b59b6)
    .setDescription(`*You gaze into the Aether, pre-cognitively simulating the first 5 seconds of the timeline...*`)
    .addFields(
      { name: "Void Defensive Matrix", value: `🛡️ **Armor Mitigation:** ~${mitigationApprox}%\n🧿 **Void Shield:** ${boss.state.shieldHp} HP\n❤️ **Vital HP:** ${boss.hp}`, inline: true },
      { name: "Timeline Pre-Cognition Analysis", value: `📏 The Weaver is ${startDistance} tiles away.\n⏱️ Because of its low DEX, it takes **${ticksToCloseDistance} Ticks** to reach melee.\n🏹 At your attack speed (${playerAttackTicks} ticks/atk), you will unleash ${attacksBeforeMeleeText}.\n💨 Your chance to Evade its massive swings is **${evadePlayer}%**.` },
      { name: "Action", value: "Type `rpg fight boss` if you are ready to permanently lock into this timeline." }
    )
    .setFooter({ text: 'Aethermoor Timeline Engine' });

  await message.reply({ embeds: [embed] });
}

export async function handleFightBoss(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (!user) return message.reply("You haven't started yet! Type `rpg start`.");

  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    {
      stance: user.stanceId ? STANCES[user.stanceId] : undefined,
      action: user.actionId ? ACTIONS[user.actionId] : undefined,
      reaction: user.reactionId ? REACTIONS[user.reactionId] : undefined,
    }
  );

  const boss = createVoidWeaver();

  const result = resolveCombat(player, boss);
  
  // Save full log to database
  const fullLogText = result.logs.join("\n");
  const savedLog = await prisma.combatLog.create({
    data: {
      userId: user.id,
      enemyName: boss.name,
      outcome: result.winner === player.name ? "Victory" : (result.winner === boss.name ? "Defeat" : "Draw"),
      duration: result.ticks,
      content: fullLogText
    }
  });

  const outcomeTitle = result.winner === player.name ? "Victory!" : "Defeat...";
  const color = result.winner === player.name ? 0x2ecc71 : 0xe74c3c;
  
  const embed = new EmbedBuilder()
    .setTitle(`Combat Resolution: ${boss.name}`)
    .setColor(color)
    .setDescription(`**${outcomeTitle}**\n\nThe fight concluded in **${result.ticks} Ticks**.\nYou survived with **${result.playerHpLeft} HP** left!`)
    .setFooter({ text: `Log ID: ${savedLog.id} | View full timeline with dun logs get ${savedLog.id}` });
    
  await message.reply({ embeds: [embed] });
}
