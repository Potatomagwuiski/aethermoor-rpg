import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    const players = await prisma.player.findMany({
        include: {
            equipment: true,
            inventory: true,
            tools: true,
            pets: true,
        }
    });
    
    for (const player of players) {
        console.log(`\n--- Player: ${player.name} (Lvl ${player.level}) ---`);
        console.log(`HP: ${player.hp}/${player.maxHp} | Gold: ${player.gold} | XP: ${player.xp}`);
        console.log(`Stats -> STR: ${player.str} | AGI: ${player.agi} | INT: ${player.int} | END: ${player.end}`);
        console.log(`Location: ${player.location}`);
        
        console.log(`\n[Equipped Gear]`);
        const equipped = player.equipment.filter(e => e.equipped);
        for (const eq of equipped) {
            console.log(`- ${eq.name} (ATK: ${eq.bonusAtk}, DEF: ${eq.bonusDef}, CRIT: ${eq.bonusCrit || 0}, EVASION: ${eq.bonusEvasion || 0}, LIFESTEAL: ${eq.bonusLifesteal || 0})`);
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
