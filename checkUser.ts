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
        console.log(`Available Stat Points: ${player.pointsAvailable}`);
        
        console.log(`\n[Equipped Gear]`);
        const equipped = player.equipment.filter(e => e.equipped);
        for (const eq of equipped) {
            console.log(`- ${eq.name} (ATK: ${eq.bonusAtk}, DEF: ${eq.bonusDef}, CRIT: ${eq.bonusCrit})`);
        }
        
        console.log(`\n[Inventory (Top 10)]`);
        const inv = player.inventory.sort((a, b) => b.quantity - a.quantity).slice(0, 10);
        for (const i of inv) {
            console.log(`- ${i.itemKey}: ${i.quantity}`);
        }
    }
}

main()
  .catch(e => console.error(e))
  .finally(async () => await prisma.$disconnect());
