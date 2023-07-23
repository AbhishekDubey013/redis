const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { Configuration, OpenAIApi } = require('openai');
const redis = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

// Redis client to connect to the Redis server using REDIS_URL environment variable
const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

const client = new Client();
let qrCodeImage = null;

client.on('qr', (qr) => {
  qrcode.toDataURL(qr, { errorCorrectionLevel: 'L' }, (err, url) => {
    if (err) {
      console.error('QR code generation failed:', err);
    } else {
      qrCodeImage = url;
    }
  });
});

client.on('ready', () => {
  console.log('Client is ready');
});

const initializeClient = () => {
  client.initialize();
};

const runCompletion = async (whatsappNumber, message) => {
  // Rest of the code for runCompletion function...

  return completion.data.choices[0].text;
};

client.on('message', (message) => {
  console.log(message.from, message.body);

  // Get the WhatsApp number from the message
  const whatsappNumber = message.from;

  // Process the message and send the response
  runCompletion(whatsappNumber, message.body).then((result) => {
    message.reply(result);
  });
});

app.get('/', (req, res) => {
  if (qrCodeImage) {
    res.send(`<img src="${qrCodeImage}" alt="QR Code">`);
  } else {
    res.send('QR code image not available');
  }
});

// Helper function to log all data in Redis
function logAllDataInRedis() {
  redisClient.keys('*', (err, keys) => {
    if (err) {
      console.error('Error fetching keys from Redis:', err);
      return;
    }

    keys.forEach((key) => {
      redisClient.get(key, (err, value) => {
        if (err) {
          console.error(`Error fetching value for key '${key}' from Redis:`, err);
          return;
        }

        console.log(`Key: ${key}, Value: ${value}`);
      });
    });
  });
}

// Start the server only after the Redis client is ready
const startServer = async () => {
  await new Promise((resolve) => {
    redisClient.on('ready', () => {
      console.log('Redis client is ready');
      resolve();
    });
  });

  initializeClient();

  // Check if the server is already running on the specified port
  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    // Log all data in Redis when the server is ready
    logAllDataInRedis();
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
};

startServer();
