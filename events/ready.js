const { mongoose, connect } = require('mongoose');
const { readdirSync } = require('fs');
const { join } = require('path');
const filePath2 = join(__dirname, '..', 'events');
const eventFiles2 = readdirSync(filePath2);
const timers = require('timers');
const Discord = require('discord.js');
const { InfinityBots } = require('infinity-bots');

const Dashboard = require('../site/main');

const UPTIME = require('../uptime.js');

const WEBHOOK_ID = process.env.WEBHOOK_CLIENT;
const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const uptime_checker = new UPTIME();

const poster = new InfinityBots(
  'TOKEN_FOR_MBOT',
  'MBOT_ID',
);

module.exports = async (client) => {
  connect(
    client.config.mongodb_url,
    {
      family: 4,
      autoIndex: false,
      useNewUrlParser: true,
      useUnifiedTopology: true,
      connectTimeoutMS: 10000,
    },
    (err) => {
      if (err) return console.error(err);
      console.log('Database is Connected.');
    },
  );

  console.log(`${client.user.tag} is online.`);
  client.user.setActivity('infinitybots.gg', {
    type: 'WATCHING',
    status: 'online',
  });
  Dashboard(client);

  await poster
    .postBotStats({
      servers: '5000',
      shards: '20',
    })
    .catch(() => {});

  await poster
    .getBotInfo('815553000470478850')
    .then(() => console.log('Success'))
    .catch((e) => {
      console.log(e.message);
    });

  //uptime_checker.start(client, '4m');
};
