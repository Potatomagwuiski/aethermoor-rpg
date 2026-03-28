import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { Rarity } from '@prisma/client';
import { BLUEPRINTS } from './forge.js';
import { getEmoji } from '../utils/emojis.js';

const PET_POOL = [
  { name: 'Slime', emoji: '💧', rarity: Rarity.COMMON, baseWeight: 60, stats: { atk: 1, def: 1, hp: 5 } },
  { name: 'Dust Bunny', emoji: '🐰', rarity: Rarity.COMMON, baseWeight: 60, stats: { atk: 2, def: 0, hp: 5 } },
  { name: 'Dire Wolf', emoji: '🐺', rarity: Rarity.UNCOMMON, baseWeight: 25, stats: { atk: 3, def: 2, hp: 10 } },
  { name: 'Cave Bat', emoji: '🦇', rarity: Rarity.UNCOMMON, baseWeight: 25, stats: { atk: 4, def: 1, hp: 10 } },
  { name: 'Gryphon', emoji: '🦅', rarity: Rarity.RARE, baseWeight: 10, stats: { atk: 5, def: 5, hp: 20 } },
  { name: 'Armored Bear', emoji: '🐻', rarity: Rarity.RARE, baseWeight: 10, stats: { atk: 3, def: 8, hp: 30 } },
  { name: 'Phoenix', emoji: '🔥', rarity: Rarity.EPIC, baseWeight: 3, stats: { atk: 15, def: 10, hp: 50 } },
  { name: 'Frost Wyrm', emoji: '❄️', rarity: Rarity.EPIC, baseWeight: 3, stats: { atk: 12, def: 15, hp: 60 } },
  { name: 'Astral Dragon', emoji: '🌌', rarity: Rarity.LEGENDARY, baseWeight: 0.5, stats: { atk: 35, def: 35, hp: 150 } },
  { name: 'Lich King Fragment', emoji: '👑', rarity: Rarity.LEGENDARY, baseWeight: 0.3, stats: { atk: 50, def: 10, hp: 100 } },
];

function pullGachaPet(eggType: string) {
  let weights = PET_POOL.map(pet => {
    let multiplier = 1.0;
    if (eggType === 'lumina_egg') {
      if (pet.rarity === 'EPIC' || pet.rarity === 'LEGENDARY') multiplier = 0.1; // Extremely rare
    } else if (eggType === 'mystic_egg') {
      if (pet.rarity === 'COMMON') multiplier = 0.5;
      if (pet.rarity === 'RARE') multiplier = 2.0;
    } else if (eggType === 'abyssal_egg') {
      if (pet.rarity === 'COMMON' || pet.rarity === 'UNCOMMON') multiplier = 0.1;
      if (pet.rarity === 'RARE') multiplier = 3.0;
      if (pet.rarity === 'EPIC') multiplier = 5.0;
      if (pet.rarity === 'LEGENDARY') multiplier = 2.0;
    } else if (eggType === 'astral_egg') {
      if (pet.rarity === 'COMMON' || pet.rarity === 'UNCOMMON') multiplier = 0.01;
      if (pet.rarity === 'RARE') multiplier = 1.0;
      if (pet.rarity === 'EPIC') multiplier = 8.0;
      if (pet.rarity === 'LEGENDARY') multiplier = 10.0;
    }
    return { ...pet, currentWeight: pet.baseWeight * multiplier };
  });

  const totalWeight = weights.reduce((acc, pet) => acc + pet.currentWeight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pet of weights) {
    if (random < pet.currentWeight) return pet;
    random -= pet.currentWeight;
  }
  return weights[0]; // Fallback
}

