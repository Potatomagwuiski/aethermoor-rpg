import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

const SHOP_ITEMS: Record<string, { id: string, name: string, price: number, icon: string, description: string }> = {
  'lootbox': { id: 'lootbox', name: 'Mystery Loot Box', price: 200, icon: '📦', description: 'Roll for random gear, ores, or wood. Bypasses gathering.' },
  'egg': { id: 'egg', name: 'Gacha Pet Egg', price: 1000, icon: '🥚', description: 'Roll for a random pet. The ultimate Casino sink.' },
  'dungeon_key': { id: 'dungeon_key', name: 'Dungeon Key', price: 5000, icon: '🗝️', description: 'Grants access to a 5-stage Dungeon featuring a massive Boss.' },
  'wheat_seed': { id: 'wheat_seed', name: 'Wheat Seed', price: 10, icon: '🌾', description: 'A basic seed used for farming.' },
  'potato_seed': { id: 'potato_seed', name: 'Potato Seed', price: 20, icon: '🥔', description: 'A sturdy seed used for farming.' },
  'moon_seed': { id: 'moon_seed', name: 'Moon Herb Seed', price: 150, icon: '🌙', description: 'A highly rare magical seed used for premium farming.' }
};

export async function executeShop(message: Message, args: string[]) {
  const embed = new EmbedBuilder()
    .setTitle('🛒 The Grand Bazaar')
    .setColor(0xFFD700)
    .setDescription('Welcome to the shop! Use `rpg buy <item_id> [quantity]` to purchase an item.')
    .setFooter({ text: 'No weapons or armor sold here. Real power is earned (or gambled).' });

  let catalog = '';
  for (const [key, item] of Object.entries(SHOP_ITEMS)) {
    catalog += `**${item.icon} ${item.name}** (\`${key}\`)\n💰 **${item.price} Gold** - ${item.description}\n\n`;
  }
  
  embed.addFields({ name: 'Catalog', value: catalog });
  return message.reply({ embeds: [embed] });
}

export async function executeBuy(message: Message, args: string[]) {
  if (args.length === 0) {
    return message.reply('Please specify what you want to buy! Example: `rpg buy lootbox` or `rpg buy egg 5`');
  }

  const itemId = args[0].toLowerCase();
  const quantityInput = args[1] ? parseInt(args[1], 10) : 1;

  if (isNaN(quantityInput) || quantityInput <= 0) {
    return message.reply('Invalid quantity!');
  }

  const item = SHOP_ITEMS[itemId];
  if (!item) {
    return message.reply('That item does not exist in the shop! Type `rpg shop` to see the catalog.');
  }

  const totalCost = item.price * quantityInput;

  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  if (player.gold < totalCost) {
    return message.reply(`💸 You don't have enough Gold! You need **${totalCost} Gold**, but you only have **${player.gold} Gold**.`);
  }

  // Transaction: Deduct gold, add items to inventory
  await prisma.$transaction([
    prisma.player.update({
      where: { id: player.id },
      data: { gold: { decrement: totalCost } }
    }),
    prisma.inventoryItem.upsert({
      where: { playerId_itemKey: { playerId: player.id, itemKey: item.id } },
      update: { quantity: { increment: quantityInput } },
      create: { playerId: player.id, itemKey: item.id, quantity: quantityInput }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle('✅ Purchase Successful')
    .setColor(0x00FF00)
    .setDescription(`You paid **${totalCost} Gold** and received **${quantityInput}x ${item.icon} ${item.name}**.`)
    .setFooter({ text: `Remaining Balance: ${player.gold - totalCost} Gold` });

  return message.reply({ embeds: [embed] });
}
