import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';

export async function execute(message: Message, args: string[]) {
  const discordId = message.author.id;
  const name = message.author.username;

  const existingPlayer = await prisma.player.findUnique({
    where: { discordId }
  });

  if (existingPlayer) {
    return message.reply(`You are already registered! Try typing \`rpg hunt\`.`);
  }

  await prisma.player.create({
    data: {
      discordId,
      name,
    }
  });

  const embed = new EmbedBuilder()
    .setTitle(`🌟 Welcome to Aethermoor, ${name}!`)
    .setColor(0xF1C40F)
    .setDescription(`Welcome to the realm. This world does not wait. Every action you take resolves instantly in this high-speed text ARPG.\n\n**You are what you wear.** Equip Greatswords to become a Warrior, Wands to wield Magic, and Daggers to strike from the Shadows.`)
    .addFields(
      { name: '⚔️ Step 1: The Basics', value: 'Type **`rpg hunt`** to fight a monster. **CAUTION: Combat is brutal!** If you hunt with bare fists and no armor, you WILL take heavy damage and lose gold. Craft a weapon as soon as possible!' },
      { name: '⚒️ Step 2: Forging Gear', value: 'Use **`rpg mine`**, **`rpg chop`**, or **`rpg farm`** to gather materials. Then type **`rpg forge bronze_sword`** to craft your first weapon. *Bronze tier equipment is INNATE and does not require a blueprint!*' },
      { name: '🌍 Step 3: The World', value: 'You begin in the **Lumina Plains**. Once you reach Level 10, type **`rpg travel whispering_woods`** to move to tier 2 for harder monsters and rarer resources!' },
      { name: '📜 Step 4: The Knowledge', value: 'Once you gather enough wealth and materials, type **`rpg help`** to view all Advanced mechanics like 🏰 Dungeons, the 🛒 Shop, and potion Alchemy.' }
    )
    .setFooter({ text: 'The void constantly shifts. What will you become? (Type rpg hunt)' });

  return message.reply({ embeds: [embed] });
}
