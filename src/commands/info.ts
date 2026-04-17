import { Message, EmbedBuilder, ColorResolvable } from 'discord.js';
import { prisma } from '../db';
import { SHOP_ITEMS } from './shop';

const PASSIVE_DESCRIPTIONS: Record<string, string> = {
    'Flurry': 'Grants a chance to strike multiple times in a single turn without penalty.',
    'Parry': 'Provides a chance to completely block an incoming physical attack.',
    'Riposte': 'When you Parry an attack, you immediately counter-attack the enemy for 50% of your minimum damage.',
    'Stalwart': 'Makes you immune to incoming critical hits.',
    'Armor Break': 'Your attacks halve the enemy\'s physical armor.',
    'Armor Pierce': 'Your attacks passively ignore half of the enemy\'s physical armor.',
    'Thorns': 'Reflects 10% of all physical damage you take back to the attacker.',
    'Venom Strike': 'Your attacks apply lethal poison stacks that deal damage over time.',
    'Toxic Burst': 'Your critical strikes apply massive poison stacks to the enemy.',
    'Vampiric Drain': 'You heal for exactly 10% of all physical damage you deal to the enemy.',
    'Ignite': 'Your strikes deal bonus Fire elemental damage that completely bypasses physical armor (resisted by Fire Resistance).',
    'Luck': 'Increases the amount of XP you gain from defeating enemies.',
    'Wealth': 'Increases the amount of gold dropped by defeated enemies.'
};

function getPassiveDescription(passive: string): string {
    if (PASSIVE_DESCRIPTIONS[passive]) return PASSIVE_DESCRIPTIONS[passive];
    return `Grants the **${passive}** passive effect during combat.`;
}

export async function executeInfo(message: Message, args: string[]) {
    if (args.length === 0) {
        return message.reply('Please provide an item ID: `rpg info <ID>`');
    }

    const itemId = args[0];

    const item = await prisma.item.findUnique({
        where: { id: itemId }
    });

    if (!item) {
        // Fallback for shop items if they haven't been bought and don't exist in the DB yet
        const shopId = parseInt(itemId, 10);
        if (!isNaN(shopId)) {
            const shopItem = SHOP_ITEMS.find(i => i.id === shopId);
            if (shopItem) {
                return renderItemEmbed(message, {
                    id: shopItem.id.toString(),
                    name: shopItem.name,
                    rarity: 'Common',
                    slot: shopItem.slot,
                    baseDamage: shopItem.baseDamage || 0,
                    baseArmor: shopItem.baseArmor || 0,
                    modifiers: JSON.stringify(shopItem.stats),
                    passives: JSON.stringify([shopItem.passive])
                }, true);
            }
        }
        return message.reply(`No item found with ID \`${itemId}\`.`);
    }

    return renderItemEmbed(message, item, false);
}

async function renderItemEmbed(message: Message, item: any, isShopItem: boolean) {
    let rarityEmoji = '🔸';
    let color: ColorResolvable = '#95A5A6';
    
    if (item.rarity === 'Epic') { rarityEmoji = '🟣'; color = '#9B59B6'; }
    if (item.rarity === 'Legendary') { rarityEmoji = '🟡'; color = '#F1C40F'; }
    if (item.rarity === 'Rare') { rarityEmoji = '🔵'; color = '#3498DB'; }
    if (item.rarity === 'Uncommon') { rarityEmoji = '🟢'; color = '#2ECC71'; }
    if (isShopItem) { rarityEmoji = '🛍️'; }

    const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(`${rarityEmoji} ${item.name}`)
        .setDescription(`**ID:** \`${item.id}\`\n**Slot:** ${item.slot}\n**Rarity:** ${item.rarity}` + (isShopItem ? ' *(Shop Item)*' : ''));

    if (item.baseDamage > 0) embed.addFields({ name: '🗡️ Base Damage', value: `${item.baseDamage}`, inline: true });
    if (item.baseArmor > 0) embed.addFields({ name: '🛡️ Base Armor', value: `${item.baseArmor}`, inline: true });

    const modifiersObj = typeof item.modifiers === 'string' ? JSON.parse(item.modifiers) : item.modifiers;
    if (modifiersObj && typeof modifiersObj === 'object' && Object.keys(modifiersObj).length > 0) {
        const stats = Object.entries(modifiersObj).map(([k, v]) => `**${k.toUpperCase()}:** +${v}`).join('\n');
        embed.addFields({ name: '📈 Stat Modifiers', value: stats, inline: false });
    }

    const passArr = typeof item.passives === 'string' ? JSON.parse(item.passives) : item.passives;
    if (Array.isArray(passArr) && passArr.length > 0) {
        const passivesText = passArr.map((p: string) => `**${p}**\n*${getPassiveDescription(p)}*`).join('\n\n');
        embed.addFields({ name: '✨ Passives & Triggers', value: passivesText, inline: false });
    }

    return message.reply({ embeds: [embed] });
}
