import { Redis } from 'ioredis';
import { CONFIG } from './config.js';

// Prevent multiple instances of Redis caching in development
declare global {
    var redis: Redis | undefined;
}

export const redis = global.redis || new Redis(CONFIG.redis.url);

if (process.env.NODE_ENV !== 'production') {
    global.redis = redis;
}
