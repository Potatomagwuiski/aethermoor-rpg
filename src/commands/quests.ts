import { Message, EmbedBuilder } from 'discord.js';
import { prisma } from '../db.js';

const QUEST_TYPES = ['HUNT', 'MINE', 'CHOP', 'FISH', 'HARVEST'];

function generateRandomQuest(playerLevel: number, playerId: string) {
    const type = QUEST_TYPES[Math.floor(Math.random() * QUEST_TYPES.length)];
    let targetVal = 10;
    let rewardKey = 'gold';
    let rewardQty = 500;

    const roll = Math.random();
    
    if (type === 'HUNT') {
        targetVal = 25 + Math.floor(Math.random() * 25);
        if (roll > 0.90) { rewardKey = 'dungeon_key'; rewardQty = 1; }
        else if (roll > 0.70) { rewardKey = 'mystic_egg'; rewardQty = 1; }
        else { rewardKey = 'gold'; rewardQty = targetVal * 50; }
    } else if (type === 'MINE' || type === 'CHOP') {
        targetVal = 40 + Math.floor(Math.random() * 40);
        if (roll > 0.95) { rewardKey = 'dungeon_key'; rewardQty = 1; }
        else if (roll > 0.80) { rewardKey = 'lumina_egg'; rewardQty = 1; }
        else { rewardKey = 'gold'; rewardQty = targetVal * 30; }
    } else {
        targetVal = 15 + Math.floor(Math.random() * 15);
        if (roll > 0.85) { rewardKey = 'lumina_egg'; rewardQty = 1; }
        else { rewardKey = 'gold'; rewardQty = targetVal * 40; }
    }

    return {
        playerId,
        type,
        targetVal,
        currentVal: 0,
        rewardKey,
        rewardQty,
        completed: false
    };
}

export async function executeQuests(message: Message, args: string[]) {
    const discordId = message.author.id;
    const player = await prisma.player.findUnique({
        where: { discordId },
        include: { quests: true }
    });

    if (!player) {
        return message.reply('You have not registered yet! Type `rpg start` to begin.');
    }

    const now = new Date();
    let generateNew = false;

    if (!player.lastDailyQuestRefresh) {
        generateNew = true;
    } else {
        const diffHours = (now.getTime() - player.lastDailyQuestRefresh.getTime()) / (1000 * 60 * 60);
        if (diffHours >= 24) generateNew = true;
    }

    if (generateNew) {
        // Wipe old quests
        await prisma.quest.deleteMany({ where: { playerId: player.id } });

        // Generate 3 new ones
        const newQuests = [
            generateRandomQuest(player.level, player.id),
            generateRandomQuest(player.level, player.id),
            generateRandomQuest(player.level, player.id)
        ];

        await prisma.quest.createMany({ data: newQuests });

        // Update refresh timestamp
        await prisma.player.update({
            where: { id: player.id },
            data: { lastDailyQuestRefresh: now }
        });

        // Re-fetch the newly created quests to display them
        player.quests = await prisma.quest.findMany({ where: { playerId: player.id } });
    }

    const embed = new EmbedBuilder()
        .setTitle('📜 Daily Bounty Board')
        .setColor(0x8A2BE2)
        .setDescription('Complete these bounties passively by playing the game. They reset every 24 hours!\n');

    let questText = '';
    const emojiMap: Record<string, string> = {
        'HUNT': '🐺', 'MINE': '⛏️', 'CHOP': '🪓', 'FISH': '🎣', 'HARVEST': '🌾'
    };

    const rewardNames: Record<string, string> = {
        'gold': '💰 Gold', 'dungeon_key': '🗝️ Dungeon Key', 'lumina_egg': '🥚 Lumina Egg', 'mystic_egg': '🥚 Mystic Egg'
    };

    if (player.quests && player.quests.length > 0) {
        for (const q of player.quests) {
            const icon = emojiMap[q.type] || '📌';
            const progress = q.completed ? '✅ **COMPLETE**' : `[ ${Math.min(q.currentVal, q.targetVal)} / ${q.targetVal} ]`;
            const rewardName = rewardNames[q.rewardKey] || q.rewardKey;
            
            questText += `${icon} **${q.type}** - ${progress}\n> Reward: ${q.rewardQty}x ${rewardName}\n\n`;
        }
    } else {
        questText = "No active bounties found. Check back later!";
    }

    embed.addFields({ name: 'Active Bounties', value: questText });
    
    if (!generateNew && player.lastDailyQuestRefresh) {
        const resetTime = new Date(player.lastDailyQuestRefresh.getTime() + (24 * 60 * 60 * 1000));
        embed.setFooter({ text: `Bounties reset at ${resetTime.toUTCString()}` });
    } else {
        embed.setFooter({ text: `New Bounties have been generated!` });
    }

    return message.reply({ embeds: [embed] });
}