export async function executeOpen(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  if (args.length === 0) {
    return message.reply('Please specify an item to open! Example: `rpg open lootbox` or `rpg open lumina`');
  }

  let itemName = args[0].toLowerCase();
  
  // Allow "rpg open lumina" to map to "lumina_lootbox" or "lumina_egg"
  const aliases = ['lumina', 'mystic', 'abyssal', 'astral'];
  if (aliases.includes(itemName)) {
      if (args[1] === 'egg') itemName += '_egg';
      else itemName += '_lootbox';
  }

  const validItems = [
    'lumina_egg', 'mystic_egg', 'abyssal_egg', 'astral_egg', 
    'lootbox', 
    'lumina_lootbox', 'mystic_lootbox', 'abyssal_lootbox', 'astral_lootbox'
  ];
  if (!validItems.includes(itemName)) {
      return message.reply(`Invalid item to open. Available: \`lootbox\`, \`lumina\`, \`mystic\`, \`abyssal\`, \`astral\`.`);
  }

  // Check for the Item in Inventory
  const itemRecord = await prisma.inventoryItem.findUnique({
    where: { playerId_itemKey: { playerId: player.id, itemKey: itemName } }
  });

  if (!itemRecord || itemRecord.quantity < 1) {
    const formattedName = itemName.replace('_', ' ').replace(/\b\w/g, c => c.toUpperCase());
    return message.reply(`📦 You do not have any \`${formattedName}\`s to open! Buy one from the \`rpg shop\` or find one in the world.`);
  }

  // Database ops aggregator
  const ops: any[] = [];
  let descriptionOutput = '';
  let color = 0xFFFFFF;
  let title = '';

  // Consume the item
  ops.push(prisma.inventoryItem.update({
    where: { id: itemRecord.id },
    data: { quantity: { decrement: 1 } }
  }));

  // Loot Rewards Storage
  const rewardedItems: Record<string, number> = {};
  let rewardedGold = 0;

  const giveItem = (key: string, qty: number) => {
      rewardedItems[key] = (rewardedItems[key] || 0) + qty;
  };

  // 1) EGG LOGIC
  if (itemName.includes('_egg')) {
      const petData = pullGachaPet(itemName);
      
      ops.push(prisma.pet.create({
        data: {
          playerId: player.id,
          name: petData.name,
          emoji: petData.emoji,
          rarity: petData.rarity as any,
          bonusAtk: petData.stats.atk,
          bonusDef: petData.stats.def,
          bonusHp: petData.stats.hp,
          equipped: false, 
          level: 1
        }
      }));

      if (petData.rarity === 'UNCOMMON') color = 0x00FF00;
      if (petData.rarity === 'RARE') color = 0x0000FF;
      if (petData.rarity === 'EPIC') color = 0x800080;
      if (petData.rarity === 'LEGENDARY') color = 0xFFD700;

      title = `🥚 Hatching ${itemName.split('_')[0].toUpperCase()} Egg...`;
      let rarityString = `[${petData.rarity}]`;
      if (petData.rarity === 'LEGENDARY') rarityString = `✨ [${petData.rarity}] ✨`;
      descriptionOutput = `You crack open the Egg and extract its life essence...\n\n**You hatched a ${rarityString} ${petData.emoji} ${petData.name}!**\n(⚔️ +${petData.stats.atk} ATK | 🛡️ +${petData.stats.def} DEF | ❤️ +${petData.stats.hp} HP)\n`;
  }

  // 2) TIERED LOOTBOX LOGIC
  else if (itemName.includes('_lootbox')) {
      const droppedEggKey = itemName.replace('_lootbox', '_egg');
      giveItem(droppedEggKey, 1);
      
      title = `📦 Opening ${itemName.split('_')[0].toUpperCase()} Lootbox...`;
      color = 0xF1C40F;
      descriptionOutput = `You pry open the locked crate, discovering hidden riches! And... there's a Pet Egg tucked safely inside!\n\n**Rewards Dropped:**\n`;

      // Resource Scaling based on Tier
      if (itemName === 'lumina_lootbox') {
          rewardedGold = Math.floor(Math.random() * 50) + 25;
          giveItem('wood', Math.floor(Math.random() * 5) + 2);
          giveItem('copper_ore', Math.floor(Math.random() * 3) + 1);
      } else if (itemName === 'mystic_lootbox') {
          rewardedGold = Math.floor(Math.random() * 150) + 50;
          giveItem('oakwood', Math.floor(Math.random() * 10) + 5);
          giveItem('iron_ore', Math.floor(Math.random() * 5) + 2);
          giveItem('silver_ore', Math.floor(Math.random() * 2) + 1);
      } else if (itemName === 'abyssal_lootbox') {
          rewardedGold = Math.floor(Math.random() * 500) + 200;
          giveItem('ashwood', Math.floor(Math.random() * 15) + 8);
          giveItem('mithril_ore', Math.floor(Math.random() * 8) + 3);
          giveItem('gold_ore', Math.floor(Math.random() * 3) + 1);
      } else if (itemName === 'astral_lootbox') {
          rewardedGold = Math.floor(Math.random() * 1000) + 500;
          giveItem('elderwood', Math.floor(Math.random() * 20) + 10);
          giveItem('steel_ore', Math.floor(Math.random() * 10) + 5);
          giveItem('diamond', Math.floor(Math.random() * 3) + 1);
      }
  }

  // 3) MYSTERY LOOTBOX LOGIC
  else if (itemName === 'lootbox') {
      title = '📦 Opening Mystery Loot Box...';
      color = 0x3498DB;
      descriptionOutput = `You pry open the locked crate, discovering hidden riches inside...\n\n`;

      rewardedGold = Math.floor(Math.random() * 150) + 50;

      // Random gear, ores, or wood
      const possibleMats = ['wood', 'sticks', 'oakwood', 'copper_ore', 'iron_ore', 'coal'];
      for (let i = 0; i < 3; i++) {
          const mat = possibleMats[Math.floor(Math.random() * possibleMats.length)];
          giveItem(mat, Math.floor(Math.random() * 5) + 2);
      }

      // 10% chance for a Blueprint
      if (Math.random() <= 0.10) {
          const bps = Object.keys(BLUEPRINTS);
          const randomBp = bps[Math.floor(Math.random() * bps.length)];
          giveItem(randomBp, 1);
      }
  }

  // Process Gold & Item DB Transactions
  if (rewardedGold > 0) {
      ops.push(prisma.player.update({
          where: { id: player.id },
          data: { gold: { increment: rewardedGold } }
      }));
      descriptionOutput += `💰 **+${rewardedGold} Gold**\n`;
  }

  for (const [key, qty] of Object.entries(rewardedItems)) {
      ops.push(prisma.inventoryItem.upsert({
          where: { playerId_itemKey: { playerId: player.id, itemKey: key } },
          update: { quantity: { increment: qty } },
          create: { playerId: player.id, itemKey: key, quantity: qty }
      }));
      
      let displayName = key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
      if (key.startsWith('blueprint_')) displayName = `Blueprint: ${BLUEPRINTS[key]?.name || displayName}`;
      descriptionOutput += `${getEmoji(key)} **+${qty} ${displayName}**\n`;
  }

  // Execute All
  await prisma.$transaction(ops);

  const embed = new EmbedBuilder()
    .setTitle(title)
    .setColor(color)
    .setDescription(descriptionOutput)
    .setFooter({ text: 'Use `rpg inv` or `rpg pets` to view your new rewards.' });

  return message.reply({ embeds: [embed] });
}
