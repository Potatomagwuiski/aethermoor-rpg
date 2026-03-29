import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

const RECIPES: Record<string, any> = {
  'roasted_trout': {
    name: 'Roasted Trout', materials: { river_trout: 1, wood: 1, sticks: 2 }, buffName: '+10 ATK, Heal 5 HP / Round', buffKey: 'ATK_10_HOT_5', color: 0xE67E22
  },
  'golden_skewer': {
    name: 'Golden Skewer', materials: { golden_koi: 1, ashwood: 1, sticks: 3 }, buffName: '+25 ATK, Heal 10 HP / Round', buffKey: 'ATK_25_HOT_10', color: 0xF39C12
  },
  'glacier_stew': {
    name: 'Glacier Stew', materials: { glacier_cod: 1, oakwood: 1, sticks: 4 }, buffName: '+60 ATK, Heal 20 HP / Round', buffKey: 'ATK_60_HOT_20', color: 0x85C1E9
  },
  'lava_seared_eel': {
    name: 'Lava-Seared Eel', materials: { lava_eel: 1, ebony_wood: 1, sticks: 5 }, buffName: '+120 ATK, Heal 40 HP / Round', buffKey: 'ATK_120_HOT_40', color: 0xE74C3C
  },
  'abyssal_feast': {
    name: 'Abyssal Feast', materials: { void_bass: 1, living_bark: 1, sticks: 10 }, buffName: '+250 ATK, Heal 80 HP / Round', buffKey: 'ATK_250_HOT_80', color: 0x5B2C6F
  },
  'lumberjack_pancakes': {
    name: 'Lumberjack\'s Pancakes', materials: { lumina_berry: 2, wood: 2, sticks: 5 }, buffName: 'Nullify Woodcutting & Mining Exhaustion', buffKey: 'GATHER_NO_HP', color: 0xF39C12
  },
  'miner_goulash': {
    name: 'Miner\'s Goulash', materials: { cinderbloom: 1, copper: 3, sticks: 5 }, buffName: '+1 Base Ore Yield', buffKey: 'MINE_YIELD_1', color: 0x7F8C8D
  },
  'fisherman_brew': {
    name: 'Fisherman\'s Brew', materials: { nightmare_kelp: 1, river_trout: 2, sticks: 5 }, buffName: 'Guaranteed Epic Fish', buffKey: 'FISH_EPIC', color: 0x3498DB
  },
  'golden_harvest_pie': {
    name: 'Golden Harvest Pie', materials: { golden_koi: 1, frost_lotus: 1, sticks: 10 }, buffName: '+10 to Slot Machine Jackpots', buffKey: 'GATHER_SLOT_10', color: 0xF1C40F
  },
  'koi_soup': {
    name: 'Koi Soup', materials: { golden_koi: 1, mooncap_mushroom: 1, sticks: 2 }, buffName: '+150 MAX HP', buffKey: 'HP_150', color: 0xF1C40F
  },
  'glacial_filet': {
    name: 'Glacial Filet', materials: { glacier_cod: 1, frost_lotus: 1, sticks: 2 }, buffName: '+120 DEF', buffKey: 'DEF_120', color: 0x3498DB
  },
  'spicy_eel': {
    name: 'Spicy Eel', materials: { lava_eel: 1, cinderbloom: 1, sticks: 2 }, buffName: '+15% CRIT', buffKey: 'CRIT_15', color: 0xE74C3C
  },
  'void_sashimi': {
    name: 'Void Sashimi', materials: { void_bass: 1, nightmare_kelp: 1, sticks: 2 }, buffName: '+100 ATK, +10% LIFESTEAL', buffKey: 'ATK_100_LS_10', color: 0x9B59B6
  },
  'moonlight_brew': {
    name: 'Moonlight Brew', materials: { frost_lotus: 1, wood: 1, sticks: 2 }, buffName: 'Heal 75 HP / Round', buffKey: 'HOT_75', color: 0x2ECC71
  },
  'starlight_infusion': {
    name: 'Starlight Infusion', materials: { nightmare_kelp: 1, living_bark: 1, sticks: 2 }, buffName: '+35% Evasion', buffKey: 'EVASION_35', color: 0x8E44AD
  }
};

