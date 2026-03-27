import { enforceCooldown } from './src/utils/cooldown.js';

async function run() {
    const key = 'test:cd';
    console.log("Check 1:", await enforceCooldown(key, 60)); // Should be false
    console.log("Check 2:", await enforceCooldown(key, 60)); // Should be true
    await new Promise(r => setTimeout(r, 1000));
    console.log("Check 3:", await enforceCooldown(key, 60)); // Should be true
}
run();
