import { createClient } from 'redis';
import * as dotenv from 'dotenv';
dotenv.config();

const redisClient = createClient({
    url: process.env.REDIS_URL as string
});

redisClient.on('error', (err) => console.log('Redis Client Error', err));

export default redisClient;
