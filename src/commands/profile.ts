import { Message, EmbedBuilder } from 'discord.js';

export async function handleProfileCommand(message: Message) {
    // ==== MOCK PRISMA DATA EXTRACTION ====
    // In production, fetch the Player, GameItems, PlayerBuffs
    const mockStats = { str: 16, dex: 21, int: 11, xl: 16, xlNext: 14.04 };
    const mockDefenses = { ev: 16, ac: 29, sh: 9 };
    const mockHp = 113;
    const general = { place: 'Dungeon 5', gold: 1400 };

    // Gathering Tiers (Replaces Piety/Religion)
    const prof = { mining: 4, chopping: 2, fishing: 1, foraging: 5 };

    // Temporary Buffs resulting from the 'eat' command
    const activeBuffs = [
        { name: "Fish Stew", effect: "+10 STR", timeLeft: "24m" }
    ];

    // Build the loadout list using the seamless Dundor terminology the user loves
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

    // General string holds Vitals
    const generalStr = `
❤️ **HP**: ${mockHp}
🗺️ **Place**: ${general.place}
🪙 **Gold**: ${general.gold.toLocaleString()}
    `;

    // Core Stats
    const statsStr = `
⚔️ **XL**: ${mockStats.xl} (next: ${mockStats.xlNext}%)
👣 **Sneak Chance**: N/A
🏋️ **Encumbrance**: 7

💪 **STR**: ${mockStats.str}
🤸 **DEX**: ${mockStats.dex}
🧠 **INT**: ${mockStats.int}
    `;

    // Defense & Gathering string (Merged horizontally for space)
    const defenseStr = `
💨 **EV**: ${mockDefenses.ev}
🛡️ **AC**: ${mockDefenses.ac}
🧱 **SH**: ${mockDefenses.sh}

**Professions:**
🪨 **Mine**: Lv.${prof.mining}
🪵 **Chop**: Lv.${prof.chopping}
🐟 **Fish**: Lv.${prof.fishing}
🌿 **Forage**: Lv.${prof.foraging}
    `;

    // Explicit Resistance Block
    const resStr = `
**rFire** \`+\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rCold** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rPois** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rElec** \`+\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rEvil** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
**rAcid** \`.\` \`.\` \`.\` \`.\` \`.\` \`.\`
    `;

    const embed = new EmbedBuilder()
        .setTitle(`${message.author.username}'s profile`)
        .setColor('#2F3136')
        .addFields(
            { name: '⚔️ Equipment', value: loadoutList, inline: false },
            { name: 'General', value: generalStr, inline: true },
            { name: 'Stats', value: statsStr, inline: true },
            { name: 'Protection & Skills', value: defenseStr, inline: true },
            { name: '🛡️ Resistances', value: resStr, inline: false },
        )
        .setFooter({ text: 'Rank: 1,085 | Joined recently | Aethermoor RPG' });

    // Inject Active Buffs dynamically if the player ate Food
    if (activeBuffs.length > 0) {
        let buffLines = activeBuffs.map(b => `🥘 **${b.name}** \`${b.effect}\` — Expires in ${b.timeLeft}`);
        embed.spliceFields(1, 0, { name: '✨ Active Journey Buffs', value: buffLines.join('\n'), inline: false });
    }

    await message.reply({ embeds: [embed] });
}
