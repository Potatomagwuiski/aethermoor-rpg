import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

export async function executeHeal(message: Message) {
  const discordId = message.author.id;
  
  const player = await prisma.player.findUnique({
    where: { discordId },
    include: { inventory: true }
  });

  if (!player) {
    return message.reply('You belong to the void. Type `rpg start <class>` to manifest.');
  }

  if (player.hp >= player.maxHp) {
    return message.reply(`💚 You are already at full health! (**${player.hp}/${player.maxHp} HP**)`);
  }

  const potionItem = player.inventory.find(i => i.itemKey === 'life_potion');
  if (!potionItem || potionItem.quantity < 1) {
    return message.reply('❌ You do not have any 🧪 **[Life Potion]**! Buy one from the `rpg shop` for 50 Gold.');
  }

  await prisma.$transaction([
    prisma.inventoryItem.update({
      where: { playerId_itemKey: { playerId: player.id, itemKey: 'life_potion' } },
      data: { quantity: { decrement: 1 } }
    }),
    prisma.player.update({
      where: { id: player.id },
      data: { hp: player.maxHp }
    })
  ]);

  const embed = new EmbedBuilder()
    .setTitle('🧪 Life Restored')
    .setColor(0x00FF00)
    .setDescription(`You unscrewed the vial and drank the Life Potion. Your bleeding stops instantly.\n\n**HP:** ${player.hp} ➡️ **${player.maxHp}**`)
    .setFooter({ text: 'You are ready to return to the grind.' });

  return message.reply({ embeds: [embed] });
}
