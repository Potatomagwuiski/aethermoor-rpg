import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';

export async function handleProfile(message: Message) {
  const userId = message.author.id;
  const username = message.author.username;

  const user = await prisma.user.findUnique({
    where: { id: userId }
  });

  if (!user) {
    return message.reply("> ⚠️ **Hold on!**\n> You haven't started your journey yet! Type `rpg start` to begin.");
  }

  // Because we haven't implemented the Weapon/Armor registry yet,
  // we cannot fetch the actual name of equipped gear. So we'll render [ Empty ] if null,
  // or [ Equipped ] if not null. 
  // In the future this will lookup a GEAR_REGISTRY.
  const formatSlot = (slot: string | null) => slot ? `[ Equipped ]` : `[ Empty ]`;

  const profileText = `
> 👤 **${username.toUpperCase()}'S PROFILE**
> 
> 🏅 **Level:** ${user.level}
> 💎 **XP:** ${user.xp}
> 💰 **Gold:** ${user.gold}g
> 
> 📊 **ATTRIBUTES**
> STR: \`${user.str}\` | DEX: \`${user.dex}\` | VIT: \`${user.vit}\` | AGI: \`${user.agi}\` | INT: \`${user.int}\`
> 
> ⚔️ **LOADOUT**
> **Weapon:** ${formatSlot(user.weaponId)}
> **Armor:** ${formatSlot(user.armorId)}
> **Helmet:** ${formatSlot(user.helmetId)}
> **Boots:** ${formatSlot(user.bootsId)}
> **Gloves:** ${formatSlot(user.glovesId)}
> **Amulet:** ${formatSlot(user.amuletId)}
> **Ring 1:** ${formatSlot(user.ring1Id)}
> **Ring 2:** ${formatSlot(user.ring2Id)}
  `.trim();

  return message.reply(profileText);
}
