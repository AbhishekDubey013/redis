const redis = require('redis');
const express = require('express');

const app = express();
const port = process.env.PORT || 3000;

const client = redis.createClient({
  url: process.env.REDIS_URL,
});

client.on('error', (err) => console.log('Redis Client Error', err));

app.use(express.json());

// Define a route handler for the root URL
app.get('/', (req, res) => {
  res.send('Redis service is running!');
});

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

app.get('/get-chat-data/:whatsappNumber', async (req, res) => {
  const { whatsappNumber } = req.params;

  // Get the conversation data from Redis
  await new Promise((resolve, reject) => {
    client.get(`conversation_${whatsappNumber}`, (err, data) => {
      if (err) {
        console.error('Error getting conversation from Redis:', err);
        reject(err);
      } else {
        resolve(data);
      }
    });
  })
    .then((data) => {
      if (data) {
        res.json(JSON.parse(data));
      } else {
        res.status(404).send('Conversation data not found.');
      }
    })
    .catch((err) => {
      res.status(500).send('Internal Server Error');
    });
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
