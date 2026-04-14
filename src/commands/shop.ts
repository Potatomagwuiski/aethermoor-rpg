import { Message, EmbedBuilder } from 'discord.js';

export async function handleShop(message: Message) {
  const embed = new EmbedBuilder()
    .setTitle("Aethermoor Merchant's Wares")
    .setColor(0xf1c40f)
    .setDescription("The merchant beckons you over to his stall. 'I sell untamed aether infused directly into metal and cloth. Care to test your fate?'")
    .addFields(
      { name: "1. 🗡️ Weapon Engram (200 Gold)", value: "Use `rpg buy 1` to purchase. Generates a completely random weapon with procedural stats and rarity." },
      { name: "2. 🛡️ Armor Engram (150 Gold)", value: "Use `rpg buy 2` to purchase. Generates a completely random defensive item or cloak." }
    )
    .setFooter({ text: "Use 'rpg inventory' to view your newly acquired items." });
    
  await message.reply({ embeds: [embed] });
}
