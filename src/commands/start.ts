import { prisma } from '../lib/prisma';
import { Message } from 'discord.js';
import { rollLoot } from '../game/loot';

export async function handleStart(message: Message) {
  const existing = await prisma.user.findUnique({ where: { id: message.author.id } });
  if (existing) {
    return message.reply("You have already started your journey! Try `rpg profile`.");
  }

  // Generate 3 core items to drop locally using the loot RNG
  const mainHandDrop = rollLoot(message.author.id);
  // Force base templates for start
  mainHandDrop.templateId = 'assassin_blade';
  mainHandDrop.slot = 'mainhand';
  mainHandDrop.name = 'Rusted Assassin Blade';
  mainHandDrop.baseStats = { str: 0, dex: 2, vit: 0, int: 0 };
  mainHandDrop.modifiers = { speedMult: 0.8 };
  mainHandDrop.weight = 4;

  const cloakDrop = rollLoot(message.author.id);
  cloakDrop.templateId = 'shadow_cloak';
  cloakDrop.slot = 'cloak';
  cloakDrop.name = 'Tattered Veil';
  cloakDrop.baseStats = { str: 0, dex: 1, vit: 0, int: 0 };
  cloakDrop.modifiers = { evadeBonus: 10 };
  cloakDrop.weight = 1;

  const user = await prisma.user.create({
    data: {
      id: message.author.id,
      strength: 10,
      dexterity: 10,
      vitality: 10,
      intelligence: 10
    }
  });

  const savedWep = await prisma.inventoryItem.create({ data: { ...mainHandDrop, userId: user.id } });
  const savedCloak = await prisma.inventoryItem.create({ data: { ...cloakDrop, userId: user.id } });

  await prisma.user.update({
    where: { id: user.id },
    data: {
      equipMainHand: savedWep.id,
      equipCloak: savedCloak.id
    }
  });

  message.reply("Welcome to your new Aethermoor journey! Your physical form is armed with dynamically rolled starting gear! Use `rpg profile` to see your generated stats, and `rpg hunt` to grind!");
}
