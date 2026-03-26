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
    .setTitle('Character Created!')
    .setDescription(`Welcome to the realm, **${name}**. You have chosen the path of the **${playerClass}**.\n\nYou are ready to test your might. Type \`rpg hunt\` to drop into the combat simulator!`)
    .setColor(0x00FFFF);

  return message.reply({ embeds: [embed] });
}
