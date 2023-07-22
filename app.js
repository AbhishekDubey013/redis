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

// Wait for the Redis client to be ready before starting the server
redisClient.on('ready', () => {
  const client = new Client();
  let qrCodeImage = null;
  const conversations = new Map();

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

  client.initialize();

  const configuration = new Configuration({
    apiKey: process.env.SECRET_KEY,
  });
  const openai = new OpenAIApi(configuration);

  async function runCompletion(whatsappNumber, message) {
    // ... (Your existing code for the runCompletion function)
  }

  client.on('message', (message) => {
    // ... (Your existing code for handling incoming messages)
  });

  app.get('/', (req, res) => {
    if (qrCodeImage) {
      res.send(`<img src="${qrCodeImage}" alt="QR Code">`);
    } else {
      res.send('QR code image not available');
    }
  });

  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
    // Log all data in Redis when the server is ready
    logAllDataInRedis();
  });
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('Closing Redis client and exiting...');
  redisClient.quit(() => {
    process.exit();
  });
});
