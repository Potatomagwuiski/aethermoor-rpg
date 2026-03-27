import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();
async function main() {
  await prisma.player.updateMany({
    data: {
      hp: 100,
      maxHp: 100
    }
  });
  console.log("Successfully reset all players' HP and MaxHP back to 100.");
}
main().catch(console.error).finally(() => prisma.$disconnect());
