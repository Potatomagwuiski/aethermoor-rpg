import { enforceCooldown } from './src/utils/cooldown.js';

async function run() {
    // We do NOT start redisClient natively. Since we didn't import it, wait, we DID import it inside cooldown.ts!
    // But we don't await connection success.
    const key = 'test:cd:' + Date.now();
    console.log("Check 1:", await enforceCooldown(key, 60)); // false
    console.log("Check 2:", await enforceCooldown(key, 60)); // true
    await new Promise((r) => setTimeout(r, 1000));
    console.log("Check 3:", await enforceCooldown(key, 60)); // true
    process.exit(0);
}
run();
