import { prisma } from '../db.js';
import { BLUEPRINTS } from '../commands/forge.js';
import { getEmoji } from './emojis.js';

export async function getPinnedTrackerField(playerId: string, pinnedForgeItems: string[] | null): Promise<any | null> {
    if (!pinnedForgeItems || pinnedForgeItems.length === 0) return null;
    
    // Validate that all strings are still real blueprints (in case of patches)
    const validPins = pinnedForgeItems.filter(key => BLUEPRINTS[key] && BLUEPRINTS[key].materials);
    if (validPins.length === 0) return null;

    // Collect ALL material keys across ALL pinned blueprints into one giant set
    const requiredMatKeys = new Set<string>();
    validPins.forEach(key => {
        Object.keys(BLUEPRINTS[key].materials as Record<string, number>).forEach(mat => requiredMatKeys.add(mat));
    });

    const inventory = await prisma.inventoryItem.findMany({
        where: { playerId, itemKey: { in: Array.from(requiredMatKeys) } }
    });
    
    let trackStr = '';
    const grandTotals: Record<string, number> = {};
    const pinDetails: { key: string; isCompleted: boolean }[] = [];
    
    validPins.forEach((pinKey, index) => {
        const blueprint = BLUEPRINTS[pinKey];
        trackStr += `**${blueprint.name}**\n`;
        
        let allMet = true;
        for (const [matKey, reqQty] of Object.entries(blueprint.materials as Record<string, number>)) {
            if (!grandTotals[matKey]) grandTotals[matKey] = 0;
            grandTotals[matKey] += reqQty;

            const invItem = inventory.find((i: any) => i.itemKey === matKey);
            const has = invItem ? invItem.quantity : 0;
            const emoji = getEmoji(matKey) || '📦';
            
            if (has < reqQty) allMet = false;
            const status = has >= reqQty ? '✅' : '❌';
            trackStr += `> ${status} ${emoji} **${matKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}**: ${has}/${reqQty}\n`;
        }
        
        pinDetails.push({ key: pinKey, isCompleted: allMet });
        
        // Add spacing between pins if it's not the last one
        if (index < validPins.length - 1) {
            trackStr += '\n';
        }
    });

    if (validPins.length > 1) {
        trackStr += '\n**🛒 Grand Total Material Needs**\n';
        for (const [matKey, totalReq] of Object.entries(grandTotals)) {
            const invItem = inventory.find((i: any) => i.itemKey === matKey);
            const has = invItem ? invItem.quantity : 0;
            const missing = Math.max(0, totalReq - has);
            const emoji = getEmoji(matKey) || '📦';
            
            if (missing > 0) {
                trackStr += `> ❌ ${emoji} **${matKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}**: Need **${missing}** more\n`;
            } else {
                trackStr += `> ✅ ${emoji} **${matKey.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}**: All ${totalReq} gathered!\n`;
            }
        }
    }
    
    const field = { name: `📌 Pinned Schematics (${validPins.length}/3)`, value: trackStr, inline: false };
    return { field, pinDetails };
}
