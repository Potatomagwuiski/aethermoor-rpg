import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { enforceCooldown } from '../utils/cooldown.js';

const SHOP_ITEMS: Record<string, { id: string, name: string, price: number, icon: string, description: string }> = {
  'lootbox': { id: 'lootbox', name: 'Mystery Loot Box', price: 200, icon: '📦', description: 'Roll for random gear, ores, or wood. Bypasses gathering.' },
  'lumina_lootbox': { id: 'lumina_lootbox', name: 'Lumina Lootbox', price: 10000, icon: '📦', description: 'Tier 1 Resource Lootbox. Grants Gold, Basic Materials, and a Lumina Pet Egg.' },
  'mystic_lootbox': { id: 'mystic_lootbox', name: 'Mystic Lootbox', price: 25000, icon: '📦', description: 'Tier 2 Resource Lootbox. Grants Gold, Intermediate Materials, and a Mystic Pet Egg.' },
  'abyssal_lootbox': { id: 'abyssal_lootbox', name: 'Abyssal Lootbox', price: 50000, icon: '📦', description: 'Tier 3 Resource Lootbox. Grants Gold, Advanced Materials, and an Abyssal Pet Egg.' },
  'astral_lootbox': { id: 'astral_lootbox', name: 'Astral Lootbox', price: 100000, icon: '📦', description: 'Tier 4 Resource Lootbox. Massive Gold & Elite Material drop. Astral Casino Pet Egg included.' },
  'dungeon_key': { id: 'dungeon_key', name: 'Dungeon Key', price: 5000, icon: '🗝️', description: 'Grants access to a 5-stage Dungeon featuring a massive Boss.' },
  'life_potion': { id: 'life_potion', name: 'Life Potion', price: 50, icon: '🧪', description: 'Restores you to Max HP. Required if you die during a Hunt or in a Dungeon.' },
  'guild_charter': { id: 'guild_charter', name: 'Guild Charter', price: 10000, icon: '📜', description: 'Massive Gold Sink. A prestigious charter allowing you to found a Guild.' },
  'hero_title': { id: 'hero_title', name: 'Heroic Title', price: 50000, icon: '👑', description: 'The Ultimate Gold Sink. Buy your way into nobility.' },
  'castle_deed': { id: 'castle_deed', name: 'Castle Deed', price: 100000, icon: '🏰', description: 'Real Estate. Claim a permanent stronghold.' },
  'wheat_seed': { id: 'wheat_seed', name: 'Wheat Seed', price: 10, icon: '🌾', description: 'A basic seed used for harvesting.' },
  'potato_seed': { id: 'potato_seed', name: 'Potato Seed', price: 20, icon: '🥔', description: 'A sturdy seed used for harvesting.' },
  'moon_seed': { id: 'moon_seed', name: 'Moon Herb Seed', price: 150, icon: '🌙', description: 'A highly rare magical seed used for premium harvesting.' }
};

export async function executeShop(message: Message, args: string[]) {
  const embed = new EmbedBuilder()
    .setTitle('🛒 The Grand Bazaar')
    .setColor(0xFFD700)
    .setDescription('Welcome to the shop! Use `rpg buy <item_id> [quantity]` to purchase an item.')
    .setFooter({ text: 'No weapons or armor sold here. Real power is earned (or gambled).' });

  let catalog1 = '';
  let catalog2 = '';
  let count = 0;
  for (const [key, item] of Object.entries(SHOP_ITEMS)) {
    const entry = `**${item.icon} ${item.name}** (\`${key}\`)\n💰 **${item.price} Gold** - ${item.description}\n\n`;
    if (count < 6) catalog1 += entry;
    else catalog2 += entry;
    count++;
  }
  
  embed.addFields(
    { name: 'General & Premium Goods', value: catalog1 },
    { name: 'Deeds & Farming Seeds', value: catalog2 }
  );
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
  
  if (itemId === 'lootbox') {
      const cdKey = `cd:buy_lootbox:${discordId}`;
      const cd = await enforceCooldown(cdKey, 7200);
      if (cd.onCooldown) {
          const hours = Math.floor(cd.remainingMs / (1000 * 60 * 60));
          const mins = Math.floor((cd.remainingMs % (1000 * 60 * 60)) / (1000 * 60));
          return message.reply(`⏳ Stop right there! The merchant needs time to restock Mystery Loot Boxes. Please wait **${hours}h ${mins}m** before buying another.`);
      }
  }
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
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
