import { Message, EmbedBuilder } from 'discord.js';
import { ITEM_REGISTRY } from '../data/items.js';

export async function handleInventoryCommand(message: Message, args: string[]) {
    // === PRODUCTION PRISMA LOGIC ===
    /*
    const rawItems = await prisma.gameItem.findMany({
        where: { playerId: message.author.id, equippedSlot: null },
        orderBy: { baseItemId: 'asc' }
    });
    */

    // MOCK DATA for display purposes
    const mockItems = [
        { id: 'uid-1', baseItemId: 'mace', upgradeLevel: 0, modifiers: null },
        { id: 'uid-2', baseItemId: 'short_sword', upgradeLevel: 4, modifiers: { rFire: true, str: 2 } },
        { id: 'uid-3', baseItemId: 'kite_shield', upgradeLevel: 0, modifiers: null },
        { id: 'uid-4', baseItemId: 'musket', upgradeLevel: 2, modifiers: { int: 5 } }
    ];

    if (mockItems.length === 0) {
        await message.reply("Your inventory is totally empty.");
        return;
    }

    const lines: string[] = [];
    let idx = 1;

    for (const item of mockItems) {
        const itemInfo = ITEM_REGISTRY[item.baseItemId];
        if (!itemInfo) continue;

        let modString = "";
        if (item.modifiers) {
            // Mock translation logic for JSON to {rFire+ STR+2}
            const parts: string[] = [];
            for (const [k, v] of Object.entries(item.modifiers)) {
                if (typeof v === 'boolean') parts.push(`${k}+`);
                else parts.push(`${k.toUpperCase()}+${v}`);
            }
            if(parts.length > 0) modString = ` {${parts.join(' ')}}`;
        }

        // Output: [1] 🗡️ +4 Short Sword {STR+2}
        lines.push(`\`[${idx}]\` ${itemInfo.icon} +${item.upgradeLevel} **${itemInfo.name}**${modString}`);
        idx++;
    }

    const embed = new EmbedBuilder()
        .setTitle(`🎒 ${message.author.username}'s Inventory`)
        .setDescription(lines.join('\n'))
        .setColor('#9B59B6')
        .setFooter({ text: `Page 1 | Use "rpg equip <ID>" to equip an item.` });

    await message.reply({ embeds: [embed] });
}
