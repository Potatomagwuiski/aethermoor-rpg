import { Message } from 'discord.js';
import { ITEM_REGISTRY } from '../data/items.js';

export async function handleEquipCommand(message: Message, args: string[]) {
    // Exact command usage: `rpg equip 2` (equips index 2 from your inv)
    const targetIdx = parseInt(args[0]);

    if (isNaN(targetIdx) || targetIdx < 1) {
        await message.reply("You must specify a valid inventory number. E.g. `rpg equip 1`");
        return;
    }

    // === PRODUCTION PRISMA LOGIC ===
    /*
    const rawItems = await prisma.gameItem.findMany({
        where: { playerId: message.author.id, equippedSlot: null },
        orderBy: { baseItemId: 'asc' }
    });

    const targetItem = rawItems[targetIdx - 1]; // 1-index to 0-index mapping
    if (!targetItem) {
        await message.reply("You don't have an item at that slot!");
        return;
    }

    const itemArchetype = ITEM_REGISTRY[targetItem.baseItemId];
    const targetSlot = itemArchetype.slot;

    await prisma.$transaction(async (tx) => {
        // Find if something is already in that slot
        const existingPiece = await tx.gameItem.findFirst({
            where: { playerId: message.author.id, equippedSlot: targetSlot }
        });

        // Unequip old
        if (existingPiece) {
            await tx.gameItem.update({
                where: { id: existingPiece.id },
                data: { equippedSlot: null }
            });
        }

        // Equip new
        await tx.gameItem.update({
            where: { id: targetItem.id },
            data: { equippedSlot: targetSlot }
        });
    });
    
    // Result string mapping logic
    let res = ``;
    if(existingItem) res += `Successfully unequipped ${targetSlot}: ...\n`;
    res += `And equipped ${targetSlot}: +${targetItem.upgradeLevel} ${itemArchetype.name}!`;
    await message.reply(res);
    */

    // MOCK RESPONSE mimicking the mapping
    await message.reply(`Successfully unequipped AD: 🗡️ +0 Dagger\nAnd equipped **AD: ⚔️ +4 Short Sword {rFire+ STR+2}**`);
}
