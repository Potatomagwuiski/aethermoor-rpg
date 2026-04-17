import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db';

export async function executeStats(message: Message) {
    const discordId = message.author.id;
    const player = await prisma.player.findUnique({
        where: { discordId }
    });

    if (!player) {
        return message.reply('You do not have a profile yet! Use `rpg start`.');
    }

    const embed = new EmbedBuilder()
        .setColor('#E67E22')
        .setTitle('📈 Attribute Allocation & Rules')
        .setDescription(`You currently have **${player.statPoints}** unspent Action Points (AP).\nShortcut: Use \`rpg <stat> <amount>\` to allocate them (e.g., \`rpg str 2\`).\n\nBelow is exactly what each core attribute governs mathematically in the physics engine:`)
        .addFields(
            { name: '💪 STR (Strength)', value: '• **Base Damage:** +1.5 Min DMG and +2.0 Max DMG per point.\n• *A requirement for heavy armor and greatswords.*', inline: false },
            { name: '🏃 DEX (Dexterity)', value: '• **Accuracy:** +0.75 ACC per point. (Counters Evasion)\n• **Evasion:** +0.50 EV per point.\n• **Crit Chance:** +0.25% Critical Hit Chance per point.\n• **Attack Speed:** +0.01 SPD per point. (1.0 = 1 Attack, 1.5 = 50% chance for 2 attacks, etc.)', inline: false },
            { name: '🧠 INT (Intelligence)', value: '• **Under Development:** Currently reserved. Will govern magical damage multipliers, Max Mana limits, elemental resistance scaling, and Spellblade synergies.', inline: false },
            { name: '❤️ VIT (Vitality)', value: '• **Max HP:** +10 HP per point.\n• **Base Armor:** +1.5 Physical Damage Mitigation per point.', inline: false }
        )
        .setFooter({ text: `Current Build: ${player.str} STR | ${player.dex} DEX | ${player.int} INT | ${player.vit} VIT` });

    return message.reply({ embeds: [embed] });
}
