import { Message } from 'discord.js';
import { ITEM_REGISTRY, WeaponType, ArmorType } from '../data/items.js';
import { generateRandomAffixes } from '../engine/modifiers.js';

export async function handleEnchantCommand(message: Message, args: string[]) {
    const targetIdx = parseInt(args[0]);

    if (isNaN(targetIdx) || targetIdx < 1) {
        await message.reply("You must specify a valid inventory number to enchant. E.g. `rpg enchant 4`");
        return;
    }

    // === PRODUCTION PRISMA LOGIC ===
    /*
    const rawItems = await prisma.gameItem.findMany({
        where: { playerId: message.author.id, equippedSlot: null },
        orderBy: { baseItemId: 'asc' }
    });

    const targetItem = rawItems[targetIdx - 1]; 
    if (!targetItem) {
        await message.reply("You don't have an item at that slot!");
        return;
    }
    
    // Auto-detect the required scroll
    const itemArchetype = ITEM_REGISTRY[targetItem.baseItemId];
    const requiredScrollId = getScrollRequirement(itemArchetype.weaponType, itemArchetype.armorType);

    if (!requiredScrollId) {
        await message.reply(`You cannot enchant a **${itemArchetype.name}**.`);
        return;
    }

    // Check if player has the scroll
    const scrollItem = rawItems.find(i => i.baseItemId === requiredScrollId);
    if (!scrollItem) {
        const scrollInfo = ITEM_REGISTRY[requiredScrollId];
        await message.reply(`To enchant this ${itemArchetype.name}, you need a **${scrollInfo.name}** in your inventory!`);
        return;
    }

    if (targetItem.modifiers) {
        await message.reply("This item is already enchanted! You must use a **📜 Scroll of Cleansing** to reset it first.");
        return;
    }

    // Rolls the massive permanent stat block
    const newAffixes = generateRandomAffixes(1.0); 

    await prisma.$transaction(async (tx) => {
        // Burn the scroll
        await tx.gameItem.delete({ where: { id: scrollItem.id }});

        // Mutate the target weapon
        await tx.gameItem.update({
            where: { id: targetItem.id },
            data: { modifiers: newAffixes?.modifiers as any }
        });
    });

    await message.reply(`✨ The scroll crumbles to dust!\nSuccessfully enchanted your **${itemArchetype.name}**! It gained: **${newAffixes?.text}**!`);
    */

    // MOCK RESPONSE
    await message.reply(`✨ The **📜 Scroll of Finesse** crumbles to dust!\nSuccessfully enchanted your **Short Sword**! It gained: **{STR+3 rFire+ HPRegen+2}**!`);
}

/**
 * Derives exactly what scroll an item requires based on its taxonomy.
 */
function getScrollRequirement(wType?: WeaponType, aType?: ArmorType): string | null {
    if (wType) {
        if (wType === 'melee_fast') return 'scroll_finesse';
        if (wType === 'melee_heavy') return 'scroll_heavy';
        if (wType === 'melee_med') return 'scroll_standard';
        if (wType === 'bow' || wType === 'rifle') return 'scroll_ranged';
    }
    
    if (aType) {
        if (aType === 'light') return 'scroll_light_ward';
        if (aType === 'heavy') return 'scroll_heavy_bastion';
    }

    return null; // Accessories and random junk aren't mapped yet
}
