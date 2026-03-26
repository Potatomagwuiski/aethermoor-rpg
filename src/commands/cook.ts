import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

const RECIPES: Record<string, any> = {
  'roasted_trout': {
    name: 'Roasted Trout', materials: { river_trout: 1, wood: 1 }, buffName: '+10 ATK', buffKey: 'ATK_10', color: 0xE67E22
  },
  'koi_soup': {
    name: 'Koi Soup', materials: { golden_koi: 1, mooncap_mushroom: 1 }, buffName: '+25 MAX HP', buffKey: 'HP_25', color: 0xF1C40F
  },
  'glacial_filet': {
    name: 'Glacial Filet', materials: { glacier_cod: 1, frost_lotus: 1 }, buffName: '+50 DEF', buffKey: 'DEF_50', color: 0x3498DB
  },
  'spicy_eel': {
    name: 'Spicy Eel', materials: { lava_eel: 1, cinderbloom: 1 }, buffName: '+15% CRIT', buffKey: 'CRIT_15', color: 0xE74C3C
  },
  'void_sashimi': {
    name: 'Void Sashimi', materials: { void_bass: 1, nightmare_kelp: 1 }, buffName: '+100 ATK, +10% LIFESTEAL', buffKey: 'ATK_100_LS_10', color: 0x9B59B6
  }
};

export async function executeCook(message: Message, args: string[]) {
  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ where: { discordId } });

  if (!player) {
    return message.reply('You are not of this world. Type `rpg start`.');
  }

  const recipeKey = args[0]?.toLowerCase();
  
  if (!recipeKey) {
    const embed = new EmbedBuilder()
      .setTitle('🍳 Cooking Recipes')
      .setColor(0xE67E22)
      .setDescription('Use `rpg cook <recipe>` to prepare a meal. Meals are instantly consumed, granting a powerful combat buff for 60 Minutes.\n\n**Available Recipes:**')
      .addFields(
        { name: '🐟 roasted_trout', value: 'Requires: 1 River Trout, 1 Wood\nBuff: **+10 ATK**' },
        { name: '🐡 koi_soup', value: 'Requires: 1 Golden Koi, 1 Mooncap Mushroom\nBuff: **+25 MAX HP**' },
        { name: '🧊 glacial_filet', value: 'Requires: 1 Glacier Cod, 1 Frost Lotus\nBuff: **+50 DEF**' },
        { name: '🐍 spicy_eel', value: 'Requires: 1 Lava Eel, 1 Cinderbloom\nBuff: **+15% CRIT**' },
        { name: '🦑 void_sashimi', value: 'Requires: 1 Void Bass, 1 Nightmare Kelp\nBuff: **+100 ATK, 10% LIFESTEAL**' }
      )
      .setFooter({ text: 'Warning: Cooking a new meal will overwrite your current active buff!' });
    
    return message.reply({ embeds: [embed] });
  }

  const recipe = RECIPES[recipeKey];
  if (!recipe) {
    return message.reply(`Unknown recipe \`${recipeKey}\`. Type \`rpg cook\` to see the recipe book.`);
  }

  // Load Inventory
  const inventory = await prisma.inventoryItem.findMany({ where: { playerId: player.id } });
  const missingMaterials: string[] = [];

  // Check Materials
  for (const [matKey, reqQty] of Object.entries(recipe.materials)) {
    const invItem = inventory.find(i => i.itemKey === matKey);
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
