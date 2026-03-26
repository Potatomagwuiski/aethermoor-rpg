import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

// Define the blueprint requirements and outputs
const BLUEPRINTS: Record<string, any> = {
  // --- WARRIOR ---
  'bronze_sword': {
    name: 'Bronze Sword', requiredBlueprint: 'blueprint_bronze_sword', materials: { copper: 10, tin: 5, wood: 5, goblin_ear: 2 },
    outputs: {
      common: { key: 'common_bronze_sword', name: '⬜ [Common Bronze Sword]', dps: 15 },
      uncommon: { key: 'uncommon_bronze_sword', name: '🟩 [Uncommon Bronze Sword]', dps: 25 },
      rare: { key: 'rare_bronze_sword', name: '🟦 [Rare Bronze Sword]', dps: 40 },
      epic: { key: 'epic_bronze_sword', name: '🟪 [Epic Bronze Sword]', dps: 75 }
    }
  },
  'iron_greatsword': {
    name: 'Iron Greatsword', requiredBlueprint: 'blueprint_iron_greatsword', materials: { iron: 20, coal: 10, ashwood: 5, wolf_pelt: 5 },
    outputs: {
      common: { key: 'common_iron_greatsword', name: '⬜ [Common Iron Greatsword]', dps: 30 },
      uncommon: { key: 'uncommon_iron_greatsword', name: '🟩 [Uncommon Iron Greatsword]', dps: 60 },
      rare: { key: 'rare_iron_greatsword', name: '🟦 [Rare Iron Greatsword]', dps: 100 },
      epic: { key: 'epic_iron_greatsword', name: '🟪 [Epic Iron Greatsword]', dps: 160 }
    }
  },
  'wolf_slayer': {
    name: 'Wolf Slayer Sword', requiredBlueprint: 'blueprint_wolf_slayer', materials: { steel_ore: 15, silver: 10, bone_shard: 20 },
    outputs: { rare: { key: 'rare_wolf_slayer', name: '🟦 [Rare Wolf Slayer]', dps: 85 }, epic: { key: 'epic_wolf_slayer', name: '🟪 [Epic Wolf Slayer]', dps: 150 } }
  },
  'mythril_cleaver': {
    name: 'Mythril Cleaver', requiredBlueprint: 'blueprint_mythril_cleaver', materials: { mythril: 20, elderwood: 10, mythic_dragon_scale: 1 },
    outputs: { rare: { key: 'rare_mythril_cleaver', name: '🟦 [Rare Mythril Cleaver]', dps: 250 }, epic: { key: 'epic_mythril_cleaver', name: '🟪 [Epic Mythril Cleaver]', dps: 400 } }
  },
  'void_blade': {
    name: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: { mythic_dragon_scale: 1, mythril: 10 },
    outputs: { rare: { key: 'rare_void_blade', name: '🟦 [Rare Void Blade]', dps: 100 }, epic: { key: 'epic_void_blade', name: '🟪 [Epic Void Blade]', dps: 200 }, legendary: { key: 'legendary_void_blade', name: '🟧 [✨ LEGENDARY VOID BLADE ✨]', dps: 500 } }
  },

  // --- ROGUE ---
  'bronze_dagger': {
    name: 'Bronze Dagger', requiredBlueprint: 'blueprint_bronze_dagger', materials: { copper: 5, tin: 5, bat_wing: 2 },
    outputs: {
      common: { key: 'common_bronze_dagger', name: '⬜ [Common Bronze Dagger]', dps: 12 },
      uncommon: { key: 'uncommon_bronze_dagger', name: '🟩 [Uncommon Bronze Dagger]', dps: 20 },
      rare: { key: 'rare_bronze_dagger', name: '🟦 [Rare Bronze Dagger]', dps: 35 },
      epic: { key: 'epic_bronze_dagger', name: '🟪 [Epic Bronze Dagger]', dps: 60 }
    }
  },
  'venom_shiv': {
    name: 'Venom Shiv', requiredBlueprint: 'blueprint_venom_shiv', materials: { iron: 15, mooncap_mushroom: 10, wolf_fang: 5 },
    outputs: { rare: { key: 'rare_venom_shiv', name: '🟦 [Rare Venom Shiv]', dps: 90 }, epic: { key: 'epic_venom_shiv', name: '🟪 [Epic Venom Shiv]', dps: 160 } }
  },
  'shadow_blade': {
    name: 'Shadow Blade', requiredBlueprint: 'blueprint_shadow_blade', materials: { mythril: 15, goblin_ear: 20 },
    outputs: { rare: { key: 'rare_shadow_blade', name: '🟦 [Rare Shadow Blade]', dps: 220 }, epic: { key: 'epic_shadow_blade', name: '🟪 [Epic Shadow Blade]', dps: 380 }, legendary: { key: 'legendary_shadow_blade', name: '🟧 [✨ LEGENDARY SHADOW BLADE ✨]', dps: 600 } }
  },

  // --- MAGE ---
  'wood_staff': {
    name: 'Wood Staff', requiredBlueprint: 'blueprint_wood_staff', materials: { wood: 10, basic_herb: 5, slime_core: 2 },
    outputs: {
      common: { key: 'common_wood_staff', name: '⬜ [Common Wood Staff]', dps: 15 },
      uncommon: { key: 'uncommon_wood_staff', name: '🟩 [Uncommon Wood Staff]', dps: 25 },
      rare: { key: 'rare_wood_staff', name: '🟦 [Rare Wood Staff]', dps: 45 },
      epic: { key: 'epic_wood_staff', name: '🟪 [Epic Wood Staff]', dps: 80 }
    }
  },
  'moonlight_staff': {
    name: 'Moonlight Staff', requiredBlueprint: 'blueprint_moonlight_staff', materials: { ashwood: 15, moon_herb: 5, living_wood: 2 },
    outputs: { rare: { key: 'rare_moonlight_staff', name: '🟦 [Rare Moonlight Staff]', dps: 120 }, epic: { key: 'epic_moonlight_staff', name: '🟪 [Epic Moonlight Staff]', dps: 210 } }
  },
  'meteor_staff': {
    name: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { elderwood: 20, mythic_dragon_scale: 1, rare_meteorite_ingot: 1 },
    outputs: { rare: { key: 'rare_meteor_staff', name: '🟦 [Rare Meteor Staff]', dps: 300 }, epic: { key: 'epic_meteor_staff', name: '🟪 [Epic Meteor Staff]', dps: 500 }, legendary: { key: 'legendary_meteor_staff', name: '🟧 [✨ LEGENDARY METEOR STAFF ✨]', dps: 800 } }
  },

  // --- NECROMANCER ---
  'bone_scythe': {
    name: 'Bone Scythe', requiredBlueprint: 'blueprint_bone_scythe', materials: { copper: 5, wood: 5, goblin_ear: 5 },
    outputs: {
      common: { key: 'common_bone_scythe', name: '⬜ [Common Bone Scythe]', dps: 20 },
      uncommon: { key: 'uncommon_bone_scythe', name: '🟩 [Uncommon Bone Scythe]', dps: 35 },
      rare: { key: 'rare_bone_scythe', name: '🟦 [Rare Bone Scythe]', dps: 60 },
      epic: { key: 'epic_bone_scythe', name: '🟪 [Epic Bone Scythe]', dps: 110 }
    }
  },
  'soul_reaper': {
    name: 'Soul Reaper', requiredBlueprint: 'blueprint_soul_reaper', materials: { iron: 15, coal: 5, wolf_pelt: 10 },
    outputs: { rare: { key: 'rare_soul_reaper', name: '🟦 [Rare Soul Reaper]', dps: 150 }, epic: { key: 'epic_soul_reaper', name: '🟪 [Epic Soul Reaper]', dps: 260 } }
  },
  'lich_tome': {
    name: 'Lich Tome', requiredBlueprint: 'blueprint_lich_tome', materials: { elderwood: 10, mythril: 10, slime_core: 20, lich_soul: 2 },
    outputs: { rare: { key: 'rare_lich_tome', name: '🟦 [Rare Lich Tome]', dps: 350 }, epic: { key: 'epic_lich_tome', name: '🟪 [Epic Lich Tome]', dps: 600 }, legendary: { key: 'legendary_lich_tome', name: '🟧 [✨ LEGENDARY LICH TOME ✨]', dps: 1000 } }
  },

  // --- ARMOR ---
  'bronze_helmet': {
    name: 'Bronze Helmet', requiredBlueprint: 'blueprint_bronze_helmet', materials: { copper: 15, tin: 5 },
    outputs: { common: { key: 'common_bronze_helmet', name: '⬜ [Common Bronze Helmet]', defense: 5 }, uncommon: { key: 'uncommon_bronze_helmet', name: '🟩 [Uncommon Bronze Helmet]', defense: 10 }, rare: { key: 'rare_bronze_helmet', name: '🟦 [Rare Bronze Helmet]', defense: 20 }, epic: { key: 'epic_bronze_helmet', name: '🟪 [Epic Bronze Helmet]', defense: 40 } }
  },
  'bronze_chestplate': {
    name: 'Bronze Chestplate', requiredBlueprint: 'blueprint_bronze_chestplate', materials: { copper: 20, tin: 10 },
    outputs: { common: { key: 'common_bronze_chestplate', name: '⬜ [Common Bronze Chestplate]', defense: 10 }, uncommon: { key: 'uncommon_bronze_chestplate', name: '🟩 [Uncommon Bronze Chestplate]', defense: 20 }, rare: { key: 'rare_bronze_chestplate', name: '🟦 [Rare Bronze Chestplate]', defense: 40 }, epic: { key: 'epic_bronze_chestplate', name: '🟪 [Epic Bronze Chestplate]', defense: 80 } }
  },
  'bronze_boots': {
    name: 'Bronze Boots', requiredBlueprint: 'blueprint_bronze_boots', materials: { copper: 10, tin: 5 },
    outputs: { common: { key: 'common_bronze_boots', name: '⬜ [Common Bronze Boots]', defense: 4 }, uncommon: { key: 'uncommon_bronze_boots', name: '🟩 [Uncommon Bronze Boots]', defense: 8 }, rare: { key: 'rare_bronze_boots', name: '🟦 [Rare Bronze Boots]', defense: 16 }, epic: { key: 'epic_bronze_boots', name: '🟪 [Epic Bronze Boots]', defense: 32 } }
  },

  // --- TOOLS ---
  'bronze_pickaxe': {
    name: 'Bronze Pickaxe', requiredBlueprint: 'blueprint_bronze_pickaxe', materials: { copper: 15, wood: 10 },
    outputs: { common: { key: 'common_bronze_pickaxe', name: '⬜ [Common Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_bronze_pickaxe', name: '🟩 [Uncommon Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_bronze_pickaxe', name: '🟦 [Rare Bronze Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'iron_pickaxe': {
    name: 'Iron Pickaxe', requiredBlueprint: 'blueprint_iron_pickaxe', materials: { iron: 20, coal: 10, ashwood: 10 },
    outputs: { common: { key: 'common_iron_pickaxe', name: '⬜ [Common Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_iron_pickaxe', name: '🟩 [Uncommon Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_iron_pickaxe', name: '🟦 [Rare Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
  },
  'mythril_pickaxe': {
    name: 'Mythril Pickaxe', requiredBlueprint: 'blueprint_mythril_pickaxe', materials: { mythril: 30, elderwood: 20 },
    outputs: { common: { key: 'common_mythril_pickaxe', name: '⬜ [Common Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 3.5 }, uncommon: { key: 'uncommon_mythril_pickaxe', name: '🟩 [Uncommon Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 5.0 }, rare: { key: 'rare_mythril_pickaxe', name: '🟦 [Rare Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 8.0 } }
  },
  'bronze_axe': {
    name: 'Bronze Axe', requiredBlueprint: 'blueprint_bronze_axe', materials: { copper: 10, wood: 15 },
    outputs: { common: { key: 'common_bronze_axe', name: '⬜ [Common Bronze Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_bronze_axe', name: '🟩 [Uncommon Bronze Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_bronze_axe', name: '🟦 [Rare Bronze Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'iron_axe': {
    name: 'Iron Axe', requiredBlueprint: 'blueprint_iron_axe', materials: { iron: 15, coal: 15, ashwood: 15 },
    outputs: { common: { key: 'common_iron_axe', name: '⬜ [Common Iron Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_iron_axe', name: '🟩 [Uncommon Iron Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_iron_axe', name: '🟦 [Rare Iron Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
  },
  'mythril_axe': {
    name: 'Mythril Axe', requiredBlueprint: 'blueprint_mythril_axe', materials: { mythril: 20, elderwood: 30 },
    outputs: { common: { key: 'common_mythril_axe', name: '⬜ [Common Mythril Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 3.5 }, uncommon: { key: 'uncommon_mythril_axe', name: '🟩 [Uncommon Mythril Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 5.0 }, rare: { key: 'rare_mythril_axe', name: '🟦 [Rare Mythril Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 8.0 } }
  }
};

export async function executeForge(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start`.');
  }

  // Load inventory separately to bypass stale Prisma generated types
  const inventory = await prisma.inventoryItem.findMany({
    where: { playerId: player.id }
  });

  if (args.length === 0) {
    const menuEmbed = new EmbedBuilder()
      .setTitle('🔨 The Forge')
      .setColor(0xE67E22)
      .setDescription('Welcome to the Blacksmith. Type `rpg forge <item>` to craft an item. **Warriors receive a flat +20 bonus to their RNG quality roll.**');
      
    let catalog = '';
    for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
      const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
      if (!hasBlueprint || hasBlueprint.quantity < 1) {
          continue; // Permanently shield undiscovered recipes
      }

      let matString = '';
      for (const [matKey, qty] of Object.entries(blueprint.materials)) {
        const emoji = getEmoji(matKey);
        matString += `\`${qty}x\` ${emoji} **${matKey.replace(/_/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase())}**, `;
      }
      matString = matString.slice(0, -2); 
      
      const reqBp = blueprint.requiredBlueprint.replace(/_/g, ' ').replace(/\\b\\w/g, (c: string) => c.toUpperCase());
      const reqEmoji = getEmoji(blueprint.requiredBlueprint);
      catalog += `**${blueprint.name}** (\`${key}\`)\n📜 **Requires:** 1x ${reqEmoji} \`${reqBp}\` \n🧱 **Materials:** ${matString}\n\n`;
    }
    
    if (catalog.length === 0) {
        menuEmbed.addFields({ name: 'Available Blueprints', value: "*You haven't discovered any forging schematics yet. Battle monsters in the wild or explore dungeons to find Blueprints.*" });
    } else {
        const recipes = catalog.split('\n\n');
        let currentField = '';
        let firstField = true;
        for(let recipe of recipes) {
            if (!recipe.trim()) continue;
            if (currentField.length + recipe.length > 1000) {
                menuEmbed.addFields({ name: firstField ? 'Available Blueprints' : '\u200B', value: currentField });
                currentField = recipe + '\n\n';
                firstField = false;
            } else {
                currentField += recipe + '\n\n';
            }
        }
        if (currentField.trim()) {
            menuEmbed.addFields({ name: firstField ? 'Available Blueprints' : '\u200B', value: currentField });
        }
    }
    return message.reply({ embeds: [menuEmbed] });
  }

  const recipeId = args[0].toLowerCase();
  const blueprint = BLUEPRINTS[recipeId];

  if (!blueprint) {
    return message.reply(`That is not a valid Forge recipe. Known blueprints: \`bronze_sword\`, \`void_blade\`.`);
  }

  // 1. Check if they have the Blueprint unlocked
  const hasBlueprint = inventory.find((i: any) => i.itemKey === blueprint.requiredBlueprint);
  // Optional: For testing purposes, maybe we don't strictly require it so the user can test, 
  // but strictly following the rules: they must have it.
  if (!hasBlueprint || hasBlueprint.quantity < 1) {
    return message.reply(`📜 You don't know how to forge a ${blueprint.name}! You need the \`${blueprint.requiredBlueprint}\` to craft this.`);
  }

  // 2. Check Materials
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    const invItem = inventory.find((i: any) => i.itemKey === matKey);
    // TypeScript safe-cast to number
    const qty = requiredQty as number;
    if (!invItem || invItem.quantity < qty) {
      return message.reply(`❌ **Missing Materials!** You need **${qty}x ${matKey}**. You only have ${invItem ? invItem.quantity : 0}.`);
    }
  }

  // 3. Consume Materials
  const dbOperations: any[] = [];
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    dbOperations.push(prisma.inventoryItem.update({
      where: { playerId_itemKey: { playerId: player.id, itemKey: matKey } },
      data: { quantity: { decrement: requiredQty as number } }
    }));
  }

  // 4. RNG Roll for Quality
  // Base 1-100 roll
  let roll = Math.floor(Math.random() * 100) + 1;
  let logAddition = '';

  // 5. Determine Result Based on Blueprint Tiers
  let resultOutput: any = null;

  if (blueprint.outputs.legendary && roll >= 115) resultOutput = blueprint.outputs.legendary;
  else if (blueprint.outputs.epic && roll >= 95) resultOutput = blueprint.outputs.epic;
  else if (blueprint.outputs.rare && roll >= 75) resultOutput = blueprint.outputs.rare;
  else if (blueprint.outputs.uncommon && roll >= 40) resultOutput = blueprint.outputs.uncommon;
  else if (blueprint.outputs.common) resultOutput = blueprint.outputs.common;
  else {
      // Fallback for recipes that only have rare+ (e.g. wolf slayer, moonlight staff)
      resultOutput = blueprint.outputs.rare || blueprint.outputs.epic || Object.values(blueprint.outputs)[0];
  }

  // Fallback safety
  if (!resultOutput) {
    return message.reply('The forge erupted in a magical anomaly. The craft failed!');
  }

  // 6. ADRENALINE AFFIX GENERATION
  let finalName = resultOutput.name; 
  let bAtk = 0;
  let bDef = 0;
  let bCrit = 0;
  let bLifesteal = 0;
  let bEvasion = 0;

  let statLog = '';

  if (resultOutput.dps) { // WEAPONS
      const prefixes = [
        { name: 'Savage', stat: 'Atk', val: Math.floor(resultOutput.dps * 0.15) || 1 },
        { name: 'Vampiric', stat: 'Lifesteal', val: 5 },
        { name: 'Toxic', stat: 'Crit', val: 10 },
        { name: 'Swift', stat: 'Evasion', val: 5 }
      ];
      const suffixes = [
        { name: 'of the Blood God', stat: 'Lifesteal', val: 10 },
        { name: 'of the Void', stat: 'Crit', val: 15 },
        { name: 'of the Titan', stat: 'Atk', val: Math.floor(resultOutput.dps * 0.25) || 2 },
        { name: 'of the Wind', stat: 'Evasion', val: 10 }
      ];

      // 50% chance for a prefix
      if (Math.random() > 0.5) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        finalName = finalName.replace('[', `[${p.name} `);
        if (p.stat === 'Atk') bAtk += p.val;
        if (p.stat === 'Lifesteal') bLifesteal += p.val;
        if (p.stat === 'Crit') bCrit += p.val;
        if (p.stat === 'Evasion') bEvasion += p.val;
      }
      
      // 30% chance for a suffix
      if (Math.random() > 0.7) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        finalName = finalName.replace(']', ` ${s.name}]`);
        if (s.stat === 'Atk') bAtk += s.val;
        if (s.stat === 'Lifesteal') bLifesteal += s.val;
        if (s.stat === 'Crit') bCrit += s.val;
        if (s.stat === 'Evasion') bEvasion += s.val;
      }
      
      bAtk += resultOutput.dps;
      
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

      let eClass: any = 'ANY';
      const keyStr = resultOutput.key.toLowerCase();
      if (keyStr.includes('sword') || keyStr.includes('axe') || keyStr.includes('cleaver') || keyStr.includes('blade') || keyStr.includes('mace')) eClass = 'HEAVY_WEAPON';
      else if (keyStr.includes('dagger') || keyStr.includes('bow') || keyStr.includes('shiv') || keyStr.includes('rapier')) eClass = 'FINESSE_WEAPON';
      else if (keyStr.includes('staff') || keyStr.includes('wand') || keyStr.includes('tome') || keyStr.includes('grimoire')) eClass = 'MAGIC_WEAPON';

      dbOperations.push(prisma.equipment.updateMany({
          where: { playerId: player.id, slot: 'WEAPON', equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.equipment.create({
          data: {
              playerId: player.id,
              baseItemKey: resultOutput.key,
              name: finalName,
              rarity: r,
              slot: 'WEAPON',
              equipmentClass: eClass,
              equipped: true,
              bonusAtk: bAtk,
              bonusDef: bDef,
              bonusCrit: bCrit,
              bonusLifesteal: bLifesteal,
              bonusEvasion: bEvasion
          }
      }));
      let statArray: string[] = [];
      statArray.push(`⚔️ **${bAtk}** ATK`);
      if (bCrit > 0) statArray.push(`🎯 **${bCrit}%** Crit`);
      if (bLifesteal > 0) statArray.push(`🦇 **${bLifesteal}%** Vampirism`);
      if (bEvasion > 0) statArray.push(`💨 **${bEvasion}%** Evasion`);
      statLog = statArray.join(' | ');
  } 
  else if (resultOutput.defense) { // ARMOR
      const prefixes = [
        { name: 'Impenetrable', stat: 'Def', val: Math.floor(resultOutput.defense * 0.2) || 1 },
        { name: 'Spiked', stat: 'Atk', val: Math.floor(resultOutput.defense * 0.1) || 1 },
        { name: 'Nimble', stat: 'Evasion', val: 5 }
      ];
      const suffixes = [
        { name: 'of the Bastion', stat: 'Def', val: Math.floor(resultOutput.defense * 0.3) || 2 },
        { name: 'of Thorns', stat: 'Atk', val: Math.floor(resultOutput.defense * 0.15) || 1 }
      ];

      if (Math.random() > 0.5) {
        const p = prefixes[Math.floor(Math.random() * prefixes.length)];
        finalName = finalName.replace('[', `[${p.name} `);
        if (p.stat === 'Def') bDef += p.val;
        if (p.stat === 'Atk') bAtk += p.val;
        if (p.stat === 'Evasion') bEvasion += p.val;
      }
      if (Math.random() > 0.7) {
        const s = suffixes[Math.floor(Math.random() * suffixes.length)];
        finalName = finalName.replace(']', ` ${s.name}]`);
        if (s.stat === 'Def') bDef += s.val;
        if (s.stat === 'Atk') bAtk += s.val;
      }

      bDef += resultOutput.defense;
      
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

      let eClass: any = 'ANY';
      const keyStr = resultOutput.key.toLowerCase();
      if (keyStr.includes('plate') || keyStr.includes('mail') || keyStr.includes('shield')) eClass = 'HEAVY_ARMOR';
      else if (keyStr.includes('leather') || keyStr.includes('cloak') || keyStr.includes('tunic') || keyStr.includes('boots')) eClass = 'LIGHT_ARMOR';
      else if (keyStr.includes('robe') || keyStr.includes('mantle') || keyStr.includes('hood') || keyStr.includes('hat')) eClass = 'CLOTH';

      dbOperations.push(prisma.equipment.updateMany({
          where: { playerId: player.id, slot: 'ARMOR', equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.equipment.create({
          data: {
              playerId: player.id,
              baseItemKey: resultOutput.key,
              name: finalName,
              rarity: r,
              slot: 'ARMOR',
              equipmentClass: eClass,
              equipped: true,
              bonusAtk: bAtk,
              bonusDef: bDef,
              bonusCrit: bCrit,
              bonusLifesteal: bLifesteal,
              bonusEvasion: bEvasion
          }
      }));
      let statArray: string[] = [];
      statArray.push(`🛡️ **${bDef}** DEF`);
      if (bAtk > 0) statArray.push(`🦔 **${bAtk}** Thorns DMG`);
      if (bEvasion > 0) statArray.push(`💨 **${bEvasion}%** Evasion`);
      if (bCrit > 0) statArray.push(`🎯 **${bCrit}%** Crit`);
      if (bLifesteal > 0) statArray.push(`🦇 **${bLifesteal}%** Vampirism`);
      statLog = statArray.join(' | ');
  }
  else if (resultOutput.isTool) { // TOOLS
      let r: any = 'COMMON';
      if (resultOutput.key.includes('legendary')) r = 'LEGENDARY';
      else if (resultOutput.key.includes('epic')) r = 'EPIC';
      else if (resultOutput.key.includes('rare')) r = 'RARE';
      else if (resultOutput.key.includes('uncommon')) r = 'UNCOMMON';

      dbOperations.push(prisma.tool.updateMany({
          where: { playerId: player.id, type: resultOutput.type, equipped: true },
          data: { equipped: false }
      }));
      dbOperations.push(prisma.tool.create({
          data: {
              playerId: player.id,
              type: resultOutput.type,
              name: finalName,
              rarity: r,
              equipped: true,
              yieldMultiplier: resultOutput.yieldMultiplier
          }
      }));
      statLog = `⛏️ **${resultOutput.yieldMultiplier}x** Gathering Yield`;
  }

  await prisma.$transaction(dbOperations);

  const resultEmbed = new EmbedBuilder()
    .setTitle(`🔨 Forge Completed: ${blueprint.name}`)
    .setColor(0xE67E22)
    .setDescription(`You approach the glowing anvil and hammer the materials together. The heat solidifies the ore into a cohesive form.\n\n**Roll:** ${roll}\n${logAddition}`)
    .addFields({ name: '✨ Forged Output', value: `${getEmoji(recipeId)} **${finalName}**\n${statLog}` });

  return message.reply({ embeds: [resultEmbed] });
}
