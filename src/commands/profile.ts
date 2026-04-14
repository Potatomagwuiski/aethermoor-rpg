import { prisma } from '../lib/prisma';
import { Message, EmbedBuilder } from 'discord.js';
import { buildFighter } from '../game/combat';
import { getUserEquipment } from './boss';

export async function handleProfile(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id }, include: { inventory: true } });
  if (!user) return message.reply("You haven't started yet! Type `rpg start`.");
  
  const player = buildFighter(
    message.author.username,
    { str: user.strength, dex: user.dexterity, vit: user.vitality, int: user.intelligence },
    getUserEquipment(user)
  );

  const evade = Math.max(0, Math.min(80, 5 + Math.floor(player.stats.dex / 2) + player.stanceMods.evadeBonus));
  const ac = player.stats.vit + player.stanceMods.acBonus;
  const shield = player.stanceMods.shieldBonus;
  
  const speedMult = player.stanceMods.speedMult;
  const pDex = Math.max(0.5, 1 - (player.stats.dex * 0.01));
  const ticks = player.primaryAction ? Math.floor(player.primaryAction.baseSpeed * speedMult * pDex) : NaN;

  const mitigationApprox = Math.floor((1 - (100 / (100 + Math.max(0, ac)))) * 100);

  const equipList = player.equipment.length > 0 
    ? player.equipment.map(i => `[${i.slot.toUpperCase()}] ${i.name}`).join('\n')
    : "No Gear Equipped";

  const encumbranceState = player.state.encumbranceFactor && player.state.encumbranceFactor > 0 ? `⚠️ **ENCUMBERED:** (+${Math.floor(player.state.encumbranceFactor * 3)}% Action Delay)` : `✅ Normal Weight`;
  let loadoutSummary = `⚖️ **Carry Capacity:** ${player.state.totalWeight} / ${player.state.maxWeight} kg | ${encumbranceState}\n`;
  loadoutSummary += `**Weapon:** ${player.primaryAction ? player.primaryAction.name : "Unarmed"} (Attacks every \`${ticks}\` ticks)\n`;
  if (player.reactions.length > 0) {
    loadoutSummary += `**Reactions:**\n` + player.reactions.map(r => `- ${r.name} (${r.trigger})`).join('\n');
  } else {
    loadoutSummary += `**Reactions:** None`;
  }

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Build Overview`)
    .setColor(0x3498db)
    .addFields(
      { name: "Attributes", value: `💪 **STR**: ${user.strength}\n💨 **DEX**: ${user.dexterity}\n❤️ **VIT**: ${user.vitality}\n🧠 **INT**: ${user.intelligence}`, inline: true },
      { name: "The 3 Layers of Defense", value: `**Evasion**: ${evade}% Chance to dodge\n**Armor Class (AC)**: ${ac} (Approx -${mitigationApprox}% dmg taken)\n**Shield Ward**: ${shield} flat HP buffer`, inline: true },
      { name: "Global Loadout", value: loadoutSummary },
      { name: "Equipped Gear", value: equipList }
    )
    .setFooter({ text: 'Aethermoor Advanced' });
    
  await message.reply({ embeds: [embed] });
}
