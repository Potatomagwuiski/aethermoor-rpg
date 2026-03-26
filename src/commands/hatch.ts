import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { Rarity } from '@prisma/client';

const PET_POOL = [
  { name: 'Slime', emoji: '💧', rarity: Rarity.COMMON, weight: 60, stats: { atk: 1, def: 1, hp: 5 } },
  { name: 'Dust Bunny', emoji: '🐰', rarity: Rarity.COMMON, weight: 60, stats: { atk: 2, def: 0, hp: 5 } },
  { name: 'Dire Wolf', emoji: '🐺', rarity: Rarity.UNCOMMON, weight: 25, stats: { atk: 3, def: 2, hp: 10 } },
  { name: 'Cave Bat', emoji: '🦇', rarity: Rarity.UNCOMMON, weight: 25, stats: { atk: 4, def: 1, hp: 10 } },
  { name: 'Gryphon', emoji: '🦅', rarity: Rarity.RARE, weight: 10, stats: { atk: 5, def: 5, hp: 20 } },
  { name: 'Armored Bear', emoji: '🐻', rarity: Rarity.RARE, weight: 10, stats: { atk: 3, def: 8, hp: 30 } },
  { name: 'Phoenix', emoji: '🔥', rarity: Rarity.EPIC, weight: 3, stats: { atk: 15, def: 10, hp: 50 } },
  { name: 'Frost Wyrm', emoji: '❄️', rarity: Rarity.EPIC, weight: 3, stats: { atk: 12, def: 15, hp: 60 } },
  { name: 'Astral Dragon', emoji: '🌌', rarity: Rarity.LEGENDARY, weight: 0.5, stats: { atk: 35, def: 35, hp: 150 } },
  { name: 'Lich King Fragment', emoji: '👑', rarity: Rarity.LEGENDARY, weight: 0.3, stats: { atk: 50, def: 10, hp: 100 } },
];

function pullGachaPet() {
  const totalWeight = PET_POOL.reduce((acc, pet) => acc + pet.weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const pet of PET_POOL) {
    if (random < pet.weight) return pet;
    random -= pet.weight;
  }
  return PET_POOL[0]; // Fallback
}

export async function executeHatch(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Check for the Egg
  const eggRecord = await prisma.inventoryItem.findUnique({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'egg' } }
  });

  if (!eggRecord || eggRecord.quantity < 1) {
    return message.reply('🥚 You do not have any `Gacha Pet Egg`s to hatch! Buy one from the `rpg shop` or find one in the world.');
  }

  // Consume Egg
  await prisma.inventoryItem.update({
    where: { id: eggRecord.id },
    data: { quantity: { decrement: 1 } }
  });

  // Pull Pet
  const petData = pullGachaPet();

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
      equipped: false, // Default unequipped. Need an `rpg pet equip` command later
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
    .setDescription(`You crack open the Gacha Egg and extract its life essence...\n\n**You hatched a ${rarityString} ${petData.emoji} ${petData.name}!**`)
    .addFields(
      { name: 'Stat Bonuses', value: `⚔️ +${petData.stats.atk} ATK\n🛡️ +${petData.stats.def} DEF\n❤️ +${petData.stats.hp} HP`, inline: true }
    )
    .setFooter({ text: 'Use `rpg pets` to view your stable (Coming Soon).' });

  return message.reply({ embeds: [embed] });
}
