import { Message, EmbedBuilder } from 'discord.js';

export async function executeHelp(message: Message, args: string[]) {
  const embed = new EmbedBuilder()
    .setTitle('📖 Aethermoor Command Directory')
    .setColor(0x3498DB)
    .setDescription('Welcome to Aethermoor. The world moves fast. Every command resolves instantly. Here is everything you can do:')
    
    .addFields(
      { name: '⚔️ Combat & Progression', value: '`rpg hunt` - Grind generic mobs for XP, Gold, and Jackpots.\n`rpg dungeon` - Use a **[Dungeon Key]** to fight a massive boss for exclusive loot.' },
      { name: '⛏️ Gathering', value: '`rpg mine` - Extract Ores (Iron, Mythril).\n`rpg chop` - Fell Trees (Wood, Pine, Elderwood).\n`rpg fish` - Cast a line (Trout, Seaweed, Void Bass).\n`rpg farm` - Harvest crops (Wheat, Potatoes, Moon Herbs).' },
      { name: '🛒 Economy', value: '`rpg shop` - View the Grand Bazaar.\n`rpg buy <item> <qty>` - Purchase Lootboxes and Gacha Eggs to bypass the grind.' },
      { name: '🔨 Crafting', value: '`rpg forge <blueprint>` - Burn materials to craft custom weapons with randomized stats. (Warriors receive a massive RNG buff).' },
      { name: '⚙️ Account Settings', value: '`rpg start <class>` - Register or completely reset your character to a new class.' }
    )
    .setFooter({ text: 'Coming Soon: rpg cook (Temporary Buffs), rpg hatch (Gacha Pets)' });

  return message.reply({ embeds: [embed] });
}
