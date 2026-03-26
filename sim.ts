import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function simulate() {
  // Let's create a dummy player
  const discordId = 'sim_test_user_001';
  await prisma.player.deleteMany({ where: { discordId } });

  let player = await prisma.player.create({
    data: {
      discordId,
      name: 'SimBot',
      activeClass: 'WARRIOR',
      level: 1,
      xp: 0,
      gold: 0,
      hp: 100,
      energy: 50,
      str: 5,
      agi: 5,
      int: 5,
      end: 5,
      pointsAvailable: 0
    }
  });

  const monsters = [
    { name: 'Goblin Scout', dmg: 2 },
    { name: 'Acid Slime', dmg: 3 },
    { name: 'Dire Wolf', dmg: 5 },
    { name: 'Cave Bat', dmg: 4 },
    { name: 'Skeleton Warrior', dmg: 6 },
    { name: 'Forest Treant', dmg: 8 },
    { name: 'Rock Golem', dmg: 10 },
    { name: 'Lesser Demon', dmg: 15 },
    { name: 'Shadow Stalker', dmg: 20 },
    { name: 'Mythic Drake', dmg: 35 },
  ];

  let totalDmgTaken = 0;
  let totalDied = 0;
  let huntCount = 0;

  for (let i = 0; i < 500; i++) {
    const mob = monsters[Math.floor(Math.random() * monsters.length)];
    const playerAtk = Math.max(1, player.str * 1.5 + player.level * 2);
    let damageTaken = Math.max(0, mob.dmg - Math.floor(player.end * 0.5));
    if (damageTaken < 0) damageTaken = 0;

    totalDmgTaken += damageTaken;
    player.hp -= damageTaken;

    if (player.hp <= 0) {
        totalDied++;
        player.hp = 100 + (player.level * 10); // simulate heal
        // penalty
        player.gold = Math.max(0, player.gold - 50);
        continue;
    }

    const goldReward = Math.floor(Math.random() * 10) + 5;
    const xpReward = Math.floor(Math.random() * 20) + 15;

    player.gold += goldReward;
    player.xp += xpReward;

    const NEXT_LEVEL_XP = player.level * 100;
    if (player.xp >= NEXT_LEVEL_XP) {
        player.level++;
        player.xp -= NEXT_LEVEL_XP;
        player.pointsAvailable += 3;
        // Auto assign stat points
        player.str += 1;
        player.end += 1;
        player.hp += 10;
        player.pointsAvailable -= 2;
    }

    huntCount++;
  }

  console.log(`--- SIMULATION AFTER ${huntCount} SUCCESSFUL HUNTS ---`);
  console.log(`Level: ${player.level}`);
  console.log(`Gold: ${player.gold}`);
  console.log(`Total Damage Taken: ${totalDmgTaken}`);
  console.log(`Times Died: ${totalDied}`);
  console.log(`Current STR: ${player.str} | END: ${player.end}`);
  
  // Test Gacha pull math
  let blueprints = { common: 0, uncommon: 0, epic: 0, legendary: 0, keys: 0 };
  for(let i=0; i < huntCount; i++) {
     if (Math.random() <= 0.25) { // 25% drop rate
        const r = Math.random();
        if (r > 0.999) blueprints.legendary++;
        else if (r > 0.95) blueprints.epic++;
        else if (r > 0.90) blueprints.keys++;
        else if (r > 0.70) blueprints.uncommon++;
        else blueprints.common++;
     }
  }

  console.log(`Blueprint Drops from ${huntCount} hunts:`);
  console.log(blueprints);
}

simulate().then(() => process.exit(0)).catch(e => { console.error(e); process.exit(1); });
