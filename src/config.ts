import { config } from 'dotenv';
import { resolve } from 'path';

// Load environment variables from .env file
config({ path: resolve(process.cwd(), '.env') });

const loadConfig = () => {
    const {
        DISCORD_TOKEN,
        DATABASE_URL,
        DATABASE_PUBLIC_URL,
        REDIS_URL,
        REDIS_PUBLIC_URL,
    } = process.env;

    if (!DISCORD_TOKEN) throw new Error('DISCORD_TOKEN is missing in environment variables.');
    if (!DATABASE_URL) throw new Error('DATABASE_URL is missing in environment variables.');
    // Redis URL falls back to standard local if not provided, though it should be in Railway context
    if (!REDIS_URL) throw new Error('REDIS_URL is missing in environment variables.');

    return {
        discord: {
            token: DISCORD_TOKEN,
        },
        database: {
            url: DATABASE_URL,
            publicUrl: DATABASE_PUBLIC_URL,
        },
        redis: {
            url: REDIS_URL,
            publicUrl: REDIS_PUBLIC_URL,
        }
    };
};

export const CONFIG = loadConfig();
