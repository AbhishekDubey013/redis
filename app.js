const express = require('express');
const { Client } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const { Configuration, OpenAIApi } = require('openai');
const redis = require('redis');
require('dotenv').config();

const app = express();
const port = process.env.PORT || 3002;

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

// Connect the Redis client
const redisClient = redis.createClient(process.env.REDIS_URL);

redisClient.on('error', (err) => {
  console.error('Redis client error:', err);
});

const configuration = new Configuration({
  apiKey: process.env.SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

async function runCompletion(whatsappNumber, message) {
  // Get the conversation history and context for the WhatsApp number
  const conversation = conversations.get(whatsappNumber) || { history: [], context: '' };
  
  // Store the latest message in the history and keep only the last 5 messages
  conversation.history.push(message);
  conversation.history = conversation.history.slice(-5);
  
  const context = conversation.history.join('\n');

  const completion = await openai.createCompletion({
    model: 'text-davinci-003',
    prompt: context,
    max_tokens: 200,
  });

  // Update the conversation context for the WhatsApp number
  conversation.context = completion.data.choices[0].text;
  conversations.set(whatsappNumber, conversation);

  return completion.data.choices[0].text;
}

client.on('message', (message) => {
  console.log(message.from, message.body);

  // Get the WhatsApp number from the message
  const whatsappNumber = message.from;

  // Process the message and send the response
  runCompletion(whatsappNumber, message.body).then((result) => {
    message.reply(result);
  });
});

// Start the Redis client and connect
redisClient.connect(async (err) => {
  if (err) {
    console.error('Error connecting to Redis:', err);
    return;
  }

  console.log('Connected to Redis');

  const dataArray = ['data1', 'data2', 'data3', 'data4', 'data5'];

  // Store the data from the array in Redis
  redisClient.set('dataArray', JSON.stringify(dataArray));

  // Start the server
  const server = app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
  });

  // Handle graceful shutdown
  const shutdown = async () => {
    console.log('Closing Redis client and exiting...');
    await redisClient.disconnect();
    console.log('Redis client closed.');
    server.close(() => {
      console.log('Server closed.');
      process.exit();
    });
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);
});
