import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeDungeon(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId },
    include: { inventory: true }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>` to begin.');
  }

  // Check for Dungeon Key
  const keyItem = player.inventory.find(i => i.itemKey === 'dungeon_key');
  if (!keyItem || keyItem.quantity < 1) {
    return message.reply('🚪 You stand before massive stone doors. They are locked tight. You require a 🗝️ **[Dungeon Key]** to enter. You can find these rarely in `rpg hunt` or buy them in the `rpg shop`.');
  }

  // Deduct the Dungeon Key immediately
  await prisma.inventoryItem.update({
    where: { playerId_itemKey: { playerId: player.id, itemKey: 'dungeon_key' } },
    data: { quantity: { decrement: 1 } }
  });

  let totalGold = 0;
  let totalXp = 0;
  let logText = '';
  const dbOperations: any[] = [];

  // --- STAGE 1-5: The Gauntlet ---
  for (let i = 1; i <= 5; i++) {
    // Basic hit calculation
    const baseDamage = player.level * 10 + 5; 
    const goldFound = Math.floor(Math.random() * 20) + 10;
    const xpFound = 10;
    
    totalGold += goldFound;
    totalXp += xpFound;

    logText += `**Stage ${i}:** Defeated a dungeon guardian dealing ${baseDamage} DMG! (+${goldFound} Gold)\n`;
  }

  // --- STAGE 6: The Boss Fight ---
  const bossNames = ['The Lich King', 'Void Dragon', 'Shadow Behemoth', 'Ancient Golem'];
  const currentBoss = bossNames[Math.floor(Math.random() * bossNames.length)];
  
  // Boss Loot is guaranteed God-Tier Materials or massive Gold
  const bossGold = 1500;
  const bossXp = 500;
  totalGold += bossGold;
  totalXp += bossXp;

  logText += `\n🐲 **BOSS ROOM: ${currentBoss}**\n`;
  logText += `You unleashed your ultimate attack and conquered the boss! (+${bossGold} Gold, +${bossXp} XP)\n`;

  // Provide a massive, rare Drop
  const bossDrops = ['mythic_dragon_scale', 'lich_soul', 'behemoth_bone'];
  const bossDrop = bossDrops[Math.floor(Math.random() * bossDrops.length)];
  
  logText += `\n✨ **BOSS DROP:** You salvaged a 🟪 \`[${bossDrop.replace('_', ' ').toUpperCase()}]\`!`;

  dbOperations.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: bossDrop } },
    update: { quantity: { increment: 1 } },
    create: { playerId: player.id, itemKey: bossDrop, quantity: 1 }
  }));

  // Consolidate Economy
  dbOperations.push(prisma.player.update({
    where: { id: player.id },
    data: { 
      gold: { increment: totalGold },
      xp: { increment: totalXp }
    }
  }));

  await prisma.$transaction(dbOperations);

  const embed = new EmbedBuilder()
    .setTitle(`🏰 Dungeon Cleared: The Catacombs`)
    .setColor(0x8B0000) // Dark Red
    .setDescription(logText)
    .setFooter({ text: `Total Haul: ${totalGold} Gold | ${totalXp} XP` });

  return message.reply({ embeds: [embed] });
}
