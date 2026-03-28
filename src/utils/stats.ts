import { BLUEPRINTS } from '../commands/forge.js';

export function calculateBuildArchitecture(player: any) {
    if (!player.equipment || player.equipment.length === 0) {
        const buildIdentity = `🛡️ **${Math.floor(player.end * 1)}** Block | 💥 **${Math.floor(player.int * 0.5)}%** Crit | 💨 **${Math.floor(player.agi * 0.5)}%** Dodge`;
        return {
            buildIdentity,
            activeAbilities: [], gearCrit: Math.floor(player.int * 0.5), gearEvasion: Math.floor(player.agi * 0.5), baseMitigation: Math.floor(player.end * 1),
            gearLifesteal: 0, hasUndying: false, hasLichKing: false, gearDef: 0, bonusCrit: 0, bonusEvasion: 0
        };
    }

    const activeAbilities = player.equipment.flatMap((eq: any) => {
        const bp = BLUEPRINTS[eq.baseItemKey];
        if (!bp || !bp.abilities) return [];
        let abs = [];
        const rarity = eq.rarity.toLowerCase();
        if (['common', 'uncommon', 'rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 0) abs.push(bp.abilities[0]);
        if (['uncommon', 'rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 1) abs.push(bp.abilities[1]);
        if (['rare', 'epic', 'legendary'].includes(rarity) && bp.abilities.length > 2) abs.push(bp.abilities[2]);
        if (['epic', 'legendary'].includes(rarity) && bp.abilities.length > 3) abs.push(bp.abilities[3]);
        if (['legendary'].includes(rarity) && bp.abilities.length > 4) abs.push(bp.abilities[4]);
        return abs;
    });

    let gearCrit = 0;
    let gearEvasion = 0;
    let gearDef = player.equipment.reduce((sum: number, eq: any) => sum + eq.bonusDef, 0);
    let gearLifesteal = 0;
    
    let bonusCrit = player.equipment.reduce((sum: number, eq: any) => sum + eq.bonusCrit, 0);
    let bonusEvasion = player.equipment.reduce((sum: number, eq: any) => sum + eq.bonusEvasion, 0);
    
    let hasUndying = false;
    let hasLichKing = false;
    const armorClass = player.equipment.find((g: any) => g.slot === 'ARMOR')?.equipmentClass || 'CLOTH';

    for (const ab of activeAbilities) {
        if (!ab) continue;
        const pctMatch = ab.match(/[+\s]?(\d+)%/);
        if (pctMatch) {
            const val = parseInt(pctMatch[1]);
            if (ab.includes('Evasion') || ab.includes('Dodge') || ab.includes('Swiftness')) bonusEvasion += val;
            if (ab.includes('Critical') || ab.includes('Crit') || ab.includes('Focus')) bonusCrit += val;
        }
        
        const flatDefMatch = ab.match(/grants (\d+) bonus DEF/i) || ab.match(/blocks (\d+) incoming/i);
        if (flatDefMatch) gearDef += parseInt(flatDefMatch[1]);
        if (ab.includes('Stalwart')) gearDef += 5;

        if (ab.includes('Undying') || ab.includes('Phylactery')) hasUndying = true;
        if (ab.includes('Lich King')) hasLichKing = true;
        
        if (ab.includes('Bloodlust')) gearLifesteal += 5;
        if (ab.includes('Void Touched')) gearLifesteal += 5;
        if (ab.includes('Reap')) gearLifesteal += 10;
        if (ab.includes('Soul Devourer')) gearLifesteal += 15;
        if (ab.includes('Bone Armor')) gearDef += Math.floor(player.int * 0.5);
    }
    
    if (armorClass === 'LIGHT_ARMOR') gearEvasion += 15;
    
    // Some abilities (like Veil of Night) dynamically scale off current gearEvasion before END applies
    let currentEvasionCalc = bonusEvasion + Math.floor(player.agi * 0.5);
    for (const ab of activeAbilities) {
        if (!ab) continue;
        if (ab.includes('Veil of Night')) {
            const evTransfer = Math.floor((currentEvasionCalc + 15) * 0.2); // Rough approximation
            currentEvasionCalc -= evTransfer;
            gearDef += evTransfer;
        }
    }

    gearCrit = bonusCrit + Math.floor(player.int * 0.5); 
    gearEvasion = currentEvasionCalc;
    const baseMitigation = Math.floor(gearDef * 0.75) + Math.floor(player.end * 1);

    let buildIdentity = `🛡️ **${baseMitigation}** Block | 💥 **${Math.min(100, gearCrit)}%** Crit | 💨 **${Math.min(100, gearEvasion)}%** Dodge`;
    if (gearLifesteal > 0) buildIdentity += ` | 🦇 **${gearLifesteal}%** Lifesteal`;
    
    const activePet = player.pets ? player.pets.find((p: any) => p.equipped) : null;
    if (activePet) {
        buildIdentity += ` | ${activePet.emoji} Pet`;
        gearDef += activePet.bonusDef;
    }

    const abStr = activeAbilities.join(',');
    if (abStr.includes('Hemorrhage')) buildIdentity += ` | 🩸 Bleed`;
    if (abStr.includes('Neurotoxin')) buildIdentity += ` | 🧪 Poison`;
    if (abStr.includes('Relentless')) buildIdentity += ` | 📈 Momentum`;
    if (abStr.includes('Executioner')) buildIdentity += ` | 🗡️ Burst`;
    if (hasUndying || hasLichKing) buildIdentity += ` | ✨ Revive`;

    return {
        buildIdentity,
        activeAbilities,
        gearCrit,
        gearEvasion,
        baseMitigation,
        gearLifesteal,
        hasUndying,
        hasLichKing,
        gearDef,
        bonusCrit,
        bonusEvasion,
        petBonusAtk: activePet ? activePet.bonusAtk : 0,
        petBonusHp: activePet ? activePet.bonusHp : 0
    };
}

export function getWeaponSlotModifierString(weaponName: string, activeAbilities: string[]): string | null {
    let slotBonus = 0;
    if (weaponName.includes('Uncommon')) slotBonus += 2;
    else if (weaponName.includes('Rare')) slotBonus += 5;
    else if (weaponName.includes('Epic')) slotBonus += 12;
    else if (weaponName.includes('Legendary')) slotBonus += 25;

    for (const ab of activeAbilities) {
        if (!ab) continue;
        const luckyMatch = ab.match(/(\d+)% chance for extra loot/i) || ab.match(/Grants (\d+)% Jackpot/i) || ab.match(/\+(\d+)% Jackpot/i);
        if (luckyMatch) slotBonus += parseInt(luckyMatch[1]);
    }
    
    if (slotBonus > 0) return `\`[🎲 +${slotBonus}% Slot Luck]\``;
    return null;
}
