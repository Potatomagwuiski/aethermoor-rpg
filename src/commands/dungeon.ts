import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeDungeon(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId },
    include: { 
      inventory: true, 
      equipment: { where: { equipped: true } },
      pets: { where: { equipped: true } }
    }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start` to begin.');
  }

  if (player.hp <= 0) {
    return message.reply('💀 **YOU ARE DEAD.**\nYou cannot run a Dungeon. Buy a 🧪 **[Life Potion]** from the `rpg shop` and type `rpg heal`.');
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
  let totalDamageTaken = 0;
  let logText = '';
  const dbOperations: any[] = [];
  
  const activePet = player.pets && player.pets.length > 0 ? player.pets[0] : null;
  const maxHpWithPet = player.maxHp + (activePet ? activePet.bonusHp : 0);
  let runningHp = player.hp;

  // Mitigation Calculation Engine
  // Mitigation & Attack Engine
  let gearDef = 0;
  let gearAtk = Math.floor(player.str * 2.5) + (activePet ? activePet.bonusAtk : 0); // Base Unarmed ATK + Pet
  if (player.equipment) {
    for (const gear of player.equipment) {
      if (gear.equipped) {
          gearDef += Number(gear.bonusDef || 0);
          gearAtk += Number(gear.bonusAtk || 0);
      }
    }
  }
  let mitigation = Math.floor(gearDef * 0.75) + Math.floor(player.end * 1);

  let survived = true;

  // --- STAGE 1-5: The Gauntlet ---
  for (let i = 1; i <= 5; i++) {
    // Basic hit calculation
    const variance = Math.floor(Math.random() * (player.level * 5));
    const stageDps = Math.floor(gearAtk * 0.8) + variance + 10; 
    
    const goldFound = Math.floor(Math.random() * (20 * player.level)) + 10;
    const xpFound = 10 * player.level;
    
    let rawStageDamage = Math.floor(Math.random() * (player.level * 4 + 8)) + 2; 
    let stageDamage = rawStageDamage - mitigation;
    if (stageDamage < 1) stageDamage = 1; // Minimum 1 damage taken
    
    totalGold += goldFound;
    totalXp += xpFound;
    totalDamageTaken += stageDamage;
    runningHp -= stageDamage;

    logText += `**🛡️ Stage ${i}:** Defeated a dungeon guardian dealing 💥 ${stageDps} DMG! Took 🩸 ${stageDamage} DMG. (+${goldFound} 🪙, +${xpFound} ✨)\n`;

    if (runningHp <= 0) {
        survived = false;
        logText += `\n💀 **YOU PERISHED!** The guardians overwhelmed you. You bleed out in the dark...`;
        break; // Break the Gauntlet loop
    }
  }

  // --- STAGE 6: The Boss Fight ---
  if (survived) {
      const bossNames = ['The Lich King', 'Void Dragon', 'Shadow Behemoth', 'Ancient Golem'];
      const currentBoss = bossNames[Math.floor(Math.random() * bossNames.length)];
      
      const bossGold = 1500 * (Math.floor(player.level / 5) || 1);
      const bossXp = 500 * (Math.floor(player.level / 5) || 1);
      
      let rawBossDamage = Math.floor(player.level * 15) + 40;
      let bossDamage = rawBossDamage - mitigation;
      if (bossDamage < 5) bossDamage = 5; // Bosses always hit for at least 5

      totalDamageTaken += bossDamage;
      runningHp -= bossDamage;

      logText += `\n🐲 **BOSS ROOM: ${currentBoss}** 🐲\n`;
      
      if (runningHp <= 0) {
          survived = false;
          logText += `You challenged the boss but were **SLAUGHTERED**! You took 🩸 **${bossDamage} DMG**, suffering a fatal blow.`;
      } else {
          totalGold += bossGold;
          totalXp += bossXp;
          logText += `You unleashed your ultimate attack and 🗡️ conquered the boss! You took 🩸 **${bossDamage} DMG!** (+${bossGold} 🪙, +${bossXp} ✨)\n`;

          // Provide a massive, rare Drop
          const bossDrops = ['mythic_dragon_scale', 'lich_soul', 'behemoth_bone'];
          const bossDrop = bossDrops[Math.floor(Math.random() * bossDrops.length)];
          const friendlyDropName = bossDrop.replace(/_/g, ' ').toUpperCase();
          
          logText += `\n✨ **BOSS DROP:** You salvaged a 🟪 \`[ ${friendlyDropName} ]\`!`;

          dbOperations.push(prisma.inventoryItem.upsert({
            where: { playerId_itemKey: { playerId: player.id, itemKey: bossDrop } },
            update: { quantity: { increment: 1 } },
            create: { playerId: player.id, itemKey: bossDrop, quantity: 1 }
          }));
      }
  }

  // Handle Leveling if Survived Wait, if they died, they still get the XP they earned in stages 1-5?
  // Let's confiscate their loot if they die!
  if (!survived) {
      totalGold = 0;
      totalXp = Math.floor(totalXp * 0.25); // Keep 25% XP as participation award
      logText += `\n\n*(You dropped all the gold you found, but retained ${totalXp} XP for your efforts/injuries.)*`;
  }

  // Provide Leveling Engine Logic
  let currentLevel = player.level;
  let currentXp = player.xp + totalXp;
  let pointsGained = 0;

  while (currentXp >= currentLevel * 100) {
    currentXp -= currentLevel * 100;
    currentLevel++;
    pointsGained += 3;
  }

  const levelsGained = currentLevel - player.level;

  let finalHp = player.hp - totalDamageTaken;
  if (finalHp < 0) finalHp = 0;

  const updateData: any = {
    gold: { increment: totalGold },
    level: currentLevel,
    xp: currentXp,
    hp: finalHp
  };

  if (levelsGained > 0) {
    updateData.pointsAvailable = { increment: pointsGained };
    logText += `\n🌟 **LEVEL UP!** You jumped to Level **${currentLevel}**! (+${pointsGained} Stat Points)\nType \`rpg stat\` to allocate your power.\n`;
  }

  // Consolidate Economy
  dbOperations.push(prisma.player.update({
    where: { id: player.id },
    data: updateData
  }));

  await prisma.$transaction(dbOperations);

  const embedTitle = survived ? `🏰 Dungeon Cleared: The Catacombs` : `☠️ Dungeon Failed: The Catacombs`;
  const embedColor = survived ? 0x8B0000 : 0x000000;

  const embed = new EmbedBuilder()
    .setTitle(embedTitle)
    .setColor(embedColor)
    .setDescription(logText)
    .setFooter({ text: `Total Haul: ${totalGold} Gold | ${totalXp} XP` });

  return message.reply({ embeds: [embed] });
}
