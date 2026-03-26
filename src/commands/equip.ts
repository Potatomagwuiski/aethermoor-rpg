import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import { PlayerClass } from '@prisma/client';

export async function executeEquip(message: Message, args: string[]) {
  const discordId = message.author.id;
  
  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('❌ You belong to the void. Type `rpg start <class>` to manifest a physical form.');
  }

  const equipmentId = args[0];
  if (!equipmentId) {
    return message.reply('❌ Please provide an Equipment ID to equip. Use `rpg inv equipment` to see your gear IDs.');
  }

  // Fetch the item
  const item = await prisma.equipment.findFirst({
    where: {
      id: equipmentId,
      playerId: player.id
    }
  });

  if (!item) {
      // Let's also check if they provided a partial ID (first 4 characters)
      const items = await prisma.equipment.findMany({ where: { playerId: player.id }});
      const partialMatch = items.find((i: any) => i.id.startsWith(equipmentId));
      if (!partialMatch) {
        return message.reply(`❌ Could not find equipment with ID starting with \`${equipmentId}\`.`);
      }
      return await equipItem(message, player, partialMatch);
  }

  return await equipItem(message, player, item);
}

async function equipItem(message: Message, player: any, item: any) {
  const c = item.equipmentClass;
  let allowed = false;

  if (c === 'ANY') allowed = true;
  else if (player.activeClass === PlayerClass.WARRIOR && (c === 'HEAVY_WEAPON' || c === 'HEAVY_ARMOR')) allowed = true;
  else if (player.activeClass === PlayerClass.ROGUE && (c === 'FINESSE_WEAPON' || c === 'LIGHT_ARMOR')) allowed = true;
  else if ((player.activeClass === PlayerClass.MAGE || player.activeClass === PlayerClass.NECROMANCER) && (c === 'MAGIC_WEAPON' || c === 'CLOTH')) allowed = true;

  if (!allowed) {
      return message.reply(`❌ **Class Restriction!** Your class (\`${player.activeClass}\`) cannot wield \`${c}\` items.`);
  }

  // Transaction: Unequip current slot, equip new slot
  await prisma.$transaction([
    prisma.equipment.updateMany({
      where: { playerId: player.id, slot: item.slot, equipped: true },
      data: { equipped: false }
    }),
    prisma.equipment.update({
      where: { id: item.id },
      data: { equipped: true }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle(`🛡️ Equipment Equipped`)
    .setColor(0x00FF00)
    .setDescription(`You stripped off your old gear and equipped **${item.name}** to your \`${item.slot}\` slot!`);

  return message.reply({ embeds: [embed] });
}
