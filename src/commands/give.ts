import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

export async function executeGive(message: Message, args: string[]) {
  // rpg give @user item 5
  if (args.length < 2) {
    return message.reply('Usage: `rpg give @user <item_key> [quantity]`');
  }

  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    return message.reply('❌ You must ping a user to give the item to!');
  }

  if (targetUser.id === message.author.id) {
    return message.reply('❌ You cannot trade with yourself!');
  }

  const itemKey = args[1].toLowerCase();
  
  let quantity = 1;
  if (args.length >= 3) {
    if (args[2].toLowerCase() === 'all') {
      // will resolve once we get inventory
    } else {
      quantity = parseInt(args[2], 10);
      if (isNaN(quantity) || quantity <= 0) {
        return message.reply('❌ Invalid quantity to give.');
      }
    }
  }

  const senderDiscordId = message.author.id;
  const receiverDiscordId = targetUser.id;

  const [sender, receiver]: any[] = await Promise.all([
    prisma.player.findUnique({ where: { discordId: senderDiscordId } }),
    prisma.player.findUnique({ where: { discordId: receiverDiscordId } })
  ]);

  if (!sender) return message.reply('❌ You are not registered.');
  if (!receiver) return message.reply('❌ The person you are trying to give to is not registered!');

  const senderInvItem = await prisma.inventoryItem.findUnique({
    where: { playerId_itemKey: { playerId: sender.id, itemKey: itemKey } }
  });

  if (!senderInvItem || senderInvItem.quantity < 1) {
    return message.reply(`❌ You do not own any **${itemKey}** to give.`);
  }

  if (args.length >= 3 && args[2].toLowerCase() === 'all') {
    quantity = senderInvItem.quantity;
  }

  if (senderInvItem.quantity < quantity) {
    return message.reply(`❌ You only have **${senderInvItem.quantity}x** ${itemKey}. You cannot give ${quantity}.`);
  }

  const dbOps: any[] = [];

  // Sender deduct
  if (senderInvItem.quantity === quantity) {
    dbOps.push(prisma.inventoryItem.delete({
      where: { id: senderInvItem.id }
    }));
  } else {
    dbOps.push(prisma.inventoryItem.update({
      where: { id: senderInvItem.id },
      data: { quantity: { decrement: quantity } }
    }));
  }

  // Receiver increment
  dbOps.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: receiver.id, itemKey: itemKey } },
    update: { quantity: { increment: quantity } },
    create: { playerId: receiver.id, itemKey: itemKey, quantity: quantity }
  }));

  await prisma.$transaction(dbOps);

  const emoji = getEmoji(itemKey);

  const embed = new EmbedBuilder()
    .setTitle('🤝 Trade Successful')
    .setColor(0x00FF00)
    .setDescription(`You gave **${quantity}x ${emoji} ${itemKey}** to **<@${receiverDiscordId}>**!`);

  return message.reply({ embeds: [embed] });
}
