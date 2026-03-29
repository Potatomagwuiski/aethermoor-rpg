const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  const recipes = await prisma.unlockedRecipe.findMany({
    where: {
      recipeKey: { in: ['koi_soup', 'lumberjack_pancakes'] }
    },
    include: {
      player: {
        select: {
          name: true,
          discordId: true
        }
      }
    }
  });
  
  console.log(`Found ${recipes.length} recipe unlocks in the database for those two items:`);
  recipes.forEach(r => {
    console.log(`Player: ${r.player.name} (${r.player.discordId}) -> Recipe: ${r.recipeKey}`);
  });
}

main().catch(console.error).finally(() => prisma.$disconnect());
