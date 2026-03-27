import redisClient from './src/redis.js';

async function testRedis() {
  console.log('Testing Redis connection in 2 seconds...');
  setTimeout(async () => {
    console.log('Redis Ready status:', redisClient.isReady);
    await redisClient.disconnect();
  }, 2000);
}

testRedis().catch(console.error);
