import { Message } from 'discord.js';
import { RECIPE_REGISTRY } from '../data/recipes.js';
import { ITEM_REGISTRY } from '../data/items.js';

export async function handleForgeCommand(message: Message, args: string[]) {
    // Wait, syntax: rpg forge upgrade <index>
    if (args[0] !== 'upgrade') {
        await message.reply("Usage: `rpg forge upgrade <inventory_index>`");
        return;
    }

    const targetIdx = parseInt(args[1]);
    if (isNaN(targetIdx) || targetIdx < 1) {
        await message.reply("Specify a valid inventory number. E.g. `rpg forge upgrade 1`");
        return;
    }

    // === PRODUCTION PRISMA LOGIC MOCKED ===
    /*
    const rawItems = await prisma.gameItem.findMany({ where: { playerId: message.author.id, equippedSlot: null } });
    const targetWeapon = rawItems[targetIdx - 1];

    if (!targetWeapon) return message.reply("Item not found!");

    // Search for a matching blueprint
    const recipe = Object.values(RECIPE_REGISTRY).find(r => 
        r.type === 'blacksmith' && 
        r.outputItemId === targetWeapon.baseItemId && 
        r.requiredLevel === targetWeapon.upgradeLevel
    );

    if (!recipe) return message.reply("There is no known schematic to upgrade this item further!");

    // Check if player unlocked the recipe
    const unlocked = await prisma.playerRecipe.findUnique({ where: { playerId_recipeId: { playerId: message.author.id, recipeId: recipe.id } }});
    if (!unlocked) return message.reply("You haven't learned this blueprint yet! Hunt for the recipe scroll.");

    // Validate materials here...
    */

    // MOCK OUTPUT
    const recipe = RECIPE_REGISTRY['blueprint_short_sword'];
    const itemArchetype = ITEM_REGISTRY[recipe.outputItemId];
    
    const matStrings = recipe.materials.map(m => `${m.quantity}x ${ITEM_REGISTRY[m.itemId]?.icon} ${ITEM_REGISTRY[m.itemId]?.name}`);
    await message.reply(`🔨 The Blacksmith strikes the anvil!\nYou successfully consumed **${matStrings.join(', ')}** and ${recipe.goldCost} gold to upgrade your weapon.\n\nYou received: **+1 ${itemArchetype.name}**!`);
}

export async function handleCookCommand(message: Message, args: string[]) {
    // Exact command usage: `rpg cook fish_stew`
    const query = args.join('_').toLowerCase();

    // Soft find recipe
    const recipeKey = Object.keys(RECIPE_REGISTRY).find(k => k.replace('recipe_', '') === query);
    const recipe = recipeKey ? RECIPE_REGISTRY[recipeKey] : null;

    if (!recipe || recipe.type !== 'cooking') {
        await message.reply("I don't know how to cook that.");
        return;
    }

    // MOCK OUTPUT
    const outputDef = ITEM_REGISTRY[recipe.outputItemId];
    const matStrings = recipe.materials.map(m => `${m.quantity}x ${ITEM_REGISTRY[m.itemId]?.icon} ${ITEM_REGISTRY[m.itemId]?.name}`);
    
    await message.reply(`🍲 You fire up the cooking pot...\nYou consumed **${matStrings.join(', ')}** to cook a meal!\n\nYou got: **${outputDef?.icon} ${outputDef?.name}**!`);
}
