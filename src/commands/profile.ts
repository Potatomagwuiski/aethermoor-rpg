import prisma from '../lib/prisma';
import { Message, EmbedBuilder } from 'discord.js';
import { STANCES, ACTIONS, REACTIONS } from '../game/items';

export async function handleProfile(message: Message) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (!user) return message.reply("You haven't started yet! Type `rpg start`.");
  
  const stance = user.stanceId ? STANCES[user.stanceId] : null;
  const action = user.actionId ? ACTIONS[user.actionId] : null;
  const reaction = user.reactionId ? REACTIONS[user.reactionId] : null;

  // Compute Defensive Matrix
  const evade = Math.max(0, Math.min(80, 5 + Math.floor(user.dexterity / 2) + (stance?.modifiers.evadeBonus || 0)));
  const ac = user.vitality + (stance?.modifiers.acBonus || 0);
  const shield = stance?.modifiers.shieldBonus || 0;
  
  // Compute Speed Engine
  const dexReduction = Math.max(0.5, 1 - (user.dexterity * 0.01));
  const ticks = Math.floor((action?.baseSpeed || 100) * (stance?.modifiers.speedMult || 1.0) * dexReduction);

  // Mitigation context
  const mitigationApprox = Math.floor((1 - (100 / (100 + Math.max(0, ac)))) * 100);

  const embed = new EmbedBuilder()
    .setTitle(`${message.author.username}'s Build Overview`)
    .setColor(0x3498db)
    .addFields(
      { name: "Attributes", value: `💪 **STR**: ${user.strength}\n💨 **DEX**: ${user.dexterity}\n❤️ **VIT**: ${user.vitality}\n🧠 **INT**: ${user.intelligence}`, inline: true },
      { name: "The 3 Layers of Defense", value: `**Evasion**: ${evade}% Chance to dodge completely\n**Armor Class (AC)**: ${ac} (Approx -${mitigationApprox}% dmg taken)\n**Shield Ward**: ${shield} flat HP buffer`, inline: true },
      { name: "Deep Loadout", value: `**Stance:** ${stance ? stance.name : "None"}\n**Action:** ${action ? action.name : "None"} (Attacks every \`${ticks}\` ticks)\n**Reaction:** ${reaction ? reaction.name : "None"}` }
    )
    .setFooter({ text: 'Aethermoor Advanced' });
    
  await message.reply({ embeds: [embed] });
}
