import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { calculateBuildArchitecture } from '../utils/stats.js';

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
  let maxHpWithPet = player.maxHp + (activePet ? activePet.bonusHp : 0);
  let runningHp = player.hp;

  // Mitigation & Attack Engine
  const stats = calculateBuildArchitecture({
    ...player,
    equipment: player.equipment
  });

  let gearDef = stats.gearDef;
  let gearEvasion = stats.gearEvasion;
  let activeAbilities = stats.activeAbilities;
  let weaponClass = 'UNARMED';
  if (player.equipment) {
      const weapon = player.equipment.find(g => g.slot === 'WEAPON' && g.equipped);
      if (weapon) weaponClass = weapon.equipmentClass || 'UNARMED';
  }

  let gearAtk = (activePet ? activePet.bonusAtk : 0);
  for (const gear of player.equipment) {
      if (gear.equipped && gear.slot === 'WEAPON') gearAtk += Number(gear.bonusAtk || 0);
  }

  let activeHot = 0;
  let activeEot = 0;
  let buffMessage = '';
  const activeBuff = player.activeBuff;

  if (activeBuff && player.buffExpiresAt && player.buffExpiresAt > new Date()) {
    if (activeBuff === 'ATK_10_HOT_5') { gearAtk += 10; activeHot = 5; buffMessage = '✨ **Buff Active:** Roasted Trout (+10 ATK, Heals 5 HP / Stage)'; }
    if (activeBuff === 'ATK_25_HOT_10') { gearAtk += 25; activeHot = 10; buffMessage = '✨ **Buff Active:** Golden Skewer (+25 ATK, Heals 10 HP / Stage)'; }
    if (activeBuff === 'ATK_60_HOT_20') { gearAtk += 60; activeHot = 20; buffMessage = '✨ **Buff Active:** Glacier Stew (+60 ATK, Heals 20 HP / Stage)'; }
    if (activeBuff === 'ATK_120_HOT_40') { gearAtk += 120; activeHot = 40; buffMessage = '✨ **Buff Active:** Lava-Seared Eel (+120 ATK, Heals 40 HP / Stage)'; }
    if (activeBuff === 'ATK_250_HOT_80') { gearAtk += 250; activeHot = 80; buffMessage = '✨ **Buff Active:** Abyssal Feast (+250 ATK, Heals 80 HP / Stage)'; }
    if (activeBuff === 'HP_150') { maxHpWithPet += 150; runningHp += 150; buffMessage = '✨ **Buff Active:** Koi Soup (+150 MAX HP)'; }
    if (activeBuff === 'DEF_120') { gearDef += 120; buffMessage = '✨ **Buff Active:** Glacial Filet (+120 DEF)'; }
    if (activeBuff === 'CRIT_15') { buffMessage = '✨ **Buff Active:** Spicy Eel (+15% CRIT)'; }
    if (activeBuff === 'ATK_100_LS_10') { gearAtk += 100; buffMessage = '✨ **Buff Active:** Void Sashimi (+100 ATK, 10% LIFESTEAL)'; }
    if (activeBuff === 'HOT_75') { activeHot = 75; buffMessage = '✨ **Buff Active:** Moonlight Brew (Heals 75 HP / Stage)'; }
    if (activeBuff === 'EVASION_35') { gearEvasion += 35; buffMessage = '✨ **Buff Active:** Starlight Infusion (+35% Evasion)'; }
  } else if (activeBuff) {
    dbOperations.push(prisma.player.update({ where: { id: player.id }, data: { activeBuff: null, buffExpiresAt: null } }));
  }

  let baseScaling = Math.floor(player.level * 2);
  if (weaponClass === 'FINESSE_WEAPON') baseScaling += Math.floor(player.agi * 1.5);
  else if (weaponClass === 'HEAVY_WEAPON') baseScaling += Math.floor(player.str * 2.0);
  else if (weaponClass === 'MAGIC_WEAPON') baseScaling += Math.floor(player.int * 2.5);
  else if (weaponClass === 'HUNTER_WEAPON') baseScaling += Math.floor((player.str * 1.25) + (player.agi * 1.25));
  else if (weaponClass === 'SPELLBLADE_WEAPON') baseScaling += Math.floor((player.str * 1.5) + (player.int * 1.0));
  else if (weaponClass === 'VANGUARD_WEAPON') baseScaling += Math.floor((player.str * 1.5) + (player.end * 1.0));
  else baseScaling += Math.floor(player.str * 2.5); // Unarmed
  
  gearAtk += baseScaling;
  let mitigation = stats.baseMitigation;

  let survived = true;

  // --- STAGE 1-5: The Gauntlet ---
  // --- STAGE 1-5: The Gauntlet ---
  for (let i = 1; i <= 5; i++) {
    let packSize = 1;
    const packRoll = Math.random();
    if (packRoll > 0.95) packSize = 3;
    else if (packRoll > 0.85) packSize = 2;

    // Basic hit calculation
    const variance = Math.floor(Math.random() * (player.level * 5));
    const stageDps = Math.floor(gearAtk * 0.8) + variance + 10; 
    
    const goldFound = Math.floor(Math.random() * (20 * player.level)) + 10;
    const xpFound = 10 * player.level;
    
    let rawStageDamage = Math.floor(Math.random() * (player.level * 4 + 8)) + 2; 
    let stageDamage = Math.floor(rawStageDamage * packSize) - mitigation;
    if (stageDamage < 1) stageDamage = 1; // Minimum 1 damage taken
    
    // EVASION CHECK
    if (gearEvasion > 0 && Math.random() < (gearEvasion / 100)) {
        stageDamage = 0;
    }
    
    let earnedGold = goldFound * packSize;
    let earnedXp = xpFound * packSize;

    totalGold += earnedGold;
    totalXp += earnedXp;
    totalDamageTaken += stageDamage;
    runningHp -= stageDamage;

    const packStr = packSize > 1 ? `**Pack of ${packSize} Guardians**` : `a dungeon guardian`;
    logText += `**🛡️ Stage ${i}:** Defeated ${packStr} dealing 💥 ${stageDps} DMG! Took 🩸 ${stageDamage} DMG. (+${earnedGold} 🪙, +${earnedXp} ✨)\n`;

    if (runningHp <= 0) {
        survived = false;
        logText += `\n💀 **YOU PERISHED!** The guardians overwhelmed you. You bleed out in the dark...`;
        break; // Break the Gauntlet loop
    }
  }

  // --- STAGE 6: The Turn-Based Boss Fight ---
  if (survived) {
      const bossData = [
          { name: 'The Lich King', element: 'DARK', trait: '[Legion]: Revives HP rapidly', hpMult: 40 },
          { name: 'Void Dragon', element: 'FIRE', trait: '[Inferno]: Applies stacking burn', hpMult: 45 },
          { name: 'Shadow Behemoth', element: 'SHADOW', trait: '[Intangible]: 50% dodge to physical attacks', hpMult: 35 },
          { name: 'Ancient Golem', element: 'EARTH', trait: '[Reflect]: Reflects 10% damage back to you', hpMult: 60 }
      ];
      const boss = bossData[Math.floor(Math.random() * bossData.length)];
      const currentBoss = boss.name;
      
      const bossGold = 1500 * (Math.floor(player.level / 5) || 1);
      const bossXp = 500 * (Math.floor(player.level / 5) || 1);
      
      let rawBossDamage = Math.floor(player.level * 15) + 40;
      let bossMaxHp = Math.floor(player.level * boss.hpMult) + 100;
      let bossHp = bossMaxHp;

      logText += `\n🐲 **BOSS ROOM: ${currentBoss}** 🐲\n*Mechanic: ${boss.trait}*\n`;

      let burnStacks = 0;
      let bossDefeated = false;

      // 5-ROUND COMBAT LOOP
      for (let round = 1; round <= 5; round++) {
          if (runningHp <= 0 || bossHp <= 0) break;
          logText += `\n**[Round ${round}]** `;

          // --- PLAYER TURN ---
          let playerOutput = Math.floor(gearAtk * 1.5) + Math.floor(Math.random() * (player.level * 5)) + 10;
          
          for (const ab of activeAbilities) {
              if (ab && ab.includes('[Assassin]') && weaponClass === 'FINESSE_WEAPON') playerOutput = Math.floor(playerOutput * 1.15);
              if (ab && ab.includes('[Jagged Edge]')) playerOutput = Math.floor(playerOutput * 1.05);
          }

          let playerMissed = false;
          if (currentBoss === 'Shadow Behemoth' && Math.random() < 0.50 && ['HUNTER_WEAPON', 'FINESSE_WEAPON'].includes(weaponClass)) playerMissed = true;

          if (playerMissed) {
              logText += `Your attack passed through its spectral form! (0 DMG). `;
          } else {
              bossHp -= playerOutput;
              logText += `You struck for 💥 **${playerOutput} DMG**. `;

              if (activeAbilities.join(',').includes('Vampire') || activeAbilities.join(',').includes('Feast')) {
                  const heal = Math.floor(playerOutput * 0.15);
                  runningHp = Math.min(maxHpWithPet, runningHp + heal);
                  logText += `*(Healed ${heal} HP)* `;
              }
              
              if (currentBoss === 'Ancient Golem') {
                  const reflect = Math.floor(playerOutput * 0.10);
                  runningHp -= reflect;
                  totalDamageTaken += reflect;
                  logText += `*(Took ${reflect} Reflected DMG!)* `;
              }
          }

          if (bossHp <= 0) {
              bossDefeated = true;
              break;
          }

          // --- BOSS TURN ---
          let bossDmg = rawBossDamage - mitigation;
          if (bossDmg < 5) bossDmg = 5;

          if (gearEvasion > 0 && Math.random() < (gearEvasion / 100)) {
              logText += `You gracefully DODGED its attack! 🌀 `;
          } else {
              runningHp -= bossDmg;
              totalDamageTaken += bossDmg;
              logText += `It retaliated for 🩸 **${bossDmg} DMG**. `;
          }

          // Execution of Boss Traits
          if (currentBoss === 'Void Dragon') {
              burnStacks += 5;
              runningHp -= burnStacks;
              totalDamageTaken += burnStacks;
              logText += `🔥 *(Burn ${burnStacks})* `;
          }
          if (currentBoss === 'The Lich King') {
              const regen = Math.floor(bossMaxHp * 0.15);
              bossHp += regen;
              logText += `💚 *(Regenerated ${regen} HP)* `;
          }

          if (bossHp > 0 && bossHp < (bossMaxHp * 0.15) && activeAbilities.join(',').includes('Execute')) {
              bossHp = 0;
              logText += `\n⚔️ **EXECUTED!** The boss was instantly decimated!`;
              bossDefeated = true;
          }
      }

      if (runningHp <= 0 || !bossDefeated) {
          survived = false;
          let causeOfDeath = runningHp <= 0 ? "suffering a fatal blow" : "the Boss ENRAGED and wiped you out";
          logText += `\n💀 You challenged the boss but were **SLAUGHTERED**, ${causeOfDeath}!`;
      } else {
          totalGold += bossGold;
          totalXp += bossXp;
          logText += `\n\n**VICTORY!** 🗡️ You conquered the boss! (+\`${bossGold} 🪙\`, +\`${bossXp} ✨\`)\n`;

          const bossDrops = ['mythic_dragon_scale', 'lich_soul', 'behemoth_bone'];
          const bossDrop = bossDrops[Math.floor(Math.random() * bossDrops.length)];
          const friendlyDropName = bossDrop.replace(/_/g, ' ').toUpperCase();
          
          logText += `✨ **BOSS DROP:** You salvaged a 🟪 \`[ ${friendlyDropName} ]\`!\n`;
          logText += `💎 **ENHANCEMENT STONE:** You recovered an \`[ Enhancement Stone ]\`!\n`;

          dbOperations.push(prisma.inventoryItem.upsert({
            where: { playerId_itemKey: { playerId: player.id, itemKey: bossDrop } },
            update: { quantity: { increment: 1 } },
            create: { playerId: player.id, itemKey: bossDrop, quantity: 1 }
          }));

          dbOperations.push(prisma.inventoryItem.upsert({
            where: { playerId_itemKey: { playerId: player.id, itemKey: 'enhancement_stone' } },
            update: { quantity: { increment: 1 } },
            create: { playerId: player.id, itemKey: 'enhancement_stone', quantity: 1 }
          }));

          const standardMats = ['iron', 'ashwood', 'brittle_bone', 'slime_gel', 'stone_core', 'golem_rubble', 'moon_herb', 'strong_wood', 'demon_horn', 'gold_ore'];
          const rewardedMats = [];
          for (let i = 0; i < 3; i++) {
              const mat = standardMats[Math.floor(Math.random() * standardMats.length)];
              const qty = Math.floor(Math.random() * 10) + 5;
              rewardedMats.push({ mat, qty });
              dbOperations.push(prisma.inventoryItem.upsert({
                 where: { playerId_itemKey: { playerId: player.id, itemKey: mat } },
                 update: { quantity: { increment: qty } },
                 create: { playerId: player.id, itemKey: mat, quantity: qty }
              }));
          }
          let matLog = rewardedMats.map(r => `+${r.qty} ${r.mat.replace(/_/g, ' ').toUpperCase()}`).join(', ');
          logText += `🎒 **DUNGEON HAUL:** Scavenging the boss room yielded \`${matLog}\`!`;
      }
      
      if (activeHot > 0 && survived) {
          const heal = Math.min(maxHpWithPet - runningHp, activeHot);
          if (heal > 0) {
              runningHp += heal;
              logText += `> 🍵 *Meal Regeneration healed ${heal} HP!*\n`;
          }
      }
      
      if (activeEot > 0 && survived) {
          player.energy = Math.min(100, player.energy + activeEot);
          logText += `> ✨ *Meal Energization restored ${activeEot} Energy!*\n`;
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

    if (buffMessage) embed.addFields({ name: 'Active Buff', value: buffMessage, inline: false });

  return message.reply({ embeds: [embed] });
}
