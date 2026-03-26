import { Message, EmbedBuilder } from 'discord.js';
import prisma from '../db.js';
import { PlayerClass } from '@prisma/client';

export async function execute(message: Message, args: string[]) {
  const discordId = message.author.id;
  const name = message.author.username;

  const existingPlayer = await prisma.player.findUnique({
    where: { discordId }
  });

  if (existingPlayer) {
    return message.reply(`You are already registered as a ${existingPlayer.activeClass}! Try typing \`rpg hunt\`.`);
  }

  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('Welcome to Aethermoor RPG!')
      .setDescription('To begin your journey, you must select a starting class. Type `rpg start <class>`.\n\n**Available Classes:**\n- **warrior**: Slower but mathematically rolls god-tier affixes at the forge.\n- **mage**: Infinite scaling through XP surges and Self-Rune modifications.\n- **rogue**: Massive 100% crit chance economy and massive gold hoarding.\n- **necromancer**: Defensive swarm damage and sacrificing useless gacha pets to evolve an abomination.')
      .setColor(0x00FF00);
    return message.reply({ embeds: [embed] });
  }

  const chosenClassInput = args[0].toUpperCase();
  let playerClass: PlayerClass;

  if (chosenClassInput === 'WARRIOR') playerClass = PlayerClass.WARRIOR;
  else if (chosenClassInput === 'MAGE') playerClass = PlayerClass.MAGE;
  else if (chosenClassInput === 'ROGUE') playerClass = PlayerClass.ROGUE;
  else if (chosenClassInput === 'NECROMANCER') playerClass = PlayerClass.NECROMANCER;
  else {
    return message.reply('Invalid class! Please choose from: **warrior**, **mage**, **rogue**, or **necromancer**.');
  }

  await prisma.player.create({
    data: {
      discordId,
      name,
      activeClass: playerClass,
    }
  });

  const embed = new EmbedBuilder()
    .setTitle(`🌟 Welcome to Aethermoor, ${playerClass}!`)
    .setColor(0xF1C40F)
    .setDescription(`Welcome to the realm, **${name}**. This world does not wait. Every action you take resolves instantly in this high-speed text ARPG.`)
    .addFields(
      { name: 'Step 1: The Grind', value: 'Type **`rpg hunt`** immediately. You will instantly fight a monster, gain XP, and earn Gold. Keep doing this to trigger massive random Jackpots or 15% Gacha Drops!' },
      { name: 'Step 2: The Resources', value: 'Take a break from blood. Type **`rpg mine`**, **`rpg chop`**, **`rpg fish`**, or **`rpg farm`** to gather raw crafting materials.' },
      { name: 'Step 3: The Knowledge', value: 'Once you gather enough wealth and materials, type **`rpg help`** to view all Advanced mechanics like Dungeons, the Shop, and Weapon Forging.' }
    )
    .setFooter({ text: 'The void constantly shifts. What will you become? (Type rpg hunt)' });

  return message.reply({ embeds: [embed] });
}
