const express = require('express');
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

// Create an Express app
const app = express();
const port = process.env.PORT || 3000; // Use the PORT environment variable or 3000 if not set

// Define a basic route to respond with "Hello, World!" for testing purposes
app.get('/', (req, res) => {
  res.send('Hello, World!');
});

// Start the HTTP server and listen on the specified port
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
