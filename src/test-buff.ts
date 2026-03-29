import 'dotenv/config';
import { prisma } from './db.js';

async function runTest() {
  const discordId = 'combat_tester';
  
  // Set buff
  const player = await prisma.player.findUnique({ where: { discordId } });
  if (!player) return console.log("No tester");

  const expiration = new Date(Date.now() + 60 * 60 * 1000);
  console.log("Setting buffExpiresAt to:", expiration);
  console.log("Current Date.now():", new Date());

  await prisma.player.update({
    where: { id: player.id },
    data: { 
      activeBuff: 'ATK_10_HOT_5',
      buffExpiresAt: expiration
    }
  });

  const updatedRefetch = await prisma.player.findUnique({ where: { discordId } });
  console.log("Refetched activeBuff:", updatedRefetch?.activeBuff);
  console.log("Refetched buffExpiresAt:", updatedRefetch?.buffExpiresAt);
  
  if (updatedRefetch?.buffExpiresAt && updatedRefetch.buffExpiresAt > new Date()) {
      console.log("YES! buffExpiresAt > new Date()");
  } else {
      console.log("NO! IT IS NOT GREATER!");
  }

  process.exit(0);
}

runTest().catch(console.error);
