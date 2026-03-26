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

  const searchStr = args.join(' ').toLowerCase();
  if (!searchStr) {
    return message.reply('❌ Please provide an Equipment Name or ID to equip. Use `rpg inv equipment` to see your gear.');
  }

  let isTool = false;

  // Search through all equipment for this player
  const eqItems = await prisma.equipment.findMany({ where: { playerId: player.id }});
  let item: any = eqItems.find((i: any) => 
    i.id.startsWith(searchStr) || 
    i.name.toLowerCase() === searchStr || 
    i.name.toLowerCase().includes(searchStr) ||
    i.baseItemKey.toLowerCase() === searchStr
  );

  if (!item) {
    const tItems = await prisma.tool.findMany({ where: { playerId: player.id } });
    item = tItems.find((i: any) => 
      i.id.startsWith(searchStr) || 
      (i.name && i.name.toLowerCase() === searchStr) || 
      (i.name && i.name.toLowerCase().includes(searchStr)) ||
      i.type.toLowerCase() === searchStr
    );
    if (item) isTool = true;
  }

  if (!item) {
    return message.reply(`❌ Could not find equipment or tool matching \`${searchStr}\`. Use \`rpg inv equipment\` or \`rpg inv tools\` to see what you own.`);
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
