const express = require('express');
const redis = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3000;

// Redis client to connect to the Redis server using REDIS_URL environment variable (Render provides this variable)
const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

app.get('/', (req, res) => {
  // Store a value in Redis
  redisClient.set('myKey', 'Hello, Redis!', (err, reply) => {
    if (err) {
      console.error('Error setting value in Redis:', err);
      res.status(500).send('Error setting value in Redis');
      return;
    }

    // Retrieve the value from Redis
    redisClient.get('myKey', (err, value) => {
      if (err) {
        console.error('Error getting value from Redis:', err);
        res.status(500).send('Error getting value from Redis');
        return;
      }

      res.send(`Value from Redis: ${value}`);
    });
  });
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

// Handle graceful shutdown
const shutdown = () => {
  console.log('Closing Redis client and exiting...');
  redisClient.quit(() => {
    console.log('Redis client closed.');
    server.close(() => {
      console.log('Server closed.');
      process.exit();
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
