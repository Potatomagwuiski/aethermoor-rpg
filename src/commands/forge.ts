import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';
import { getEmoji } from '../utils/emojis.js';

// Define the blueprint requirements and outputs
const BLUEPRINTS: Record<string, any> = {
  // --- WARRIOR ---
  'iron_sword': {
    name: 'Iron Sword', requiredBlueprint: 'blueprint_iron_sword', materials: { iron: 5, wood: 2 },
    outputs: {
      common: { key: 'common_iron_sword', name: '⬜ [Common Iron Sword]', dps: 15 },
      uncommon: { key: 'uncommon_iron_sword', name: '🟩 [Uncommon Iron Sword]', dps: 25 },
      rare: { key: 'rare_iron_sword', name: '🟦 [Rare Iron Sword]', dps: 40 },
      epic: { key: 'epic_iron_sword', name: '🟪 [Epic Iron Sword]', dps: 75 }
    }
  },
  'steel_greatsword': {
    name: 'Steel Greatsword', requiredBlueprint: 'blueprint_steel_greatsword', materials: { iron: 15, elderwood: 5, wolf_pelt: 2 },
    outputs: {
      common: { key: 'common_steel_greatsword', name: '⬜ [Common Steel Greatsword]', dps: 30 },
      uncommon: { key: 'uncommon_steel_greatsword', name: '🟩 [Uncommon Steel Greatsword]', dps: 60 },
      rare: { key: 'rare_steel_greatsword', name: '🟦 [Rare Steel Greatsword]', dps: 100 },
      epic: { key: 'epic_steel_greatsword', name: '🟪 [Epic Steel Greatsword]', dps: 160 }
    }
  },
  'wolf_slayer': {
    name: 'Wolf Slayer Sword', requiredBlueprint: 'blueprint_wolf_slayer', materials: { iron: 5, wolf_pelt: 10 },
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
  'iron_dagger': {
    name: 'Iron Dagger', requiredBlueprint: 'blueprint_iron_dagger', materials: { iron: 3, wood: 1 },
    outputs: {
      common: { key: 'common_iron_dagger', name: '⬜ [Common Iron Dagger]', dps: 12 },
      uncommon: { key: 'uncommon_iron_dagger', name: '🟩 [Uncommon Iron Dagger]', dps: 20 },
      rare: { key: 'rare_iron_dagger', name: '🟦 [Rare Iron Dagger]', dps: 35 },
      epic: { key: 'epic_iron_dagger', name: '🟪 [Epic Iron Dagger]', dps: 60 }
    }
  },
  'venom_shiv': {
    name: 'Venom Shiv', requiredBlueprint: 'blueprint_venom_shiv', materials: { iron: 10, slime_core: 10 },
    outputs: { rare: { key: 'rare_venom_shiv', name: '🟦 [Rare Venom Shiv]', dps: 90 }, epic: { key: 'epic_venom_shiv', name: '🟪 [Epic Venom Shiv]', dps: 160 } }
  },
  'shadow_blade': {
    name: 'Shadow Blade', requiredBlueprint: 'blueprint_shadow_blade', materials: { mythril: 15, goblin_ear: 20 },
    outputs: { rare: { key: 'rare_shadow_blade', name: '🟦 [Rare Shadow Blade]', dps: 220 }, epic: { key: 'epic_shadow_blade', name: '🟪 [Epic Shadow Blade]', dps: 380 }, legendary: { key: 'legendary_shadow_blade', name: '🟧 [✨ LEGENDARY SHADOW BLADE ✨]', dps: 600 } }
  },

  // --- MAGE ---
  'wood_staff': {
    name: 'Wood Staff', requiredBlueprint: 'blueprint_wood_staff', materials: { wood: 5, moon_herb: 5 },
    outputs: {
      common: { key: 'common_wood_staff', name: '⬜ [Common Wood Staff]', dps: 15 },
      uncommon: { key: 'uncommon_wood_staff', name: '🟩 [Uncommon Wood Staff]', dps: 25 },
      rare: { key: 'rare_wood_staff', name: '🟦 [Rare Wood Staff]', dps: 45 },
      epic: { key: 'epic_wood_staff', name: '🟪 [Epic Wood Staff]', dps: 80 }
    }
  },
  'moonlight_staff': {
    name: 'Moonlight Staff', requiredBlueprint: 'blueprint_moonlight_staff', materials: { elderwood: 15, mythril: 5 },
    outputs: { rare: { key: 'rare_moonlight_staff', name: '🟦 [Rare Moonlight Staff]', dps: 120 }, epic: { key: 'epic_moonlight_staff', name: '🟪 [Epic Moonlight Staff]', dps: 210 } }
  },
  'meteor_staff': {
    name: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { elderwood: 20, mythic_dragon_scale: 1, rare_meteorite_ingot: 1 },
    outputs: { rare: { key: 'rare_meteor_staff', name: '🟦 [Rare Meteor Staff]', dps: 300 }, epic: { key: 'epic_meteor_staff', name: '🟪 [Epic Meteor Staff]', dps: 500 }, legendary: { key: 'legendary_meteor_staff', name: '🟧 [✨ LEGENDARY METEOR STAFF ✨]', dps: 800 } }
  },

  // --- NECROMANCER ---
  'bone_scythe': {
    name: 'Bone Scythe', requiredBlueprint: 'blueprint_bone_scythe', materials: { iron: 5, wood: 5, goblin_ear: 5 },
    outputs: {
      common: { key: 'common_bone_scythe', name: '⬜ [Common Bone Scythe]', dps: 20 },
      uncommon: { key: 'uncommon_bone_scythe', name: '🟩 [Uncommon Bone Scythe]', dps: 35 },
      rare: { key: 'rare_bone_scythe', name: '🟦 [Rare Bone Scythe]', dps: 60 },
      epic: { key: 'epic_bone_scythe', name: '🟪 [Epic Bone Scythe]', dps: 110 }
    }
  },
  'soul_reaper': {
    name: 'Soul Reaper', requiredBlueprint: 'blueprint_soul_reaper', materials: { iron: 15, wolf_pelt: 10, lich_soul: 1 },
    outputs: { rare: { key: 'rare_soul_reaper', name: '🟦 [Rare Soul Reaper]', dps: 150 }, epic: { key: 'epic_soul_reaper', name: '🟪 [Epic Soul Reaper]', dps: 260 } }
  },
  'lich_tome': {
    name: 'Lich Tome', requiredBlueprint: 'blueprint_lich_tome', materials: { elderwood: 10, mythril: 10, slime_core: 20, lich_soul: 2 },
    outputs: { rare: { key: 'rare_lich_tome', name: '🟦 [Rare Lich Tome]', dps: 350 }, epic: { key: 'epic_lich_tome', name: '🟪 [Epic Lich Tome]', dps: 600 }, legendary: { key: 'legendary_lich_tome', name: '🟧 [✨ LEGENDARY LICH TOME ✨]', dps: 1000 } }
  },

  // --- ARMOR ---
  'iron_helmet': {
    name: 'Iron Helmet', requiredBlueprint: 'blueprint_iron_helmet', materials: { iron: 10 },
    outputs: { common: { key: 'common_iron_helmet', name: '⬜ [Common Iron Helmet]', defense: 5 }, uncommon: { key: 'uncommon_iron_helmet', name: '🟩 [Uncommon Iron Helmet]', defense: 10 }, rare: { key: 'rare_iron_helmet', name: '🟦 [Rare Iron Helmet]', defense: 20 }, epic: { key: 'epic_iron_helmet', name: '🟪 [Epic Iron Helmet]', defense: 40 } }
  },
  'iron_chestplate': {
    name: 'Iron Chestplate', requiredBlueprint: 'blueprint_iron_chestplate', materials: { iron: 25 },
    outputs: { common: { key: 'common_iron_chestplate', name: '⬜ [Common Iron Chestplate]', defense: 10 }, uncommon: { key: 'uncommon_iron_chestplate', name: '🟩 [Uncommon Iron Chestplate]', defense: 20 }, rare: { key: 'rare_iron_chestplate', name: '🟦 [Rare Iron Chestplate]', defense: 40 }, epic: { key: 'epic_iron_chestplate', name: '🟪 [Epic Iron Chestplate]', defense: 80 } }
  },
  'iron_boots': {
    name: 'Iron Boots', requiredBlueprint: 'blueprint_iron_boots', materials: { iron: 8 },
    outputs: { common: { key: 'common_iron_boots', name: '⬜ [Common Iron Boots]', defense: 4 }, uncommon: { key: 'uncommon_iron_boots', name: '🟩 [Uncommon Iron Boots]', defense: 8 }, rare: { key: 'rare_iron_boots', name: '🟦 [Rare Iron Boots]', defense: 16 }, epic: { key: 'epic_iron_boots', name: '🟪 [Epic Iron Boots]', defense: 32 } }
  },

  // --- TOOLS ---
  'iron_pickaxe': {
    name: 'Iron Pickaxe', requiredBlueprint: 'blueprint_iron_pickaxe', materials: { iron: 15, wood: 10 },
    outputs: { common: { key: 'common_iron_pickaxe', name: '⬜ [Common Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_iron_pickaxe', name: '🟩 [Uncommon Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_iron_pickaxe', name: '🟦 [Rare Iron Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'steel_pickaxe': {
    name: 'Steel Pickaxe', requiredBlueprint: 'blueprint_steel_pickaxe', materials: { iron: 40, elderwood: 10 },
    outputs: { common: { key: 'common_steel_pickaxe', name: '⬜ [Common Steel Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_steel_pickaxe', name: '🟩 [Uncommon Steel Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_steel_pickaxe', name: '🟦 [Rare Steel Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
  },
  'mythril_pickaxe': {
    name: 'Mythril Pickaxe', requiredBlueprint: 'blueprint_mythril_pickaxe', materials: { mythril: 30, elderwood: 20 },
    outputs: { common: { key: 'common_mythril_pickaxe', name: '⬜ [Common Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'COMMON', yieldMultiplier: 3.5 }, uncommon: { key: 'uncommon_mythril_pickaxe', name: '🟩 [Uncommon Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'UNCOMMON', yieldMultiplier: 5.0 }, rare: { key: 'rare_mythril_pickaxe', name: '🟦 [Rare Mythril Pickaxe]', isTool: true, type: 'PICKAXE', rarity: 'RARE', yieldMultiplier: 8.0 } }
  },
  'iron_axe': {
    name: 'Iron Axe', requiredBlueprint: 'blueprint_iron_axe', materials: { iron: 10, wood: 15 },
    outputs: { common: { key: 'common_iron_axe', name: '⬜ [Common Iron Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 1.25 }, uncommon: { key: 'uncommon_iron_axe', name: '🟩 [Uncommon Iron Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 1.75 }, rare: { key: 'rare_iron_axe', name: '🟦 [Rare Iron Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 2.5 } }
  },
  'steel_axe': {
    name: 'Steel Axe', requiredBlueprint: 'blueprint_steel_axe', materials: { iron: 25, elderwood: 25 },
    outputs: { common: { key: 'common_steel_axe', name: '⬜ [Common Steel Axe]', isTool: true, type: 'AXE', rarity: 'COMMON', yieldMultiplier: 2.0 }, uncommon: { key: 'uncommon_steel_axe', name: '🟩 [Uncommon Steel Axe]', isTool: true, type: 'AXE', rarity: 'UNCOMMON', yieldMultiplier: 2.75 }, rare: { key: 'rare_steel_axe', name: '🟦 [Rare Steel Axe]', isTool: true, type: 'AXE', rarity: 'RARE', yieldMultiplier: 4.0 } }
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
    return message.reply('You have not registered yet! Type `rpg start <class>`.');
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
        menuEmbed.addFields({ name: 'Available Blueprints', value: catalog });
    }
    
    return message.reply({ embeds: [menuEmbed] });
  }

  const recipeId = args[0].toLowerCase();
  const blueprint = BLUEPRINTS[recipeId];

  if (!blueprint) {
    return message.reply(`That is not a valid Forge recipe. Known blueprints: \`iron_sword\`, \`void_blade\`.`);
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

  // 4. RNG Roll for Quality with Warrior Bonus
  // Base 1-100 roll
  let roll = Math.floor(Math.random() * 100) + 1;
  let logAddition = '';
  
  if (player.activeClass === 'WARRIOR') {
    roll += 20; // 20% flat boost to the rarity bracket
    logAddition = '\n⚔️ *Warrior Passive: Perfected strikes increased roll quality by 20!*';
  } else {
    logAddition = '\n*Anyone can forge, but Warriors forge God-Tier weapons.*';
  }

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

  // 6. Inject the generated Item into the player's inventory
  dbOperations.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: resultOutput.key } },
    update: { quantity: { increment: 1 } },
    create: { playerId: player.id, itemKey: resultOutput.key, quantity: 1 }
  }));

  await prisma.$transaction(dbOperations);

  const statLog = resultOutput.dps ? `+${resultOutput.dps} DPS` : resultOutput.defense ? `+${resultOutput.defense} DEF` : `x${resultOutput.yieldMultiplier} Gathering Yield`;

  const resultEmbed = new EmbedBuilder()
    .setTitle(`🔨 Forged Completed: ${blueprint.name}`)
    .setColor(0xE67E22)
    .setDescription(`You approach the glowing anvil and hammer the materials together. The heat solidifies the ore into a cohesive form.\n\n**Roll:** ${roll}\n${logAddition}\n\n**Result:** You forged a ${resultOutput.name} (${statLog})!`);

  return message.reply({ embeds: [resultEmbed] });
}
