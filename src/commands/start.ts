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
      { name: '⚔️ Step 1: The Grind', value: 'Type **`rpg hunt`** immediately. You will instantly fight a monster, gain ✨ XP, and earn 🪙 Gold. Keep doing this to trigger massive random 🎰 Jackpots or 15% 🎁 Gacha Drops!' },
      { name: '⚒️ Step 2: The Resources', value: 'Take a break from blood. Type **`rpg mine`**, **`rpg chop`**, **`rpg fish`**, or **`rpg farm`** to gather raw crafting materials like 🪨 Iron and 🪵 Wood.' },
      { name: '📜 Step 3: The Knowledge', value: 'Once you gather enough wealth and materials, type **`rpg help`** to view all Advanced mechanics like 🏰 Dungeons, the 🛒 Shop, and 🔨 Weapon Forging.' }
    )
    .setFooter({ text: 'The void constantly shifts. What will you become? (Type rpg hunt)' });

  return message.reply({ embeds: [embed] });
}
