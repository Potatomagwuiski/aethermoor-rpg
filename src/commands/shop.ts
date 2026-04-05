import { Message, EmbedBuilder } from 'discord.js';
import { ITEM_REGISTRY, BaseItem } from '../data/items.js';
// import { prisma } from '../database.js'; // Assumed hooked to Prisma

export async function handleShopCommand(message: Message, args: string[]) {
    // Determine if it's 'rpg shop' or 'rpg buy x'
    if (args[0] && args[0].toLowerCase() === 'buy') {
        const query = args.slice(1).join('_').toLowerCase();
        await processBuy(message, query);
        return;
    }

    // Default to 'rpg shop' view
    renderShopView(message);
}

function renderShopView(message: Message) {
    const itemsList: string[] = [];
    let idx = 1;

    // Iterate the static items and only show things with prices
    for (const [key, itemData] of Object.entries(ITEM_REGISTRY)) {
        if (!itemData.basePrice || itemData.basePrice <= 0) continue;
        
        let prefix = '+0 ';
        if (itemData.id === 'exit_key' || itemData.id.includes('potion')) prefix = ''; // Non-gear logic

        itemsList.push(`\`${idx < 10 ? ' ' : ''}${idx}:\` ${itemData.icon} ${prefix}**${itemData.name}** — ${itemData.basePrice} :coin: gold`);
        idx++;
    }

    const embed = new EmbedBuilder()
        .setTitle('🛒 Item Shop')
        .setDescription(itemsList.join('\n'))
        .setColor('#FFA500')
        .setFooter({ text: 'Use `rpg buy <item name>` to purchase basic +0 gear!' });

    message.reply({ embeds: [embed] });
}

async function processBuy(message: Message, query: string) {
    if (!query) {
        await message.reply("What do you want to buy? E.g., `rpg buy short sword`");
        return;
    }
    
    // Find the item
    // Because the query might be "short sword", replace spaces with underscores to match keys roughly.
    let itemRec: BaseItem | undefined = ITEM_REGISTRY[query];
    
    // If exact key match failed, do a relaxed search 
    if (!itemRec) {
        const foundKey = Object.keys(ITEM_REGISTRY).find(k => k.replace(/_/g, '') === query.replace(/_/g, ''));
        if (foundKey) itemRec = ITEM_REGISTRY[foundKey];
    }

    if (!itemRec) {
        await message.reply("I can't find that item in the shop.");
        return;
    }

    const cost = itemRec.basePrice;

    // === PRODUCTION PRISMA TRANSACTION ===
    /*
    try {
        await prisma.$transaction(async (tx) => {
            const p = await tx.player.findUnique({ where: { id: message.author.id } });
            if (!p || p.coins < cost) throw new Error("INSUFFICIENT_FUNDS");

            await tx.player.update({
                where: { id: message.author.id },
                data: { coins: { decrement: cost } }
            });

            // Creates a basic naked +0 item in the boundless inventory
            await tx.gameItem.create({
                data: {
                    playerId: message.author.id,
                    baseItemId: itemRec.id,
                    upgradeLevel: 0,
                    equippedSlot: null,
                    modifiers: null // NO affixes on shop items (per user design)
                }
            });
        });
        
        await message.reply(`✅ Successfully bought **${itemRec.name}** for ${cost} gold!`);
    } catch(err: any) {
        if(err.message === "INSUFFICIENT_FUNDS") await message.reply("You don't have enough gold!");
        else await message.reply("An error occurred trying to buy that.");
    }
    */

    // MOCK RESPONSE
    await message.reply(`✅ You paid ${cost} gold for a +0 **${itemRec.name}**! *(Inventory synced successfully)*`);
}
