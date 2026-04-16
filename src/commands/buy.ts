import { Message } from 'discord.js';
import { prisma } from '../db';
import { SHOP_ITEMS } from './shop';

export async function executeBuy(message: Message, args: string[]) {
    const discordId = message.author.id;

    if (args.length === 0) {
        return message.reply('Please specify the ID of the item you want to buy: `rpg buy 1`');
    }

    const shopId = parseInt(args[0], 10);
    const shopItem = SHOP_ITEMS.find(i => i.id === shopId);

    if (!shopItem) {
        return message.reply('That item ID does not exist in the merchant shop.');
    }

    const player = await prisma.player.findUnique({
        where: { discordId }
    });

    if (!player) {
        return message.reply('You do not have a profile yet! Use `rpg start`.');
    }

    if (player.gold < shopItem.price) {
        return message.reply(`You do not have enough gold! You have **🪙 ${player.gold}**, but \`${shopItem.name}\` costs **🪙 ${shopItem.price}**.`);
    }

    // Process Transaction
    await prisma.player.update({
        where: { discordId },
        data: {
            gold: player.gold - shopItem.price
        }
    });

    // Generate physical Item securely avoiding loot pools
    const createdItem = await prisma.item.create({
        data: {
            name: shopItem.name,
            rarity: 'Common',
            slot: shopItem.slot === 'Weapon' ? 'MainHand' : shopItem.slot,
            baseDamage: shopItem.baseDamage || 0,
            baseArmor: shopItem.baseArmor || 0,
            modifiers: JSON.stringify(shopItem.stats),
            passives: JSON.stringify([shopItem.passive])
        }
    });

    await prisma.inventoryItem.create({
        data: {
            playerId: discordId,
            itemId: createdItem.id,
            amount: 1
        }
    });

    return message.reply(`🛍️ **Transaction Successful!**\nYou bought \`${shopItem.name}\` for **🪙 ${shopItem.price} Gold**. It has been added to your inventory. Type \`rpg inv\` to view it and \`rpg equip <ID>\` to wear it!`);
}
