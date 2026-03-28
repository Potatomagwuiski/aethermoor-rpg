import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { Rarity } from '@prisma/client';

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

export async function executeHatch(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  if (args.length === 0) {
    return message.reply('Please specify an egg to hatch! Example: `rpg hatch lumina` or `rpg hatch astral`');
  }

  const eggName = args[0].toLowerCase() + '_egg';
  const validEggs = ['lumina_egg', 'mystic_egg', 'abyssal_egg', 'astral_egg'];
  if (!validEggs.includes(eggName)) {
      return message.reply(`Invalid egg type. Available: \`lumina\`, \`mystic\`, \`abyssal\`, \`astral\`.`);
  }

  // Check for the Egg
  const eggRecord = await prisma.inventoryItem.findUnique({
    where: { playerId_itemKey: { playerId: player.id, itemKey: eggName } }
  });

  if (!eggRecord || eggRecord.quantity < 1) {
    return message.reply(`🥚 You do not have any \`${eggName.replace('_', ' ')}\`s to hatch! Buy one from the \`rpg shop\` or find one in the world.`);
  }

  // Consume Egg
  await prisma.inventoryItem.update({
    where: { id: eggRecord.id },
    data: { quantity: { decrement: 1 } }
  });

  // Pull Pet
  const petData = pullGachaPet(eggName);

  // Create Pet in DB
  await prisma.pet.create({
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
  });

  let color = 0xFFFFFF; // Common
  if (petData.rarity === 'UNCOMMON') color = 0x00FF00;
  if (petData.rarity === 'RARE') color = 0x0000FF;
  if (petData.rarity === 'EPIC') color = 0x800080;
  if (petData.rarity === 'LEGENDARY') color = 0xFFD700;

  let rarityString = `[${petData.rarity}]`;
  if (petData.rarity === 'LEGENDARY') rarityString = `✨ [${petData.rarity}] ✨`;

  const embed = new EmbedBuilder()
    .setTitle('🥚 The Egg is Hatching...')
    .setColor(color)
    .setDescription(`You crack open the ${eggName.split('_')[0].toUpperCase()} Egg and extract its life essence...\n\n**You hatched a ${rarityString} ${petData.emoji} ${petData.name}!**`)
    .addFields(
      { name: 'Stat Bonuses', value: `⚔️ +${petData.stats.atk} ATK\n🛡️ +${petData.stats.def} DEF\n❤️ +${petData.stats.hp} HP`, inline: true }
    )
    .setFooter({ text: 'Use `rpg pets` to view your stable.' });

  return message.reply({ embeds: [embed] });
}
