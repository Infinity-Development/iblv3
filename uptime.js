const ms = require('ms');
const BOTS = require('./models/bots');
const { MessageEmbed } = require('discord.js');

class UPTIME {
  constructor() {}

  async start(client, time = String) {
    setInterval(async () => {
      const bots = await BOTS.find({ type: 'approved' });
      bots.map(async (bot) => {
        let check_bot = await BOTS.findOne({
          botID: bot.botID,
          type: 'approved',
        });
        if (!check_bot) return;
        let fetch = await client.users.fetch(bot.botID);
        if (!fetch) return;
        else {
          if (fetch.presence.status !== 'offline') bot.uptime += 1;
          bot.total_uptime += 1;
          await bot.save();
          if (
            bot.total_uptime >= 30000 &&
            3888000000 <= Date.now() - bot.date
          ) {
            let precent = (bot.uptime / bot.total_uptime) * 100;
            if (precent.toFixed() <= 60 && !bot.premium) {
              let owner = await BOTS.find({
                main_owner: bot.main_owner,
                type: 'approved',
              });
              if (owner.length === 0) {
                client.guilds.cache
                  .get(client.config.guildID)
                  .members.cache.get(bot.main_owner)
                  .roles.remove(
                    client.guilds.cache
                      .get(client.config.guildID)
                      .roles.cache.get(client.config.developer),
                  )
                  .catch(() => {});
              }

              await bot.deleteOne();
              client.guilds.cache
                .get(client.config.guildID)
                .members.cache.get(bot.botID)
                .kick()
                .catch(() => {});
              let embed = new MessageEmbed()
                .setTitle('⛔️ Uptime Check Failed')
                .setThumbnail(client.user.displayAvatarURL())
                .setColor('RED')
                .setDescription(
                  'Woah, looks like a bot has failed to many of our Uptime Checks and has been removed from the list as a result!',
                )
                .addField('Bot', `${bot.botName} (${bot.botID})`, true)
                .addField('Owner', `<@!${bot.main_owner}>`, true)
                .addField(
                  'Why did this happen?',
                  `[README](https://guide.infinitybots.gg/docs/resources/downtime)`,
                  true,
                )
                .setTimestamp()
                .setFooter('NOTE: This is a automated system!');
              client.guilds.cache
                .get(client.config.guildID)
                .channels.cache.get(client.config.botLogs)
                .send(embed)
                .catch(() => {});

              let embed2 = new MessageEmbed()
                .setTitle('⛔️ Uptime Check Failed')
                .setThumbnail(client.user.displayAvatarURL())
                .setColor('RED')
                .setDescription(
                  'Your bot has been deleted for being offline for longer then 60% of its time listed with us!',
                )
                .addField('Bot', `${bot.botName} (${bot.botID})`, true)
                .addField('Owner', `<@!${bot.main_owner}>`, true)
                .addField(
                  'Why did this happen?',
                  `[README](https://guide.infinitybots.gg/docs/resources/downtime)`,
                  true,
                )
                .setTimestamp()
                .setFooter('NOTE: This is a automated system!');
              client.guilds.cache
                .get(client.config.guildID)
                .members.cache.get(bot.main_owner)
                .send(embed2)
                .catch(() => {});
            }
          }
        }
      });
    }, ms(time) || 15000);
  }
}

module.exports = UPTIME;
