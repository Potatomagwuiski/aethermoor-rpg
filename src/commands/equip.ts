import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeEquip(message: Message, args: string[]) {
  const discordId = message.author.id;

  if (args.length < 1) {
    return message.reply('Usage: `rpg equip <item_id>`');
  }

  const itemId = args[0];

  const player = await prisma.player.findUnique({
    where: { discordId },
    include: {
      inventory: {
        where: { itemId }
      },
      equipment: true
    }
  });

  if (!player) {
    return message.reply('You do not have a profile yet! Use `rpg start`.');
  }

  if (player.inventory.length === 0) {
    return message.reply(`You do not own an item with ID \`${itemId}\`. Use \`rpg inv\` to check your inventory.`);
  }

  // Find the exact item globally to get its slot
  const itemToEquip = await prisma.item.findUnique({
    where: { id: itemId }
  });

  if (!itemToEquip) {
    return message.reply('Item not found in the manifest.');
  }

  const slotMap: Record<string, string> = {
    'MainHand': 'mainHandId',
    'OffHand': 'offHandId',
    'Helmet': 'helmetId',
    'Chest': 'chestId',
    'Gloves': 'glovesId',
    'Boots': 'bootsId',
    'Cloak': 'cloakId',
    'Amulet': 'amuletId',
    'Ring': 'ring1Id' // Note: This simplistic mapping defaults to Ring1
  };

  const dbField = slotMap[itemToEquip.slot];

  if (!dbField) {
    return message.reply(`Unknown slot for item: ${itemToEquip.slot}`);
  }

  // Handle Rings (try ring1 first, then ring2)
  let actualDbField = dbField;
  if (itemToEquip.slot === 'Ring') {
    if (player.equipment?.ring1Id && !player.equipment?.ring2Id) {
      actualDbField = 'ring2Id'; // If ring1 is full but ring2 is empty, fill 2.
    }
  }

  const updateData = {
    [actualDbField]: itemToEquip.id
  };

  await prisma.equipment.update({
    where: { playerId: discordId },
    data: updateData
  });

  const embed = new EmbedBuilder()
    .setColor('#9B59B6')
    .setTitle('Item Equipped!')
    .setDescription(`Successfully equipped **${itemToEquip.name}** to your \`${actualDbField.replace('Id', '')}\` slot!`);

  await message.reply({ embeds: [embed] });
}
