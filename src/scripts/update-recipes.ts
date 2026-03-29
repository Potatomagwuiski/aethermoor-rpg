import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function updateRecipes() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    // Make sticks replace wood in bronze tools
    content = content.replace(/materials: \{ wood: 10 \}/g, "materials: { sticks: 10 }");
    content = content.replace(/materials: \{ tin: 30, wood: 20 \}/g, "materials: { tin: 30, sticks: 20 }");
    content = content.replace(/materials: \{ copper: 45, wood: 12, wolf_pelt: 5 \}/g, "materials: { copper: 45, sticks: 12, wolf_pelt: 5 }");
    
    // Add oakwood instead of regular wood for iron/steel tools and weapons
    content = content.replace(/materials: \{ iron: 45, wood: 12/g, "materials: { iron: 45, oakwood: 12");
    content = content.replace(/materials: \{ steel_ore: 45, wood: 12/g, "materials: { steel_ore: 45, oakwood: 12");
    
    // Add ebony_wood instead of ashwood to mythril/void items? Yes.
    content = content.replace(/ashwood: 12/g, "ebony_wood: 12");
    content = content.replace(/ashwood: 30/g, "ebony_wood: 30");

    // Add rare fish/herbs to magic staves
    content = content.replace(/'mystic_staff': {\nname: 'Mystic Staff', requiredBlueprint: 'blueprint_mystic_staff', materials: { steel_ore: 40, wood: 50, slime_gel: 10 },/g,
        `'mystic_staff': {\nname: 'Mystic Staff', requiredBlueprint: 'blueprint_mystic_staff', materials: { steel_ore: 40, oakwood: 50, frost_lotus: 10, glacier_cod: 5 },`);
        
    content = content.replace(/'moonlight_staff': {\nname: 'Moonlight Staff', requiredBlueprint: 'blueprint_moonlight_staff', materials: { mythril: 40, ebony_wood: 50, shadow_dust: 10 },/g,
        `'moonlight_staff': {\nname: 'Moonlight Staff', requiredBlueprint: 'blueprint_moonlight_staff', materials: { mythril: 40, ebony_wood: 50, mooncap_mushroom: 10, void_bass: 5 },`);

    content = content.replace(/'meteor_staff': {\nname: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { rare_meteorite_ingot: 40, ebony_wood: 50, demon_horn: 10 },/g,
        `'meteor_staff': {\nname: 'Meteor Staff', requiredBlueprint: 'blueprint_meteor_staff', materials: { rare_meteorite_ingot: 40, ebony_wood: 50, demon_horn: 10, lava_eel: 5, cinderbloom: 5 },`);

    // Add other unused drops to random items
    // void_blade
    content = content.replace(/'void_blade': {\nname: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: { voidstone: 50, ebony_wood: 30, shadow_dust: 15 },/g,
        `'void_blade': {\nname: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: { voidstone: 50, ebony_wood: 30, nightmare_kelp: 15 },`);
        
    // shadow_tunic
    content = content.replace(/'shadow_tunic': {\nname: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: { mythril: 50, ebony_wood: 20, shadow_dust: 6 },/g,
        `'shadow_tunic': {\nname: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: { mythril: 50, ebony_wood: 20, lumina_berry: 15, golden_pearl: 2 },`);

    // living_bark and golden_koi
    content = content.replace(/'mythril_sickle': {\nname: 'Mythril Sickle', requiredBlueprint: 'blueprint_mythril_sickle', materials: { mythril: 45, ebony_wood: 12, bat_wing: 5 },/g,
        `'mythril_sickle': {\nname: 'Mythril Sickle', requiredBlueprint: 'blueprint_mythril_sickle', materials: { mythril: 45, ebony_wood: 12, living_bark: 5, golden_koi: 1 },`);

    // Write back
    fs.writeFileSync(FORGE_PATH, content);
    console.log("Recipes successfully modified!");
}

updateRecipes();
