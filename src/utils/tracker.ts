import { prisma } from '../db.js';
import { BLUEPRINTS } from '../commands/forge.js';
import { getEmoji } from './emojis.js';

export async function getPinnedTrackerField(playerId: string, pinnedForgeItem: string | null): Promise<any | null> {
    if (!pinnedForgeItem || !BLUEPRINTS[pinnedForgeItem]) return null;
    
    const blueprint = BLUEPRINTS[pinnedForgeItem];
    if (!blueprint.materials) return null;

    const inventory = await prisma.inventoryItem.findMany({
        where: { playerId, itemKey: { in: Object.keys(blueprint.materials) } }
    });
    
    let trackStr = '';
    for (const [matKey, reqQty] of Object.entries(blueprint.materials as Record<string, number>)) {
         const invItem = inventory.find((i: any) => i.itemKey === matKey);
         const has = invItem ? invItem.quantity : 0;
         const emoji = getEmoji(matKey) || '📦';
         
         const status = has >= reqQty ? '✅' : '❌';
         // E.g. ✅ 🪵 Wood: 12/10
         trackStr += `${status} ${emoji} **${matKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}**: ${has}/${reqQty}\n`;
    }
    
    return { name: `📌 Pinned Tracker: ${blueprint.name}`, value: trackStr, inline: false };
}
