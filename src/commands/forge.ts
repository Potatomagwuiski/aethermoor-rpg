import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

// Define the blueprint requirements and outputs
const BLUEPRINTS: Record<string, any> = {
  'iron_sword': {
    name: 'Iron Sword',
    requiredBlueprint: 'blueprint_iron_sword', // The item key required in inventory to unlock this
    materials: { iron: 5, wood: 2 },
    // How the RNG converts into output itemKeys
    outputs: {
      common: { key: 'common_iron_sword', name: '⬜ [Common Iron Sword]', dps: 15 },
      uncommon: { key: 'uncommon_iron_sword', name: '🟩 [Uncommon Iron Sword]', dps: 25 },
      rare: { key: 'rare_iron_sword', name: '🟦 [Rare Iron Sword]', dps: 40 },
      epic: { key: 'epic_iron_sword', name: '🟪 [Epic Iron Sword]', dps: 75 }
    }
  },
  'void_blade': {
    name: 'Void Blade',
    requiredBlueprint: 'blueprint_void_blade',
    materials: { mythic_dragon_scale: 1, mythril: 10 },
    outputs: {
      rare: { key: 'rare_void_blade', name: '🟦 [Rare Void Blade]', dps: 100 },
      epic: { key: 'epic_void_blade', name: '🟪 [Epic Void Blade]', dps: 200 },
      legendary: { key: 'legendary_void_blade', name: '🟧 [✨ LEGENDARY VOID BLADE ✨]', dps: 500 }
    }
  }
};

export async function executeForge(message: Message, args: string[]) {
  if (args.length === 0) {
    const embed = new EmbedBuilder()
      .setTitle('🔨 The Forge')
      .setColor(0xE67E22)
      .setDescription('Welcome to the Blacksmith. Type `rpg forge <item>` to craft an item. **Warriors receive a flat +20 bonus to their RNG quality roll.**');
      
    let catalog = '';
    for (const [key, blueprint] of Object.entries(BLUEPRINTS)) {
      let matString = '';
      for (const [matKey, qty] of Object.entries(blueprint.materials)) {
        matString += `\`${qty}x ${matKey.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())}\`, `;
      }
      matString = matString.slice(0, -2); 
      
      const reqBp = blueprint.requiredBlueprint.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase());
      catalog += `**${blueprint.name}** (\`${key}\`)\n📜 **Requires:** 1x \`${reqBp}\` \n🧱 **Materials:** ${matString}\n\n`;
    }
    
    embed.addFields({ name: 'Available Blueprints', value: catalog });
    return message.reply({ embeds: [embed] });
  }

  const recipeId = args[0].toLowerCase();
  const blueprint = BLUEPRINTS[recipeId];

  if (!blueprint) {
    return message.reply(`That is not a valid Forge recipe. Known blueprints: \`iron_sword\`, \`void_blade\`.`);
  }

  const discordId = message.author.id;
  const player = await prisma.player.findUnique({ 
    where: { discordId },
    include: { inventory: true }
  });

  if (!player) {
    return message.reply('You have not registered yet! Type `rpg start <class>`.');
  }

  // 1. Check if they have the Blueprint unlocked
  const hasBlueprint = player.inventory.find(i => i.itemKey === blueprint.requiredBlueprint);
  // Optional: For testing purposes, maybe we don't strictly require it so the user can test, 
  // but strictly following the rules: they must have it.
  if (!hasBlueprint || hasBlueprint.quantity < 1) {
    return message.reply(`📜 You don't know how to forge a ${blueprint.name}! You need the \`${blueprint.requiredBlueprint}\` to craft this.`);
  }

  // 2. Check Materials
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    const invItem = player.inventory.find(i => i.itemKey === matKey);
    // TypeScript safe-cast to number
    const qty = requiredQty as number;
    if (!invItem || invItem.quantity < qty) {
      return message.reply(`❌ **Missing Materials!** You need **${qty}x ${matKey}**. You only have ${invItem ? invItem.quantity : 0}.`);
    }
  }

  // 3. Consume Materials
  const dbOperations: any[] = [];
  for (const [matKey, requiredQty] of Object.entries(blueprint.materials)) {
    dbOperations.push(prisma.inventoryItem.update({
      where: { playerId_itemKey: { playerId: player.id, itemKey: matKey } },
      data: { quantity: { decrement: requiredQty as number } }
    }));
  }

  // 4. RNG Roll for Quality with Warrior Bonus
  // Base 1-100 roll
  let roll = Math.floor(Math.random() * 100) + 1;
  let logAddition = '';
  
  if (player.activeClass === 'WARRIOR') {
    roll += 20; // 20% flat boost to the rarity bracket
    logAddition = '\n⚔️ *Warrior Passive: Perfected strikes increased roll quality by 20!*';
  } else {
    logAddition = '\n*Anyone can forge, but Warriors forge God-Tier weapons.*';
  }

  // 5. Determine Result Based on Blueprint Tiers
  let resultOutput: any = null;

  if (recipeId === 'iron_sword') {
    if (roll >= 95) resultOutput = blueprint.outputs.epic;
    else if (roll >= 75) resultOutput = blueprint.outputs.rare;
    else if (roll >= 40) resultOutput = blueprint.outputs.uncommon;
    else resultOutput = blueprint.outputs.common;
  } 
  else if (recipeId === 'void_blade') {
    if (roll >= 115) resultOutput = blueprint.outputs.legendary; // Effectively requires a Warrior or extremely lucky standard roll + outside buffs
    else if (roll >= 80) resultOutput = blueprint.outputs.epic;
    else resultOutput = blueprint.outputs.rare;
  }

  // Fallback safety
  if (!resultOutput) {
    return message.reply('The forge erupted in a magical anomaly. The craft failed!');
  }

  // 6. Inject the generated Item
  dbOperations.push(prisma.inventoryItem.upsert({
    where: { playerId_itemKey: { playerId: player.id, itemKey: resultOutput.key } },
    update: { quantity: { increment: 1 } },
    create: { playerId: player.id, itemKey: resultOutput.key, quantity: 1 }
  }));

  await prisma.$transaction(dbOperations);

  const embed = new EmbedBuilder()
    .setTitle(`🔨 Forged Completed: ${blueprint.name}`)
    .setColor(0xE67E22)
    .setDescription(`You approach the glowing anvil and hammer the materials together. The heat solidifies the ore into a cohesive form.\n\n**Roll:** ${roll}\n${logAddition}\n\n**Result:** You forged a ${resultOutput.name} (+${resultOutput.dps} DPS)!`);

  return message.reply({ embeds: [embed] });
}
