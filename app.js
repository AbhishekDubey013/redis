const redis = require('redis');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

app.use(express.json());

app.post('/store-chat-data', async (req, res) => {
  const { whatsappNumber, conversation } = req.body;
  
  // Store the conversation data in Redis
  await new Promise((resolve, reject) => {
    client.set(`conversation_${whatsappNumber}`, JSON.stringify(conversation), (err) => {
      if (err) {
        console.error('Error setting conversation in Redis:', err);
        reject(err);
      } else {
        resolve();
      }
    });
  });

  res.sendStatus(200);
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

