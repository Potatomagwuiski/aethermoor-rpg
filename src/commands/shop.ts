import { Message, EmbedBuilder } from 'discord.js';

export const SHOP_ITEMS = [
    { id: 1, name: 'Training Dagger', slot: 'Weapon', price: 40, baseDamage: 15, stats: { dex: 5, critChance: 5 }, passive: 'Flurry' },
    { id: 2, name: 'Novice Greatsword', slot: 'Weapon', price: 40, baseDamage: 25, stats: { str: 5, maxDamage: 10 }, passive: 'Cleave' },
    { id: 3, name: 'Apprentice Wand', slot: 'Weapon', price: 40, baseDamage: 12, stats: { int: 8, accuracy: 5 }, passive: 'Ignite' },
    { id: 4, name: 'Flintlock Musket', slot: 'Weapon', price: 40, baseDamage: 30, stats: { dex: 5, accuracy: 20 }, passive: 'First Strike' },
    { id: 5, name: 'Iron Warhammer', slot: 'Weapon', price: 40, baseDamage: 28, stats: { str: 8 }, passive: 'Sunder' },
    
    { id: 6, name: 'Wooden Shield', slot: 'OffHand', price: 20, baseArmor: 10, stats: { vit: 3, evasion: 10 }, passive: 'Deflect' },
    { id: 7, name: 'Apprentice Orb', slot: 'OffHand', price: 20, baseArmor: 5, stats: { int: 5 }, passive: 'Mana Shield' },
    
    { id: 8, name: 'Cotton Tunic', slot: 'Chest', price: 40, baseArmor: 15, stats: { dex: 2, evasion: 5 }, passive: 'Fleet Footed' },
    { id: 9, name: 'Iron Cuirass', slot: 'Chest', price: 40, baseArmor: 25, stats: { str: 2 }, passive: 'Stalwart' },
    { id: 10, name: 'Leather Boots', slot: 'Boots', price: 30, baseArmor: 10, stats: { dex: 3, evasion: 5 }, passive: 'Agility' }
];

export async function executeShop(message: Message) {
    const embed = new EmbedBuilder()
        .setColor('#F1C40F')
        .setTitle('🏪 The Aethermoor Merchant')
        .setDescription('Welcome! We have the finest starter supplies for aspiring adventurers. Use `rpg buy <ID>` to purchase an item.')
        .setThumbnail('https://i.imgur.com/7s1HlX1.png');

    const weaponsList = SHOP_ITEMS.filter(i => i.slot === 'Weapon').map(i => `**[${i.id}]** \`${i.name}\` (🪙 ${i.price}) - *[${i.passive}]*`).join('\n');
    const offhandList = SHOP_ITEMS.filter(i => i.slot === 'OffHand').map(i => `**[${i.id}]** \`${i.name}\` (🪙 ${i.price}) - *[${i.passive}]*`).join('\n');
    const apparelList = SHOP_ITEMS.filter(i => ['Chest', 'Boots'].includes(i.slot)).map(i => `**[${i.id}]** \`${i.name}\` (🪙 ${i.price}) - *[${i.passive}]*`).join('\n');

    embed.addFields(
        { name: '⚔️ Weaponry', value: weaponsList },
        { name: '🛡️ Defenses', value: offhandList },
        { name: '🧵 Apparel', value: apparelList }
    );

    return message.reply({ embeds: [embed] });
}
