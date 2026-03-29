import fs from 'fs';
import path from 'path';

const FORGE_PATH = path.join(process.cwd(), 'src/commands/forge.ts');

function updateRecipes() {
    let content = fs.readFileSync(FORGE_PATH, 'utf8');

    // Replace wood with sticks for bronze items
    content = content.replace(/name: 'Bronze (Sword|Greatsword|Dagger|Scythe|Staff|Armor|Pickaxe|Axe|Sickle|Rod)[\s\S]*?materials: \{ copper: (\d+), wood: (\d+)/g,
        (match, type, cop, wd) => match.replace(`wood: ${wd}`, `sticks: ${wd}`)
    );
    
    // Also Tin items
    content = content.replace(/name: 'Tin [\s\S]*?materials: \{ tin: (\d+), wood: (\d+)/g,
        (match, tin, wd) => match.replace(`wood: ${wd}`, `sticks: ${wd}`)
    );

    // shadow_tunic
    content = content.replace(/name: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: \{ mythril: 40, elderwood: 80, hellfire_essence: 5 \},/g,
        `name: 'Shadow Tunic', requiredBlueprint: 'blueprint_shadow_tunic', materials: { mythril: 40, elderwood: 80, hellfire_essence: 5, golden_pearl: 2, frost_lotus: 10 },`);

    // void_blade
    content = content.replace(/name: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: \{ voidstone: 90, rare_meteorite_ingot: 30, mythic_dragon_scale: 2 \},/g,
        `name: 'Void Blade', requiredBlueprint: 'blueprint_void_blade', materials: { voidstone: 90, rare_meteorite_ingot: 30, mythic_dragon_scale: 2, nightmare_kelp: 15 },`);

    // Write back
    fs.writeFileSync(FORGE_PATH, content);
    console.log("Recipes successfully modified!");
}

updateRecipes();
