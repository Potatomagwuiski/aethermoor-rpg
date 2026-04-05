import { Message } from 'discord.js';

export async function handleEatCommand(message: Message, args: string[]) {
    const targetIdx = parseInt(args[0]);

    if (isNaN(targetIdx) || targetIdx < 1) {
        await message.reply("Specify a valid inventory number. E.g. `rpg eat 1`");
        return;
    }

    // === PRODUCTION PRISMA LOGIC MOCKED ===
    /*
    const foodItem = rawItems[targetIdx - 1];
    
    // Setup 30 minute expiration buff
    const expiration = new Date(Date.now() + 30 * 60000); 

    await prisma.$transaction([
        prisma.gameItem.delete({ where: { id: foodItem.id } }),
        prisma.playerBuff.create({
            data: { playerId: message.author.id, buffKey: "str", buffValue: 10, expiresAt: expiration }
        })
    ]);
    */

    await message.reply(`🍖 You enthusiastically consumed the **🍲 Fish Stew**!\n\nYou gained a **Temporary Buff: +10 STR** for 30 minutes!`);
}

export async function handleReadCommand(message: Message, args: string[]) {
    const targetIdx = parseInt(args[0]);

    if (isNaN(targetIdx) || targetIdx < 1) {
        await message.reply("Specify a valid inventory number. E.g. `rpg read 1`");
        return;
    }

    // === PRODUCTION PRISMA LOGIC MOCKED ===
    /*
    // Extract recipe ID from scroll
    await prisma.$transaction([
        prisma.gameItem.delete({ where: { id: scrollItem.id } }),
        prisma.playerRecipe.create({
            data: { playerId: message.author.id, recipeId: foundRecipeId }
        })
    ]);
    */

    await message.reply(`📜 You unrolled the mysterious parchment and studied the diagrams.\n\n✨ **New Knowledge Unlocked!**\nYou permanently unlocked the **Blacksmith Blueprint: Short Sword**!`);
}
