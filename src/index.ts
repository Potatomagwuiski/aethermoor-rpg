import { Client, GatewayIntentBits, Events } from 'discord.js';
import * as dotenv from 'dotenv';
import { ACTIONS, REACTIONS, STANCES } from './game/items';
import { Fighter, resolveCombatTurn } from './game/combat';

dotenv.config();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

client.once(Events.ClientReady, (readyClient) => {
  console.log(`Ready! Logged in as ${readyClient.user.tag}`);
});

client.on(Events.MessageCreate, async (message) => {
  if (message.author.bot) return;

  const content = message.content.trim().toLowerCase();

  if (content === 'ping') {
    await message.reply('Pong! Bot is online and ready for a new idea.');
  }

  // A prototype combat simulation command
  if (content === 'rpg sim') {
    // Scaffold two pre-made builds fighting
    const rogueFighter: Fighter = {
      name: "Shadow Rogue",
      hp: 100, maxHp: 100, level: 5,
      stats: { str: 5, dex: 25, vit: 10, int: 5 },
      loadout: {
        stance: STANCES['shadow_dance'], // High evade
        action: ACTIONS['twin_daggers'], // Multi-hit agile attacks
        reaction: REACTIONS['shadow_step'] // Heals when evading
      }
    };

    const tankFighter: Fighter = {
      name: "Juggernaut",
      hp: 150, maxHp: 150, level: 5,
      stats: { str: 20, dex: 0, vit: 20, int: 5 },
      loadout: {
        stance: STANCES['juggernaut_form'], // Huge DR, but 0 evade
        action: ACTIONS['heavy_greataxe'], // Extremely heavy single hit
        reaction: REACTIONS['thorned_armor'] // Reflects damage on hit
      }
    };

    let logStr = "**--- COMBAT SIMULATION ---**\n";
    logStr += "Shadow Rogue [Shadow Dance + Twin Daggers + Shadow Step]\n";
    logStr += "Vs.\n";
    logStr += "Juggernaut [Juggernaut Form + Heavy Greataxe + Thorned Armor]\n\n";

    // Simulate 3 rounds purely for text demonstration
    for (let round = 1; round <= 3; round++) {
      if (rogueFighter.hp <= 0 || tankFighter.hp <= 0) break;
      
      logStr += `\n**--- ROUND ${round} ---**`;
      
      // Rogue attacks Tank
      const rogueLogs = resolveCombatTurn(rogueFighter, tankFighter);
      logStr += "\n" + rogueLogs.join("\n");
      
      // Tank attacks Rogue
      if (tankFighter.hp > 0) {
         const tankLogs = resolveCombatTurn(tankFighter, rogueFighter);
         logStr += "\n" + tankLogs.join("\n");
      }
      
      logStr += `\n\n🩸 **STATUS:** Rogue HP: ${Math.max(0, rogueFighter.hp)} | Juggernaut HP: ${Math.max(0, tankFighter.hp)}`;
    }

    // Since logs might be long, split if > 2000 chars. For now we just send.
    // Ensure we don't hit max char limit:
    if (logStr.length > 1950) logStr = logStr.substring(0, 1950) + "...[Truncated]";
    await message.reply(logStr);
  }
});

const token = process.env.DISCORD_TOKEN;
if (!token) {
  console.error("DISCORD_TOKEN is missing or empty in environment. Please provide a token.");
  process.exit(1);
}

client.login(token).catch(console.error);
