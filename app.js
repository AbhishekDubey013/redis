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
redisClient.connect((err) => {
  if (err) {
    console.error('Error connecting to Redis:', err);
  } else {
    console.log('Connected to Redis');
  }
});

client.initialize();

const configuration = new Configuration({
  apiKey: process.env.SECRET_KEY,
});
const openai = new OpenAIApi(configuration);

async function runCompletion(whatsappNumber, message) {
  // Get the conversation history and context for the WhatsApp number from Redis
  redisClient.get(whatsappNumber, async (err, serializedData) => {
    if (err) {
      console.error('Error fetching conversation data from Redis:', err);
      return;
    }

    // Deserialize the conversation data from JSON
    const conversation = serializedData ? JSON.parse(serializedData) : { history: [], context: '' };

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

    // Serialize the conversation data and store it back in Redis
    redisClient.set(whatsappNumber, JSON.stringify(conversation));

    return completion.data.choices[0].text;
  });
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

app.get('/', (req, res) => {
  if (qrCodeImage) {
    res.send(`<img src="${qrCodeImage}" alt="QR Code">`);
  } else {
    res.send('QR code image not available');
  }
});

const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
