import prisma from './src/db.js';

async function test() {
  try {
    const existingPlayer = await prisma.player.findUnique({
      where: { discordId: "123" }
    });
    console.log("DB connection and query successful:", existingPlayer);
  } catch (e) {
    console.error("Crash during findUnique:", e);
  }
}
test();
