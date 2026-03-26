import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';

export async function executeEquip(message: Message, args: string[]) {
  const discordId = message.author.id;
  
  const player = await prisma.player.findUnique({
    where: { discordId }
  });

  if (!player) {
    return message.reply('❌ You belong to the void. Type `rpg start` to manifest a physical form.');
  }

  const equipmentId = args[0];
  if (!equipmentId) {
    return message.reply('❌ Please provide an Equipment ID to equip. Use `rpg inv equipment` to see your gear IDs.');
  }

  let isTool = false;

  // Fetch from Equipment
  let item: any = await prisma.equipment.findFirst({
    where: { id: equipmentId, playerId: player.id }
  });

  if (!item) {
    // Check exact Tool match
    item = await prisma.tool.findFirst({
      where: { id: equipmentId, playerId: player.id }
    });
    if (item) isTool = true;
  }

  if (!item) {
      // Partial ID matching (Equipment)
      const eqItems = await prisma.equipment.findMany({ where: { playerId: player.id }});
      let partialMatch: any = eqItems.find((i: any) => i.id.startsWith(equipmentId));
      
      // Partial ID matching (Tool)
      if (!partialMatch) {
          const tItems = await prisma.tool.findMany({ where: { playerId: player.id }});
          partialMatch = tItems.find((i: any) => i.id.startsWith(equipmentId));
          if (partialMatch) isTool = true;
      }

      if (!partialMatch) {
        return message.reply(`❌ Could not find equipment or tool with ID starting with \`${equipmentId}\`.`);
      }
      return await equipItem(message, player, partialMatch, isTool);
  }

  return await equipItem(message, player, item, isTool);
}

async function equipItem(message: Message, player: any, item: any, isTool: boolean) {
  if (isTool) {
      await prisma.$transaction([
        prisma.tool.updateMany({
          where: { playerId: player.id, type: item.type, equipped: true },
          data: { equipped: false }
        }),
        prisma.tool.update({
          where: { id: item.id },
          data: { equipped: true }
        })
      ]);

      const embed = new EmbedBuilder()
        .setTitle(`🛠️ Tool Equipped`)
        .setColor(0xE67E22)
        .setDescription(`You slung the **${item.name}** to your \`${item.type}\` toolbelt slot!`);

      return message.reply({ embeds: [embed] });
  } else {
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
}
