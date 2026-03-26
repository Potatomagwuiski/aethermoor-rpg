import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL as string,
    disableOfflineQueue: true,
    socket: {
        family: 4, // Force IPv4 - Railway internal networking fix
        connectTimeout: 5000
    }
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default redisClient;
