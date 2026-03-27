import { Message, EmbedBuilder } from 'discord.js';
import { checkCooldownOnly } from '../utils/cooldown.js';

export async function executeCd(message: Message) {
  const discordId = message.author.id;

  const huntKey = `cooldown:hunt:${discordId}`;
  const workKey = `cd:work:${discordId}`;
  const restKey = `cd:rest:${discordId}`;

  const huntCd = await checkCooldownOnly(huntKey);
  const workCd = await checkCooldownOnly(workKey);
  const restCd = await checkCooldownOnly(restKey);

  const huntStatus = huntCd.onCooldown 
    ? `⏳ **Wait ${Math.ceil(huntCd.remainingMs / 1000)}s**` 
    : `✅ **Ready!**`;
    
  const workStatus = workCd.onCooldown 
    ? `⏳ **Wait ${Math.ceil(workCd.remainingMs / 1000)}s**` 
    : `✅ **Ready!**`;

  const restStatus = restCd.onCooldown 
    ? `⏳ **Wait ${Math.ceil(restCd.remainingMs / 60000)}m**` 
    : `✅ **Ready!**`;

  const embed = new EmbedBuilder()
    .setTitle(`⏳ Cooldown Status`)
    .setColor(0x2B2D31)
    .setDescription(`Your current action timers:\n\n` +
      `⚔️ **HUNT:** ${huntStatus}\n` +
      `⛏️ **WORK (Gather):** ${workStatus}\n` +
      `🔥 **REST (Campfire):** ${restStatus}`
    )
    .setFooter({ text: 'Use rpg list to see available commands!' });

  return message.reply({ embeds: [embed] });
}
