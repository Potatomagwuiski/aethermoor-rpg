import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

async function run() {
    const redisClient = createClient({
        url: process.env.REDIS_URL as string,
        disableOfflineQueue: true,
    });
    
    redisClient.on('error', (err) => console.log('Redis Client Error', err));
    
    // First connect (like in redis.ts)
    redisClient.connect().catch(console.error);
    
    setTimeout(async () => {
        try {
            // Second connect (like in index.ts)
            console.log('Attempting second connect...');
            await redisClient.connect();
            console.log('Second connect succeeded?');
        } catch (e) {
            console.error('Second connect threw an error:', e);
        }
        
        console.log('Final isReady state:', redisClient.isReady);
        await redisClient.disconnect();
    }, 500);
}

run();
