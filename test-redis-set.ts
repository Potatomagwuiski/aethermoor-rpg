import redisClient from './src/redis.js';

async function run() {
  const testKey = 'test:cd';
  await redisClient.setEx(testKey, 10, '1');
  const val = await redisClient.get(testKey);
  console.log('Value immediately after setEx:', val);
  
  setTimeout(async () => {
     const val2 = await redisClient.get(testKey);
     console.log('Value after 2 seconds:', val2);
     await redisClient.disconnect();
  }, 2000);
}

run().catch(console.error);
