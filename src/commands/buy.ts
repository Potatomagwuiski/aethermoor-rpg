import { Message } from 'discord.js';
import { prisma } from '../lib/prisma';
import { GEAR } from '../game/gear';

export async function handleBuy(message: Message, args: string[]) {
  const userId = message.author.id;

  if (args.length === 0) {
    return message.reply("> ⚠️ **Invalid Syntax**\n> Please specify an item ID. Example: `rpg buy 1`");
  }

  const allGear = Object.values(GEAR);
  const indexNum = parseInt(args[0], 10);
  
  if (isNaN(indexNum) || indexNum < 1 || indexNum > allGear.length) {
    return message.reply(`> ⚠️ **Item Not Found**\n> The engine cannot locate item ID \`${args[0]}\` in the merchant registry.`);
  }

  const gear = allGear[indexNum - 1];

  // 1. Authenticate / Fetch User inside a transaction
  try {
    await prisma.$transaction(async (tx) => {
      const user = await tx.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error("UNREGISTERED");
      }

      if (user.gold < gear.price) {
        throw new Error("INSUFFICIENT_FUNDS");
      }

      // Deduct Gold
      await tx.user.update({
        where: { id: userId },
        data: { gold: user.gold - gear.price }
      });

      // Upsert into inventory
      const existingStack = await tx.inventoryItem.findFirst({
        where: {
          userId: userId,
          baseItemId: gear.id,
          upgradeTier: 0
        }
      });

      if (existingStack) {
        await tx.inventoryItem.update({
          where: { id: existingStack.id },
          data: { quantity: existingStack.quantity + 1 }
        });
      } else {
        await tx.inventoryItem.create({
          data: {
            userId: userId,
            baseItemId: gear.id,
            upgradeTier: 0,
            quantity: 1
          }
        });
      }
    });

    return message.reply(`> 💰 **Purchase Successful!**\n> You bought **${gear.emoji} ${gear.name}** for ${gear.price}g! Use \`rpg inv\` to view it.`);

  } catch (error: any) {
    if (error.message === "UNREGISTERED") {
      return message.reply("> ⚠️ **Hold on!**\n> You haven't started your journey yet! Type `rpg start` to begin.");
    }
    if (error.message === "INSUFFICIENT_FUNDS") {
      return message.reply(`> 💸 **Insufficient Gold**\n> You need **${gear.price}g** to buy this, check your balance with \`rpg profile\`.`);
    }
    
    console.error("Purchase Transaction Error:", error);
    return message.reply("> ❌ **Database Error**\n> The transaction failed securely.");
  }
}
