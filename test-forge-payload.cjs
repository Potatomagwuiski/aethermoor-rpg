const { EmbedBuilder, ActionRowBuilder, ButtonBuilder, ButtonStyle, StringSelectMenuBuilder } = require('discord.js');

const row = new ActionRowBuilder()
    .addComponents(
         new ButtonBuilder().setCustomId('forge_weapons').setLabel('Weapons').setStyle(ButtonStyle.Primary).setEmoji('🗡️'),
         new ButtonBuilder().setCustomId('forge_armor').setLabel('Armor').setStyle(ButtonStyle.Success).setEmoji('🛡️'),
         new ButtonBuilder().setCustomId('forge_tools').setLabel('Tools').setStyle(ButtonStyle.Secondary).setEmoji('⛏️')
    );

let selectOptions = [];
selectOptions.push({
    label: 'No Craftable Blueprints',
    value: 'none',
    description: 'Gather more materials first!'
});

const selectMenu = new StringSelectMenuBuilder()
    .setCustomId(`forge_craft_weapons`)
    .setPlaceholder('Select a Blueprint to Forge')
    .addOptions(selectOptions.map(opt => ({
         label: opt.label,
         value: opt.value,
         description: opt.description
    })));

const selectRow = new ActionRowBuilder().addComponents(selectMenu);

let componentsArray = [row, selectRow];

console.log(JSON.stringify(componentsArray.map(c => c.toJSON()), null, 2));
