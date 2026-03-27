import redisClient from './src/redis.js';
import { enforceCooldown } from './src/utils/cooldown.js';

async function run() {
    const key = 'test:cd';
    await redisClient.del(key);
    console.log("Check 1:", await enforceCooldown(key, 60)); // false
    console.log("Check 2:", await enforceCooldown(key, 60)); // true
    await new Promise(r => setTimeout(r, 1000));
    console.log("Check 3:", await enforceCooldown(key, 60)); // true
    process.exit(0);
}
setTimeout(run, 1000); // 1 sec for redis to connect
