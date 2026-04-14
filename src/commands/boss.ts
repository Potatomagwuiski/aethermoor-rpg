import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { buildFighter, resolveCombat } from '../game/combat';

export function createVoidWeaver() {
  return buildFighter(
    "The Void Weaver",
    { str: 25, dex: 10, vit: 40, int: 50 },
    [
      { templateId: 'paladin_plate', slot: 'chest', weight: 55, modifiers: { evadeBonus: -100, acBonus: 60, shieldBonus: 200 } },
      { templateId: 'heavy_greataxe', slot: 'mainhand', weight: 35, modifiers: { damageMult: 1.8, speedMult: 1.6, evadeBonus: -15 } },
      { templateId: 'tower_shield', slot: 'offhand', weight: 40, modifiers: { shieldBonus: 1000, evadeBonus: -30 } }
    ]
  );
}

export function getUserEquipment(user: any): any[] {
  const equipIds = [
    user.equipHead, user.equipCloak, user.equipChest, user.equipLegs, user.equipFeet, 
    user.equipHands, user.equipNeck, user.equipRing1, user.equipRing2, 
    user.equipMainHand, user.equipOffHand
  ].filter(Boolean) as string[];
  if (!user.inventory) return [];
  return equipIds.map(id => user.inventory.find((i:any) => i.id === id)).filter(Boolean);
}

export async function handleBossMenu(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id }, include: { inventory: true } });
  if (!user) return message.reply("You haven't anchored your form. Type `rpg start`.");

  const playerGear = getUserEquipment(user);
  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    playerGear
  );

  const boss = createVoidWeaver();

  const pAction = player.primaryAction;
  const playerSpeedMod = player.stanceMods.speedMult;
  const pDex = Math.max(0.5, 1 - (player.stats.dex * 0.01));
  const playerAttackTicks = pAction ? Math.floor(pAction.baseSpeed * playerSpeedMod * pDex) : 100;
  
  const bossSpeedMod = boss.stanceMods.speedMult;
  const bDex = Math.max(0.5, 1 - (boss.stats.dex * 0.01));
  const bossMoveTicks = Math.floor(50 * bossSpeedMod * bDex); 

  const startDistance = 8;
  const ticksToCloseDistance = (startDistance - 1) * bossMoveTicks; 

  let attacksBeforeMeleeText = "0 (You have a melee weapon, you must close the gap first!)";
  if (pAction && pAction.range >= startDistance) {
    const projectedShots = Math.floor(ticksToCloseDistance / playerAttackTicks);
    attacksBeforeMeleeText = `**${projectedShots} free attacks** before contact`;
  }

  const bossAC = boss.stats.vit + boss.stanceMods.acBonus;
  const mitigationApprox = Math.floor((1 - (100 / (100 + Math.max(0, bossAC)))) * 100);
  const evadePlayer = Math.max(0, Math.min(80, 5 + Math.floor(player.stats.dex / 2) + player.stanceMods.evadeBonus));

  const embed = new EmbedBuilder()
    .setTitle(`⚠️ BOSS ENCOUNTER: ${boss.name}`)
    .setColor(0x9b59b6)
    .setDescription(`*You gaze into the Aether, pre-cognitively simulating the first 5 seconds of the timeline...*`)
    .addFields(
      { name: "Void Defensive Matrix", value: `🛡️ **Armor Mitigation:** ~${mitigationApprox}%\n🧿 **Void Shield:** ${boss.state.shieldHp} HP\n❤️ **Vital HP:** ${boss.hp}`, inline: true },
      { name: "Timeline Pre-Cognition Analysis", value: `📏 The Weaver is ${startDistance} tiles away.\n⏱️ Because of its low DEX, it takes **${ticksToCloseDistance} Ticks** to reach melee.\n🏹 At your attack speed (${playerAttackTicks} ticks/atk), you will unleash ${attacksBeforeMeleeText}.\n💨 Your chance to Evade its massive swings is **${evadePlayer}%**.` },
      { name: "Action", value: "Type `rpg fight boss` if you are ready to permanently lock into this timeline." }
    );

  await message.reply({ embeds: [embed] });
}

export async function handleFightBoss(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id }, include: { inventory: true } });
  if (!user) return message.reply("You haven't started yet! Type `rpg start`.");

  const player = buildFighter(message.author.username, { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence }, getUserEquipment(user));
  const boss = createVoidWeaver();

  const result = resolveCombat(player, boss);
  
  const savedLog = await prisma.combatLog.create({
    data: {
      userId: user.id,
      enemyName: boss.name,
      outcome: result.winner === player.name ? "Victory" : (result.winner === boss.name ? "Defeat" : "Draw"),
      duration: result.ticks,
      content: result.logs.join("\n")
    }
  });

  const embed = new EmbedBuilder()
    .setTitle(`Combat Resolution: ${boss.name}`)
    .setColor(result.winner === player.name ? 0x2ecc71 : 0xe74c3c)
    .setDescription(`**${result.winner === player.name ? "Victory!" : "Defeat..."}**\n\nThe fight concluded in **${result.ticks} Ticks**.\nYou survived with **${result.playerHpLeft} HP** left!`)
    .setFooter({ text: `Log ID: ${savedLog.id} | View full timeline with dun logs get ${savedLog.id}` });
    
  await message.reply({ embeds: [embed] });
}
