const redis = require('redis');
require('dotenv').config();

// Redis client to connect to the Redis server using REDIS_URL environment variable
const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

// Redis 'ready' event is emitted when the client is connected and ready to accept commands
redisClient.on('ready', () => {
  console.log('Redis client is ready');
});

// Redis 'end' event is emitted when the connection to the Redis server is closed
redisClient.on('end', () => {
  console.log('Redis client connection closed');
});

// Handle Ctrl+C (SIGINT) to close the Redis client gracefully
process.on('SIGINT', () => {
  console.log('Received SIGINT signal. Closing Redis client and exiting...');
  redisClient.quit(() => {
    console.log('Redis client closed.');
    process.exit();
  });
});
