import { Message, EmbedBuilder } from 'discord.js';
import { ITEM_REGISTRY, ItemSlot } from '../data/items.js';

export async function handleProfileCommand(message: Message) {
    // In the real system, you would fetch `Player` and `PlayerEquipment` here.
    // We are generating a stunning mockup mimicking Dundor's structure exactly.

    const mockStats = { str: 16, dex: 21, int: 11, xl: 16, xlNext: 14.04 };
    const mockDefenses = { ev: 16, ac: 29, sh: 9 };
    const mockHp = 113;

    // Build the loadout list
    const loadoutList = `
**AD**: ⛏️ +4 **Short Sword**
*(no off-hand)*
**AU**: ⛑️ +0 **The Helmet "Azixitoh"** {HP-2 HPRegen+}
**AP**: 📿 **Amulet of Shielding**
**AL**: 💍 **Ring of Fire**
**AF**: 💍 **The Ring of Biqaqekib** {rElec+ STR+5 EV-3 SH+3}
**AH**: 🧤 +0 **Gloves**
**AR**: 🎽 +2 **Chainmail Armor**
**AJ**: 🧥 +0 **Cloak**
**AV**: 🥾 +3 **The Glory Boots of Kijyu0226** {ACC+}
    `;

    const generalStr = `
❤️ **HP**: ${mockHp}
🗺️ **Place**: Dungeon 5
🪙 **Gold**: 140
⛪ **Worshipper of Rawsidoog**
🙏 **Piety**: 62/100
    `;

    const statsStr = `
⚔️ **XL**: ${mockStats.xl} (next: ${mockStats.xlNext}%)
👣 **Sneak Chance**: N/A
🏋️ **Encumbrance**: 7

💪 **STR**: ${mockStats.str}
🤸 **DEX**: ${mockStats.dex}
🧠 **INT**: ${mockStats.int}
    `;

    const defenseStr = `
💨 **EV**: ${mockDefenses.ev}
🛡️ **AC**: ${mockDefenses.ac}
🧱 **SH**: ${mockDefenses.sh}
    `;

    // Wait, the user's screenshot had a super specific inline grid for resistances:
    // rFire + . . . . .
    // rCold . . . . . .
    const resStr = `
**rFire** \`+\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rCold** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rPois** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rElec** \`+\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rEvil** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rAcid** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`

**Spirit** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
    `;

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s profile`)
        .setColor('#2F3136')
        .addFields(
            { name: '⚔️ Equipment', value: loadoutList, inline: false },
            { name: 'General', value: generalStr, inline: true },
            { name: 'Stats', value: statsStr, inline: true },
            { name: 'Protection', value: defenseStr, inline: true },
            { name: '🛡️ Resistances', value: resStr, inline: false },
        )
        .setFooter({ text: 'Rank: 1,085 | Joined on 2 April 2026 | Dundor' });

    await message.reply({ embeds: [embed] });
}
