import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getSellPrice } from '../utils/prices.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeSell(message: Message, args: string[]) {
  if (args.length === 0) {
    return message.reply(`Please specify what you want to sell. Example: \`rpg sell wood 10\` or \`rpg sell common_iron_sword\``);
  }

  const itemId = args[0].toLowerCase();
  
  // if quantity is not specified, default to 1
  let quantity = 1;

  const discordId = message.author.id;
  // Load player bypassing cached types if necessary, though pure prisma works
  const player: any = await prisma.player.findUnique({ 
    where: { discordId } 
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start`.');
  }

  const inventoryItem = await prisma.inventoryItem.findUnique({
    where: { playerId_itemKey: { playerId: player.id, itemKey: itemId } }
  });

  if (!inventoryItem || inventoryItem.quantity < 1) {
    return message.reply(`❌ You do not have any **${itemId}** in your inventory to sell!`);
  }

  // Parse quantity argument
  if (args.length > 1) {
    if (args[1].toLowerCase() === 'all') {
      quantity = inventoryItem.quantity;
    } else {
      quantity = parseInt(args[1], 10);
      if (isNaN(quantity) || quantity <= 0) {
        return message.reply('❌ Invalid quantity specified!');
      }
    }
  }

  // Double check player actually has enough
  if (inventoryItem.quantity < quantity) {
    return message.reply(`❌ You only have **${inventoryItem.quantity}x** ${itemId}. You cannot sell ${quantity}.`);
  }

  const pricePerItem = getSellPrice(itemId);
  const totalGold = pricePerItem * quantity;
  const emoji = getEmoji(itemId);

  // Perform Transaction
  const dbOps: any[] = [];
  
  // 1. the gold
  dbOps.push(prisma.player.update({
    where: { id: player.id },
    data: { gold: { increment: totalGold } }
  }));

  // 2. the item reduction (if it hits 0, delete it to save space)
  if (inventoryItem.quantity === quantity) {
    dbOps.push(prisma.inventoryItem.delete({
      where: { id: inventoryItem.id }
    }));
  } else {
    dbOps.push(prisma.inventoryItem.update({
      where: { id: inventoryItem.id },
      data: { quantity: { decrement: quantity } }
    }));
  }

  await prisma.$transaction(dbOps);

  const embed = new EmbedBuilder()
    .setTitle('💰 Items Sold')
    .setColor(0xFFD700)
    .setDescription(`You sold **${quantity}x ${emoji} ${itemId}** for **${totalGold} Gold**!`)
    .setFooter({ text: `New Balance: ${player.gold + totalGold} Gold`});

  return message.reply({ embeds: [embed] });
}
