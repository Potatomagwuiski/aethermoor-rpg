import redisClient from '../redis.js';

// In-Memory cache fallback for environments without a persistent Redis cluster
const memoryCooldowns = new Map<string, number>();

/**
 * Checks if a user is on cooldown, and if not, sets the cooldown.
 * @param key The unique string key for the cooldown (e.g., cd:hunt:discordId)
 * @param seconds The number of seconds the cooldown should last
 * @returns true if the user IS on cooldown, false if they are newly tracked
 */
export async function enforceCooldown(key: string, seconds: number): Promise<boolean> {
    try {
        if (redisClient.isReady) {
            const isCooldown = await redisClient.get(key);
            if (isCooldown) return true;
            
            await redisClient.setEx(key, seconds, '1');
            return false;
        }
    } catch (e) {
        console.warn(`[Cooldown] Redis failed for key ${key}, falling back to memory.`);
    }

    // Fallback: In-Memory Map
    const expiration = memoryCooldowns.get(key);
    if (expiration && Date.now() < expiration) {
        return true;
    }

    // Set new expiration
    memoryCooldowns.set(key, Date.now() + (seconds * 1000));
    
    // Optional: Cleanup memory occasionally to prevent slow leak
    if (memoryCooldowns.size > 50000) memoryCooldowns.clear(); 

    return false;
}
