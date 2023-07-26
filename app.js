const redis = require('redis');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

app.get('/', (req, res) => {
  // Store a value in Redis
  client.set('key', 'node redis', (err, reply) => {
    if (err) {
      console.error('Error setting value in Redis:', err);
      res.status(500).send('Error setting value in Redis');
      return;
    }

    // Retrieve the value from Redis
    client.get('key', (err, value) => {
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
  client.quit(() => {
    console.log('Redis client closed.');
    server.close(() => {
      console.log('Server closed.');
      process.exit();
    });
  });
};

process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);
