const redis = require('redis');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

const sampleArray = ['item1', 'item2', 'item3', 'item4', 'item5'];

app.get('/', async (req, res) => {
  try {
    // Set the sample array data in Redis
    await client.set('sampleArray', JSON.stringify(sampleArray));

    // Get the array data from Redis
    const value = await client.get('sampleArray');
    const parsedValue = JSON.parse(value);

    console.log('Sample array data from Redis:', parsedValue);

    // Send the array data as the response
    res.json({ data: parsedValue });
  } catch (err) {
    console.error('Error fetching data from Redis:', err);
    res.status(500).send('Internal Server Error');
  }
});

const startServer = async () => {
  try {
    // Connect to Redis
    await client.connect();

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
