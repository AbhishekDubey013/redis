const redis = require('redis');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

app.get('/', async (req, res) => {
  try {
    // Get the value from Redis
    const value = await client.get('key');
    console.log('Found value:', value);

    // Send the value as the response
    res.send(`Sample data from Redis: ${value}`);
  } catch (err) {
    console.error('Error fetching data from Redis:', err);
    res.status(500).send('Internal Server Error');
  }
});

const startServer = async () => {
  try {
    // Connect to Redis
    await client.connect();

    // Set a sample value in Redis
    await client.set('key', 'node redis');

    // Start the server
    const server = app.listen(port, () => {
      console.log(`Server is running on http://localhost:${port}`);
    });

    // Handle graceful shutdown
    const shutdown = async () => {
      console.log('Closing Redis client and exiting...');
      await client.disconnect();
      console.log('Redis client closed.');
      server.close(() => {
        console.log('Server closed.');
        process.exit();
      });
    };

    process.on('SIGINT', shutdown);
    process.on('SIGTERM', shutdown);
  } catch (err) {
    console.error('Error connecting to Redis:', err);
  }
};

startServer();
