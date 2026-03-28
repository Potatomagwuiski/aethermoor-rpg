import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executePets(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { pets: true }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  // Handle Equipping
  if (args.length > 0 && args[0].toLowerCase() === 'equip') {
    if (args.length < 2) {
      return message.reply('Please specify the exact name of the pet you want to equip. (E.g. `rpg pets equip Cave Bat`)');
    }
    
    const petNameInput = args.slice(1).join(' ').toLowerCase();
    const targetPet = player.pets.find(p => p.name.toLowerCase() === petNameInput);
    
    if (!targetPet) {
      return message.reply(`You don't own a pet named "${petNameInput}". Check your spelling!`);
    }

    // Unequip all other pets
    await prisma.pet.updateMany({
      where: { playerId: player.id },
      data: { equipped: false }
    });

    // Equip target pet
    await prisma.pet.update({
      where: { id: targetPet.id },
      data: { equipped: true }
    });

    return message.reply(`🐾 You have successfully equipped your **${targetPet.emoji} ${targetPet.name}**! Its passive stat bonuses are now active globally.`);
  }

  // View Pet Stable
  const { pets } = player;

  if (pets.length === 0) {
    return message.reply('🥚 Your Pet Stable is completely empty! Buy a `Gacha Pet Egg` from the shop (`rpg shop`) or find one exploring, and type `rpg hatch <egg_type>` to get a companion!');
  }

  const embed = new EmbedBuilder()
    .setTitle(`🐾 ${player.name}'s Pet Stable`)
    .setColor(0x00FF00)
    .setDescription('Equip a pet to receive its passive stat bonuses during combat! Type `rpg pets equip <Pet Name>` to equip one.');

  // Sort pets: Equipped first, then Rarity, then Name
  const rarityValues: Record<string, number> = { COMMON: 1, UNCOMMON: 2, RARE: 3, EPIC: 4, LEGENDARY: 5 };
  pets.sort((a, b) => {
    if (a.equipped && !b.equipped) return -1;
    if (!a.equipped && b.equipped) return 1;
    return rarityValues[b.rarity] - rarityValues[a.rarity];
  });

  let petList = '';
  for (const pet of pets) {
    const equipTag = pet.equipped ? '⭐ **[ACTIVE]** ' : '';
    let rarityStr = `[${pet.rarity}]`;
    if (pet.rarity === 'LEGENDARY') rarityStr = `✨ [LEGENDARY] ✨`;
    
    petList += `${equipTag}${pet.emoji} **${pet.name}**  \`${rarityStr}\`\n`;
    petList += `> ⚔️ \`+${pet.bonusAtk} ATK\` | 🛡️ \`+${pet.bonusDef} DEF\` | ❤️ \`+${pet.bonusHp} HP\`\n\n`;
  }

  // Discord embeds have a 4096 char limit on description, we might need to truncate for heavy players
  if (petList.length > 3900) {
    petList = petList.substring(0, 3900) + '...\n*(List truncated)*';
  }

  embed.addFields({ name: 'Your Companions', value: petList });

  return message.reply({ embeds: [embed] });
}
