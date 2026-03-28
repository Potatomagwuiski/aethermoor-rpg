import { prisma } from '../db.js';

export async function processQuestProgress(playerId: string, actionType: string, amount: number = 1) {
    // Fetch uncompleted quests for this action type
    const quests = await prisma.quest.findMany({
        where: { playerId, type: actionType, completed: false }
    });

    if (quests.length === 0) return null;

    let completionMessages = [];

    for (const q of quests) {
        let newVal = q.currentVal + amount;
        
        if (newVal >= q.targetVal) {
            // Quest complete!
            await prisma.quest.update({
                where: { id: q.id },
                data: { currentVal: q.targetVal, completed: true }
            });

            // Reward Injection
            if (q.rewardKey === 'gold') {
                await prisma.player.update({
                    where: { id: playerId },
                    data: { gold: { increment: q.rewardQty } }
                });
            } else {
                await prisma.inventoryItem.upsert({
                    where: { playerId_itemKey: { playerId, itemKey: q.rewardKey } },
                    update: { quantity: { increment: q.rewardQty } },
                    create: { playerId, itemKey: q.rewardKey, quantity: q.rewardQty }
                });
            }

            const rewardNames: Record<string, string> = {
                'gold': '💰 Gold', 'dungeon_key': '🗝️ Dungeon Key', 'lumina_egg': '🥚 Lumina Egg', 'mystic_egg': '🥚 Mystic Egg'
            };
            const niceName = rewardNames[q.rewardKey] || q.rewardKey;

            completionMessages.push(`🌟 **BOUNTY COMPLETE!** You finished a [**${q.type}**] task and earned **${q.rewardQty}x ${niceName}**!`);
        } else {
            // Just increment
            await prisma.quest.update({
                where: { id: q.id },
                data: { currentVal: newVal }
            });
        }
    }

    if (completionMessages.length > 0) return completionMessages.join('\n');
    return null;
}
