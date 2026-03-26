import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export const ZONES: Record<string, { name: string; minLevel: number; emoji: string; desc: string }> = {
  lumina_plains: { 
    name: "Lumina Plains", 
    minLevel: 1, 
    emoji: "🌾",
    desc: "A vast, sun-drenched expanse perfect for beginners. Copper is abundant." 
  },
  whispering_woods: { 
    name: "The Whispering Woods", 
    minLevel: 15, 
    emoji: "🌲",
    desc: "An eerie, ancient forest. Dire wolves lurk in the shadows, and Iron runs deep." 
  },
  ironpeak_mountains: { 
    name: "The Ironpeak Mountains", 
    minLevel: 30, 
    emoji: "⛰️",
    desc: "Jagged frozen peaks containing rich Steel veins and dangerous Frost Giants." 
  },
  ashen_wastes: { 
    name: "The Ashen Wastes", 
    minLevel: 50, 
    emoji: "🌋",
    desc: "A scorched volcanic realm hiding precious Mythril under lakes of fire." 
  },
  abyssal_depths: { 
    name: "The Abyssal Depths", 
    minLevel: 80, 
    emoji: "🌌",
    desc: "The edge of the physical realm. Only the legendary survive here to harvest Voidstone." 
  }
};

export async function executeTravel(message: Message, args: string[]) {
  const targetZone = args[0]?.toLowerCase();
  const userId = message.author.id;

  const player = await prisma.player.findUnique({ where: { discordId: userId } });
  if (!player) {
      await message.reply('You are not logged in. Use `rpg start`.');
      return;
  }

  // If no zone provided, display the World Map
  if (!targetZone) {
    const embed = new EmbedBuilder()
      .setTitle('🗺️ The World of Aethermoor')
      .setColor(0x2B2D31)
      .setDescription(`You are currently in **${ZONES[player.location]?.name || 'Unknown'}**.\n\nUse \`/rpg travel <zone>\` to journey to a new region.`);

    for (const [key, zone] of Object.entries(ZONES)) {
      const locked = player.level < zone.minLevel;
      const statusIcon = locked ? '🔒' : '✅';
      const indicator = player.location === key ? `📍 **CURRENT LOCATION**\n` : '';
      
      embed.addFields({
        name: `${statusIcon} ${zone.emoji} ${zone.name} (Lv. ${zone.minLevel}+)`,
        value: `${indicator}${zone.desc}\n\`ID: ${key}\``
      });
    }

    await message.reply({ embeds: [embed] });
    return;
  }

  // Validate the targeted zone
  const zoneDef = ZONES[targetZone];
  if (!zoneDef) {
    await message.reply('❌ Invalid zone ID. Use `rpg travel` to see the map.');
    return;
  }

  // Check Level requirements
  if (player.level < zoneDef.minLevel) {
    await message.reply(`🔒 **Level Requirement Not Met!** You must be at least **Level ${zoneDef.minLevel}** to survive the journey to ${zoneDef.emoji} **${zoneDef.name}**. You are currently Level ${player.level}.`);
    return;
  }

  // Prevent traveling to current location
  if (player.location === targetZone) {
    await message.reply(`📍 You are already at **${zoneDef.name}**.`);
    return;
  }

  // Execute Travel
  await prisma.player.update({
    where: { id: player.id },
    data: { location: targetZone }
  });

  const travelEmbed = new EmbedBuilder()
    .setTitle(`🧭 Journey Complete`)
    .setColor(0x2B2D31)
    .setDescription(`You pack your bags and traverse the landscape...\n\nYou have arrived at ${zoneDef.emoji} **${zoneDef.name}**.\nThe local environment and its resources are now accessible.`);

  await message.reply({ embeds: [travelEmbed] });
}
