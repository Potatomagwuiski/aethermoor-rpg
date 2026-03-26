import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executePay(message: Message, args: string[]) {
  // rpg pay @user 500
  if (args.length < 2) {
    return message.reply('Usage: `rpg pay @user <amount>`');
  }

  const targetUser = message.mentions.users.first();
  if (!targetUser) {
    return message.reply('❌ You must ping a user to pay them!');
  }

  if (targetUser.id === message.author.id) {
    return message.reply('❌ You cannot pay yourself!');
  }

  // The amount could be either args[1] if the ping is args[0], sometimes Discord puts Ping in [0] and amount in [1]
  // In `rpg pay <@id> 500`, args[0] gets evaluated as <@id>, args[1] as '500'.
  const amountStr = args.find(arg => !arg.includes('<@'));
  if (!amountStr) {
      return message.reply('❌ Missing amount of gold to send.');
  }

  const amount = parseInt(amountStr, 10);
  if (isNaN(amount) || amount <= 0) {
    return message.reply('❌ Invalid amount of gold to send.');
  }

  const senderDiscordId = message.author.id;
  const receiverDiscordId = targetUser.id;

  const [sender, receiver]: any[] = await Promise.all([
    prisma.player.findUnique({ where: { discordId: senderDiscordId } }),
    prisma.player.findUnique({ where: { discordId: receiverDiscordId } })
  ]);

  if (!sender) return message.reply('❌ You are not registered.');
  if (!receiver) return message.reply('❌ The person you are trying to pay is not registered!');

  if (sender.gold < amount) {
    return message.reply(`💸 You do not have enough Gold! You only have **${sender.gold} Gold**.`);
  }

  const dbOps: any[] = [];
  
  dbOps.push(prisma.player.update({
    where: { id: sender.id },
    data: { gold: { decrement: amount } }
  }));

  dbOps.push(prisma.player.update({
    where: { id: receiver.id },
    data: { gold: { increment: amount } }
  }));

  await prisma.$transaction(dbOps);

  const embed = new EmbedBuilder()
    .setTitle('💰 Transaction Complete')
    .setColor(0xFFFF00)
    .setDescription(`You successfully transferred **${amount} Gold** to **<@${receiverDiscordId}>**!`);

  return message.reply({ embeds: [embed] });
}
