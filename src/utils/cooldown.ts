import redisClient from '../redis.js';

// In-Memory cache fallback for environments without a persistent Redis cluster
const memoryCooldowns = new Map<string, number>();

export interface CooldownResponse {
    onCooldown: boolean;
    remainingMs: number;
}

/**
 * Checks if a user is on cooldown without setting a new one
 */
export async function checkCooldownOnly(key: string): Promise<CooldownResponse> {
    try {
        if (redisClient.isReady) {
            const ttl = await redisClient.ttl(key);
            if (ttl > 0) {
                return { onCooldown: true, remainingMs: ttl * 1000 };
            }
            return { onCooldown: false, remainingMs: 0 };
        }
    } catch (e) {
        // Fall down to memory check
    }

    const expiration = memoryCooldowns.get(key);
    if (expiration) {
        const remaining = expiration - Date.now();
        if (remaining > 0) {
            return { onCooldown: true, remainingMs: remaining };
        }
    }
    return { onCooldown: false, remainingMs: 0 };
}

/**
 * Checks if a user is on cooldown, and if not, sets the cooldown.
 * @param key The unique string key for the cooldown (e.g., cd:hunt:discordId)
 * @param seconds The number of seconds the cooldown should last
 * @returns CooldownResponse object containing exactly how much time is left if blocked
 */
export async function enforceCooldown(key: string, seconds: number): Promise<CooldownResponse> {
    try {
        if (process.env.NO_COOLDOWNS) return { onCooldown: false, remainingMs: 0 };
        if (redisClient.isReady) {
            const ttl = await redisClient.ttl(key);
            if (ttl > 0) return { onCooldown: true, remainingMs: ttl * 1000 };
            
            await redisClient.setEx(key, seconds, '1');
            return { onCooldown: false, remainingMs: 0 };
        }
    } catch (e) {
        console.warn(`[Cooldown] Redis failed for key ${key}, falling back to memory.`);
    }

    // Fallback: In-Memory Map
    const expiration = memoryCooldowns.get(key);
    if (expiration) {
        const remaining = expiration - Date.now();
        if (remaining > 0) {
            return { onCooldown: true, remainingMs: remaining };
        }
    }

    // Set new expiration
    memoryCooldowns.set(key, Date.now() + (seconds * 1000));
    
    // Optional: Cleanup memory occasionally to prevent slow leak
    if (memoryCooldowns.size > 50000) memoryCooldowns.clear(); 

    return { onCooldown: false, remainingMs: 0 };
}
