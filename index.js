require('dotenv').config();

const { Client, Collection } = require('discord.js');
const mongoose = require('mongoose');
const config = require('./config.js');
const client = new Client({
  disableEveryone: true,
  disabledEvents: ['TYPING_START'],
  restTimeOffset: 0,
});
const events = require('./structures/event');

mongoose.connection.on('connected', () => {
  console.log(
    '[IBL-Mongo-Logger] - Connected to the Database Successfully with no Errors!',
  );
});
mongoose.connection.on('err', () => {
  console.log(
    `[IBL-Mongo-Logger] - Mongoose Connection Error:\n Stack: ${error.stack}`,
    'error',
  );
});
mongoose.connection.on('disconnected', () => {
  console.log('[IBL-Mongo-Logger] - Mongoose has been Disconnected!');
});

client.limits = new Map();
client.config = config;
events.run(client);

client.login(config.token);
