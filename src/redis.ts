import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL as string,
    disableOfflineQueue: true,
    socket: {
        connectTimeout: 5000,
        reconnectStrategy: (retries) => {
            if (retries > 5) return new Error('Max redis connection retries reached');
            return Math.min(retries * 100, 3000);
        }
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

redisClient.connect().catch(console.error);

export default redisClient;
