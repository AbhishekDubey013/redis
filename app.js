// const express = require('express');
// const { Client } = require('whatsapp-web.js');
// const qrcode = require('qrcode');
// const { Configuration, OpenAIApi } = require('openai');
// const redis = require('redis');
// require('dotenv').config();

// const app = express();
// const port = process.env.PORT || 3002;

// // Redis client to connect to the Redis server using REDIS_URL environment variable
// const redisClient = redis.createClient(process.env.REDIS_URL);

// redisClient.on('error', (err) => {
//   console.error('Redis client error:', err);
// });

// const client = new Client();
// let qrCodeImage = null;

// client.on('qr', (qr) => {
//   qrcode.toDataURL(qr, { errorCorrectionLevel: 'L' }, (err, url) => {
//     if (err) {
//       console.error('QR code generation failed:', err);
//     } else {
//       qrCodeImage = url;
//     }
//   });
// });

// client.on('ready', () => {
//   console.log('Client is ready');
// });

// const initializeClient = () => {
//   client.initialize();
// };

// // Rest of the code...

// // Start the server only after the Redis client is ready
// redisClient.on('ready', () => {
//   initializeClient();

//   const server = app.listen(port, () => {
//     console.log(`Server is running on http://localhost:${port}`);
//     // Log all data in Redis when the server is ready
//     logAllDataInRedis();
//   });

//   // Handle graceful shutdown
//   const shutdown = () => {
//     console.log('Closing Redis client and exiting...');
//     redisClient.quit(() => {
//       console.log('Redis client closed.');
//       server.close(() => {
//         console.log('Server closed.');
//         process.exit();
//       });
//     });
//   };

//   process.on('SIGINT', shutdown);
//   process.on('SIGTERM', shutdown);
// });



import { createClient } from 'redis';

(async () => {
  // Connect to your internal Redis instance using the REDIS_URL environment variable
  // The REDIS_URL is set to the internal Redis URL e.g. redis://red-343245ndffg023:6379
  const client = createClient({
      url: process.env.REDIS_URL
  });

  client.on('error', (err) => console.log('Redis Client Error', err));

  await client.connect();

  // Send and retrieve some values
  await client.set('key', 'node redis');
  const value = await client.get('key');

  console.log("found value: ", value)
})();
