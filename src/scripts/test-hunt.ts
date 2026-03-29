import { execute } from '../commands/hunt.js';
import prisma from '../db.js';

async function run() {
    console.log("=== COMBAT TEST START ===");
    const player = await prisma.player.findFirst();
    if (!player) { console.error("No player!"); return; }

    const message = {
        author: { id: player.discordId },
        reply: (res: any) => {
            console.log("\n>>> DISCORD REPLY:");
            if (res.embeds && res.embeds[0]) {
                 console.log(`[TITLE] ${res.embeds[0].data.title}`);
                 console.log(`[DESC ] ${res.embeds[0].data.description}`);
                 if (res.embeds[0].data.fields) {
                     for (const f of res.embeds[0].data.fields) {
                         console.log(`[FIELD: ${f.name}] ${f.value}`);
                     }
                 }
            } else {
                 console.log(res);
            }
            process.exit(0);
        }
    };

    console.log(`Running Hunt for ${player.name}...`);
    
    // Clear cooldown hack via redis if it's connected
    try {
        const redisClient = require('../redis.js').default;
        if (!redisClient.isOpen) await redisClient.connect();
        await redisClient.del(`cooldown:hunt:${player.discordId}`);
    } catch(e) {}

    await execute(message as any);
}

run();
