import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../lib/prisma';
import { rollLoot } from '../game/loot';

export async function handleBuy(message: Message, args: string[]) {
  const user = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (!user) return message.reply("You must `rpg start` first.");

  const choice = args[0];
  if (!choice) return message.reply("Specify what you want to buy! E.g. `rpg buy 1`");

  let cost = 0;
  let forcedType: 'weapon' | 'armor' | undefined = undefined;

  if (choice === '1') { cost = 200; forcedType = 'weapon'; }
  else if (choice === '2') { cost = 150; forcedType = 'armor'; }
  else return message.reply("Invalid option.");

  if (user.gold < cost) {
    return message.reply(`You don't have enough gold! (Need ${cost}, you have ${user.gold})`);
  }

  // Deduct Gold
  await prisma.user.update({
    where: { id: user.id },
    data: { gold: user.gold - cost }
  });

  // Roll item
  const droppedData = rollLoot(user.id, forcedType);
  const savedItem = await prisma.inventoryItem.create({ data: droppedData });

  const embed = new EmbedBuilder()
    .setTitle(`Purchased: ${savedItem.name}!`)
    .setColor(0x2ecc71)
    .setDescription(`The merchant unveils your item from the Engram...\n\n**Rarity:** ${savedItem.rarity}\n**Base Stats:** ${JSON.stringify(savedItem.baseStats)}\n**Passives:** ${JSON.stringify(savedItem.passives || "None")}`)
    .setFooter({ text: `Cost: ${cost} Gold. Remaining Gold: ${user.gold - cost}` });
    
  await message.reply({ embeds: [embed] });
}