export async function executeCook(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId },
    include: { recipes: true } 
  });

  if (!player) {
    return message.reply('You are not of this world. Type `rpg start`.');
  }

  const recipeKey = args[0]?.toLowerCase();
  
  if (!recipeKey) {
    const embed = new EmbedBuilder()
      .setTitle('🍳 Cooking Recipes')
      .setColor(0xE67E22)
      .setDescription('Use `rpg cook <recipe>` to prepare a meal. Meals are instantly consumed, granting a powerful combat buff for 60 Minutes.\n\n**Available Recipes:**');

    // Default Recipe
    embed.addFields({ 
      name: `🐟 roasted_trout`, 
      value: `Requires: 1 River Trout, 1 Wood, 2 Sticks\nBuff: **+10 ATK, Heal 5 HP / Round**` 
    });

    // Unlocked Recipes
    const emojis: Record<string, string> = {
      'koi_soup': '🐡',
      'glacial_filet': '🧊',
      'spicy_eel': '🐍',
      'void_sashimi': '🦑',
      'moonlight_brew': '🍵',
      'starlight_infusion': '✨',
      'golden_skewer': '🍢',
      'glacier_stew': '🍲',
      'lava_seared_eel': '🔥',
      'abyssal_feast': '🌌',
      'lumberjack_pancakes': '🥞',
      'miner_goulash': '🥣',
      'fisherman_brew': '🍺',
      'golden_harvest_pie': '🥧'
    };

    let learnedCount = 0;
    for (const r of player.recipes) {
      const rec = RECIPES[r.recipeKey];
      if (rec && r.recipeKey !== 'roasted_trout') {
        learnedCount++;
        const reqs = Object.entries(rec.materials).map(([k, v]) => `${v} ${k.replace(/_/g, ' ')}`).join(', ');
        embed.addFields({
          name: `${emojis[r.recipeKey] || '🍽️'} ${r.recipeKey}`,
          value: `Requires: ${reqs}\nBuff: **${rec.buffName}**`
        });
      }
    }
    
    if (learnedCount === 0) {
      embed.addFields({ name: '???', value: '*Hunt monsters to discover more ancient recipes!*' });
    }

    embed.setFooter({ text: 'Warning: Cooking a new meal will overwrite your current active buff!' });
    
    return message.reply({ embeds: [embed] });
  }

  const recipe = RECIPES[recipeKey];
  if (!recipe) {
    return message.reply(`Unknown recipe \`${recipeKey}\`. Type \`rpg cook\` to see the recipe book.`);
  }

  // Check if player unlocked the recipe
  if (recipeKey !== 'roasted_trout') {
    const hasRecipe = player.recipes.find((r: any) => r.recipeKey === recipeKey);
    if (!hasRecipe) {
      return message.reply(`You don't know the recipe for \`${recipeKey}\` yet! You can discover new recipes by hunting monsters.`);
    }
  }

  // Load Inventory
  const inventory = await prisma.inventoryItem.findMany({ where: { playerId: player.id } });
  const missingMaterials: string[] = [];

  // Check Materials
  for (const [matKey, reqQty] of Object.entries(recipe.materials)) {
    const invItem = inventory.find((i: any) => i.itemKey === matKey);
    const hasQty = invItem ? invItem.quantity : 0;
    if (hasQty < (reqQty as number)) {
      missingMaterials.push(`- **${matKey.replace(/_/g, ' ').toUpperCase()}**: Have ${hasQty}/${reqQty}`);
    }
  }

  if (missingMaterials.length > 0) {
    const embed = new EmbedBuilder()
      .setTitle('🔴 Missing Ingredients')
      .setColor(0xFF0000)
      .setDescription(`You don't have enough materials to cook **${recipe.name}**.\n\n${missingMaterials.join('\n')}`);
    return message.reply({ embeds: [embed] });
  }

  // Consume Materials & Apply Buff
  const ops: any[] = [];

  for (const [matKey, reqQty] of Object.entries(recipe.materials)) {
    ops.push(prisma.inventoryItem.update({
      where: { playerId_itemKey: { playerId: player.id, itemKey: matKey } },
      data: { quantity: { decrement: reqQty as number } }
    }));
  }

  // Set Buff Duration (60 Minutes)
  const expiration = new Date(Date.now() + 60 * 60 * 1000);

  ops.push(prisma.player.update({
    where: { id: player.id },
    data: { 
      activeBuff: recipe.buffKey,
      buffExpiresAt: expiration
    }
  }));

  await prisma.$transaction(ops);

  const embed = new EmbedBuilder()
    .setTitle(`🍽️ Crafted ${recipe.name}!`)
    .setColor(recipe.color)
    .setDescription(`You prepared and immediately consumed the **${recipe.name}**.\n\n✨ **Buff Applied:** \`${recipe.buffName}\`\n⏳ **Duration:** 60 Minutes.`);

  return message.reply({ embeds: [embed] });
}
