// Express
const express = require('express');
const app = express();

// Other Imports
const { WebhookClient, Permissions, MessageEmbed } = require('discord.js');
const ms = require('ms');
const ejs = require('ejs');
const url = require('url');
const path = require('path');
const url2 = require('is-url');
const request = require('node-fetch');
const passport = require('passport');
const showdown = require('showdown');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const paypal = require('paypal-rest-sdk');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const MongoStore = require('connect-mongo')(session);
const Strategy = require('passport-discord').Strategy;
const { registerFont } = require('canvas');
const { Canvas, resolveImage } = require('canvas-constructor');
const config = require('../config');
const { post } = require('snekfetch');
const morgan = require('morgan');
const flash = require('connect-flash');
const toastr = require('express-toastr');
const Snackbar = require('node-snackbar');
var validator = require('validator');
const isURL = require('validator/lib/isURL');
const Swal = require('sweetalert2');

const BOTS = require('../models/bots');
const USERS = require('../models/users');
const REVS = require('../models/reviews');
const PACKS = require('../models/pack');
const VOTES = require('../models/votes');

var http = require('http');
var https = require('https');
http.globalAgent.maxSockets = Infinity;
https.globalAgent.maxSockets = Infinity;

//const redis = require('./redis');

const {
  generate_token,
  is_staff,
  is_admin,
  is_root,
  is_url,
  formatNumbers,
} = require('../functions');

const converter = new showdown.Converter();
converter.setOption('tables', 'true');

const limits = new Map();
const payments = new Map();

// We export the dashboard as a function which we call in ready event.
module.exports = async (client) => {
  app.set('client', client);
  app.set('view cache', true);
  app.use(toastr());
  app.use(flash());
  // PayPal Config
  paypal.configure({
    mode: 'live',
    client_id: client.config.client_id,
    client_secret: client.config.client_secret,
  });

  //functions
  let domain = client.config.domain;
  let staff_role = await client.guilds.cache
    .get(client.config.guildID)
    .roles.cache.get(config.staff);
  async function send_botlogs(message) {
    if (!message) throw new Error('Please define message to send');
    await client.guilds.cache
      .get(client.config.guildID)
      .channels.cache.get(client.config.botLogs)
      .send(message);
  }

  async function send_modlogs(message) {
    if (!message) throw new Error('Please define message to send');
    await client.guilds.cache
      .get(client.config.guildID)
      .channels.cache.get(client.config.modLogs)
      .send(message);
  }

  async function send_stafflogs(message) {
    if (!message) throw new Error('Please define message to send');
    await client.guilds.cache
      .get(client.config.staffGuild)
      .channels.cache.get(client.config.staff_botLogs)
      .send(message);
  }

  async function add_role(member, role) {
    if (!member) throw new Error('Please define member');
    if (!role) throw new Error('Please define role');
    let the_role = await client.guilds.cache
      .get(client.config.guildID)
      .roles.cache.get(role);
    let user = await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(member);
    if (!the_role) throw new Error("Couldn't find role");
    if (user) await user.roles.add(the_role);
  }
  async function remove_role(member, role) {
    if (!member) throw new Error('Please define member');
    if (!role) throw new Error('Please define role');
    let the_role = await client.guilds.cache
      .get(client.config.guildID)
      .roles.cache.get(role);
    let user = await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(member);
    if (!the_role) throw new Error("Couldn't find role");
    if (user) await user.roles.remove(the_role);
  }
  function fix_invite(botID, invite) {
    let original = `https://discord.com/oauth2/authorize?client_id=${
      botID || 123456789
    }&permissions=0&scope=bot`;
    if (invite && botID) {
      if (invite == '') return original;
      if (invite.includes('permissions=')) {
        let check = new Permissions(
          Math.abs(
            invite
              .split('permissions=')[1]
              .split('&scope=bot')
              .toString()
              .split(',')
              .join(''),
          ) || 8,
        )
          .toArray()
          .includes('ADMINISTRATOR');
        if (check) return original;
        else return invite;
      } else return original;
    } else return original;
  }
  async function check(member) {
    if (!member) throw new Error('Please define member');
    return (await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(member))
      ? true
      : false;
  }
  async function kick(member) {
    if (!member) throw new Error('Please define member');
    let user = await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(member);
    if (user) await user.kick().catch(() => {});
  }
  function send_votelogs(message) {
    if (!message) throw new Error('Please define message to send');
    client.guilds.cache
      .get(client.config.guildID)
      .channels.cache.get(client.config.voteLogs)
      .send(message);
  }
  async function send_dm(member, message) {
    if (!message) throw new Error('Please define message to send');
    if (!member) throw new Error('Please define member to send');
    let user = await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(member);
    if (user) await user.send(message).catch(() => {});
  }
  async function new_user(id) {
    let user = await client.users.fetch(id).catch(() => {});
    if (!user) return false;
    if (user.bot) return false;
    let check = await USERS.findOne({ userID: id });
    let bots = await BOTS.find({ main_owner: id, type: 'approved' });
    let bots2 = await BOTS.find({
      main_owner: id,
      type: 'approved',
      certified: true,
    });
    let bots3 = await BOTS.find({ additional_owners: id, type: 'approved' });
    let bots4 = await BOTS.find({
      additional_owners: id,
      type: 'approved',
      certified: true,
    });
    let is_dev = bots.length > 0 ? true : bots3.length > 0 ? true : false;
    let is_certified =
      bots2.length > 0 ? true : bots4.length > 0 ? true : false;
    if (!check) {
      return await new USERS({
        userID: id,
        staff: is_staff(id),
        developer: is_dev,
        certified: is_certified,
      }).save();
    } else {
      check.developer = is_dev;
      check.certified = is_certified;
      check.staff = is_staff(id);
      check.admin = is_admin(id);
      await check.save();
      return check;
    }
  }
  async function votes_fix() {
    let users = await USERS.find({});
    await users.map(async (user) => {
      for (let bot of user.votes.keys()) {
        let check = await BOTS.findOne({ botID: bot });
        if (!check) await user.votes.delete(bot);
        await user.save();
      }
    });
  }
  async function pack_votes_fix() {
    let users = await USERS.find({});
    await users.map(async (user) => {
      for (let pack of user.pack_votes.keys()) {
        let check = await PACKS.findOne({ name: pack });
        if (!check) await user.pack_votes.delete(pack);
        await user.save();
      }
    });
  }
  async function reviews_fix(ID) {
    let bot = await BOTS.findOne({ botID: ID });
    if (!bot) {
      let reviews = await REVS.find({ botID: ID });
      reviews.map(async (review) => {
        await review.deleteOne();
      });
    }
  }
  async function roles_fix(member) {
    if (member) {
      let user = client.users.fetch(member).catch(() => {});
      if (user) {
        let bots = await BOTS.find({ main_owner: member, type: 'approved' });
        let bots2 = await BOTS.find({
          main_owner: member,
          type: 'approved',
          certified: true,
        });
        if (bots.length === 0) remove_role(member, client.config.developer);
        else add_role(member, client.config.developer);
        if (bots2.length === 0)
          remove_role(member, client.config.certified_dev);
        else add_role(member, client.config.certified_dev);
      }
    }
  }

  // We declare absolute paths.
  app.use('/static', express.static(path.join(__dirname, 'public'))); // Css & Scripts directory
  app.use('/images', express.static(path.join(__dirname, 'images')));
  app.use(
    '/sitemap.xml',
    express.static(path.join(__dirname, 'public/assets/others/sitemap.xml')),
  ); // Sitemap
  app.use(
    '/robots.txt',
    express.static(path.join(__dirname, 'public/assets/others/robots.txt')),
  ); // Robots txt
  app.use(
    '/ads.txt',
    express.static(path.join(__dirname, 'public/assets/others/ads.txt')),
  ); // ADS txt

  const dataDir = path.resolve(`${process.cwd()}${path.sep}site`); // The absolute path of current this directory.
  const templateDir = path.resolve(`${dataDir}${path.sep}src/dynamic`); // Absolute path of ./src directory.
  // Deserializing and serializing users without any additional logic.
  passport.serializeUser((user, done) => done(null, user));
  passport.deserializeUser((obj, done) => done(null, obj));

  // We set the passport to use a new discord strategy, we pass in client id, secret, callback url and the scopes.
  /** Scopes:
   *  - Identify: Avatar's url, username and discriminator.
   *  - Guilds: A list of partial guilds.
   */
  passport.use(
    new Strategy(
      {
        clientID: config.id,
        clientSecret: config.clientSecret,
        callbackURL: `${config.domain}/callback`,
        scope: ['identify'],
      },
      (accessToken, refreshToken, profile, done) => {
        // eslint-disable-line no-unused-vars
        // On login we pass in profile with no logic.
        process.nextTick(() => done(null, profile));
      },
    ),
  );

  // We initialize the memorystore middleware with our express app.
  app.use(
    session({
      proxy: true,
      cookie: {
        secure: true,
        httpOnly: true,
        maxAge: require('ms')('10 years'),
      },
      store: new MongoStore({ mongooseConnection: mongoose.connection }),
      secret:
        'tJ86eaYwQqekKCfkgbPa6H5C8dhrJa9yMsYFBSQAdkPVt3EK4s2A77u7DgEngdtAeaN4WvcP5FjpfPUr5KbbxGHCxLhumfFqkpLB',
      resave: false,
      saveUninitialized: false,
    }),
  );

  // We initialize passport middleware.
  app.use(passport.initialize());
  app.use(passport.session());
  app.use(cookieParser());

  // Compress All Data
  app.use(require('compression')());

  // Log Requests
  app.use(
    morgan(
      '[:date[web]] :method  - :url - HTTP/:http-version  - :status - :user-agent - :response-time ms',
      {},
    ),
  );

  // Helmet
  const helmet = require('helmet');
  app.use(helmet.xssFilter());
  app.use(helmet.hidePoweredBy());

  // XSS
  const xss = require('xss-clean');
  app.use(xss());

  // Mongo Sanatization
  const mongoSanitize = require('express-mongo-sanitize');
  app.use(mongoSanitize());

  // We bind the domain.
  app.locals.domain = config.domain.split('//')[1];

  // We set out templating engine.
  app.engine('html', ejs.renderFile);
  app.set('view engine', 'html');

  // We initialize body-parser middleware to be able to read forms.
  app.use(bodyParser.json());
  app.use(bodyParser.urlencoded({ extended: true }));
  // We declare a renderTemplate function to make rendering of a template in a route as easy as possible.
  const renderPage = async (res, req, template, data = {}) => {
    // Default base data which passed to the ejs template by default.
    const baseData = {
      bot: client,
      config: config,
      req: req,
      res: res,
      path: req.path,
      toastr: req.toastr.render(),
      theme: req.cookies.theme,
      success: res.locals.success,
      warning: res.locals.warn,
      error: res.locals.error,
      user: req.isAuthenticated()
        ? await client.users.fetch(req.user.id)
        : null,
      headerPath: `${dataDir}${path.sep}src/partials/header`,
      footerPath: `${dataDir}${path.sep}src/partials/footer`,
      snowPath: `${dataDir}${path.sep}src/partials/snow`,
      iblAlert: `${dataDir}${path.sep}src/partials/messages`,
      dynamic: `${dataDir}${path.sep}src/dynamic`,
      formatNumbers,
    };
    // Check if maintenance mode is enabled and render page if it is
    if (config.maintenance) {
      res.status(503).render(
        path.resolve(`${templateDir}${path.sep}/status/503.ejs`),
        Object.assign(
          baseData,
          {
            status: 503,
            body: 'We are working on something big, stay tuned!',
          },
          data,
        ),
      );
    } else {
      // We render template using the absolute path of the template and the merged default data with the additional data provided.
      res.render(
        path.resolve(`${templateDir}${path.sep}${template}`),
        Object.assign(baseData, data),
      );
    }
  };

  // We declare a checkAuth function middleware to check if an user is logged in or not, and if not redirect him.
  const checkAuth = async (req, res, next) => {
    // If authenticated we forward the request further in the route.
    if (req.isAuthenticated()) return next();
    // If not authenticated, we set the url the user is redirected to into the memory.
    req.session.backURL = req.url;
    // We redirect user to login endpoint/route.
    res.redirect('/login');
  };
  const found = (req, res) => {
    renderPage(res, req, '/status/404.ejs');
  };
  const new_page = (
    req,
    res,
    { title_text = null, small_text = null, big_text = null },
  ) => {
    renderPage(res, req, '/status/news.ejs', {
      title_text,
      small_text,
      big_text,
    });
  };

  // Login endpoint.
  app.get('/login', (req, res, next) => {
    return renderPage(res, req, '/redirects/login.ejs');
  });

  // Callback endpoint.
  app.get(
    '/callback',
    passport.authenticate('discord', { failureRedirect: '/', prompt: 'none' }),
    async (req, res) => {
      const list = await client.guilds.cache.get(config.guildID).fetchBans();
      const auth_log = await client.guilds.cache
        .get('915000865537007686')
        .channels.cache.get('915000866648494095');

      if (req.isAuthenticated() && list.has(req.user.id) == true) {
        let ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;

        await client.users.fetch(req.user.id).then(async (u) => {
          const banned = new MessageEmbed()
            .setTitle('**__Website Ban Check:__**')
            .setThumbnail(u.avatarURL({ dynamic: true }))
            .setColor('#d40dfc')
            .setDescription(
              `[**${u.username}**#${u.discriminator}](https://infinitybotlist.com/users/${u.id}) Attempted to login to the site but has been Blocked or Banned.`,
            )
            .addField('Username:', u.username)
            .addField('User ID:', u.id)
            .addField('User Discriminator:', u.discriminator)
            .addField('User Remote Address:', `|| ${ip} ||`)
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

          await auth_log.send(banned);
        });

        req.session.destroy(() => {
          req.logout();

          return renderPage(res, req, '/status/banned.ejs');
        });
      } else {
        if (req.session.backURL) {
          const url = req.session.backURL;

          req.session.backURL = null;

          res.redirect(url);

          await client.users.fetch(req.user.id).then(async (u) => {
            const success1 = new MessageEmbed()
              .setTitle('**__Website Ban Check:__**')
              .setThumbnail(u.avatarURL({ dynamic: true }))
              .setColor('#d40dfc')
              .setDescription(
                `[**${u.username}**#${u.discriminator}](https://infinitybotlist.com/users/${u.id}) logged into the site with no Errors.`,
              )
              .addField('Username:', u.username)
              .addField('User ID:', u.id)
              .addField('Back URL', `${url}`)
              .setTimestamp()
              .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

            await auth_log.send(success1);
          });
        } else {
          res.redirect('/');

          await client.users.fetch(req.user.id).then(async (u) => {
            const success2 = new MessageEmbed()
              .setTitle('**__Website Ban Check:__**')
              .setThumbnail(u.avatarURL({ dynamic: true }))
              .setColor('#d40dfc')
              .setDescription(
                `[**${u.username}**#${u.discriminator}](https://infinitybotlist.com/users/${u.id}) logged into the site with no Errors.`,
              )
              .addField('Username:', u.username)
              .addField('User ID:', u.id)
              .addField('Back URL', '`NULL - NONE`')
              .setTimestamp()
              .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

            await auth_log.send(success2);
          });
        }
      }
    },
  );

  // Logout endpoint.
  app.get('/logout', function (req, res) {
    // We destroy the session.
    req.session.destroy(() => {
      // We logout the user.
      req.logout();
      // We redirect user to index.
      res.redirect('/');
    });
  });

  /**
   * ABOUT US PAGE ROUTE
   */
  app.get('/about', async (req, res) => {
    let check_all = await USERS.find({ staff: true });
    config.team.map(async (member) => {
      await client.users.fetch(member);
      await new_user(member);
    });
    check_all.map(async (user) => {
      await new_user(user.userID);
    });
    let staffArray = [];
    config.team.forEach(async (staff) => {
      let staff2 = await USERS.findOne({ userID: staff, staff: true });

      staffArray.push({
        staffMember: staff,
        staffData: staff2,
      });
    });
    staffArray.sort((a, b) => (a === b ? 0 : a ? -1 : 1));
    let members = await USERS.find({ staff: true });
    let certUser = await USERS.find({ certified: true });
    renderPage(res, req, 'about.ejs', {
      alert: null,
      error: null,
      staffMembers: staffArray,
      members,
      certUser,
    });
  });

  app.get('/api/bots/:botID/data', async (req, res) => {
    let bot = await BOTS.findOne({ botID: req.params.botID });
    if (!bot) bot = await BOTS.findOne({ vanity: req.params.botID });
    if (bot) {
      res.status(200).json(
        JSON.stringify({
          bot_name: bot.botName,
          certified: bot.certified,
          tags: bot.tags,
          prefix: bot.prefix,
          owner: client.users.cache.get(bot.main_owner)
            ? client.users.cache.get(bot.main_owner).username
            : bot.main_owner,
          library: bot.library,
          short_desc: bot.short,
          servers: formatNumbers(bot.servers),
          shards: formatNumbers(bot.shards),
          votes: formatNumbers(bot.votes),
          invites: formatNumbers(bot.invite_clicks),
          website: bot.website,
          donate: bot.donate,
          support: bot.support,
          staff: bot.staff,
          premium: bot.premium,
          nsfw: bot.nsfw,
          banner: bot.background,
          error: false,
        }),
      );
    } else
      res.status(400).json(
        JSON.stringify({
          error: true,
          message: "Couldn't find bot or maybe it's awaiting verification.",
        }),
      );
  });

  // main page
  let packs = await PACKS.find({}).sort([['votes', 'descending']]);
  let bots = await BOTS.find({ type: 'approved' });
  let premiums = await BOTS.find({ type: 'approved', premium: true });
  let votes_bots = await BOTS.find({ type: 'approved' }).sort([
    ['votes', 'descending'],
  ]);
  let certified_bots = await BOTS.find({
    type: 'approved',
    certified: true,
  }).sort([['votes', 'descending']]);
  let new_bots = await BOTS.find({ type: 'approved' }).sort([
    ['date', 'descending'],
  ]);
  let view_bots = await BOTS.find({ type: 'approved' }).sort([
    ['clicks', 'descending'],
  ]);
  let premium_bots =
    premiums.length >= 5
      ? await BOTS.find({ type: 'approved', premium: true })
          .limit(5)
          .skip(Math.floor(Math.random() * premiums.length))
      : await BOTS.find({ type: 'approved', premium: true });
  async function restart() {
    packs = await PACKS.find({}).sort([['votes', 'descending']]);
    votes_bots = await BOTS.find({ type: 'approved' }).sort([
      ['votes', 'descending'],
    ]);
    certified_bots = await BOTS.find({
      type: 'approved',
      certified: true,
    }).sort([['votes', 'descending']]);
    new_bots = await BOTS.find({ type: 'approved' }).sort([
      ['date', 'descending'],
    ]);
    view_bots = await BOTS.find({ type: 'approved' }).sort([
      ['clicks', 'descending'],
    ]);
  }
  async function prem_restart() {
    premium_bots =
      premiums.length >= 5
        ? await BOTS.find({ type: 'approved', premium: true })
            .limit(5)
            .skip(Math.floor(Math.random() * premiums.length))
        : await BOTS.find({ type: 'approved', premium: true });
  }
  app.get('/', (req, res) => {
    prem_restart();
    restart();
    renderPage(res, req, 'index.ejs', {
      votes_bots,
      new_bots,
      certified_bots,
      premium_bots,
      packs,
      view_bots,
    });
  });

  // discord server invite
  app.get('/discord', (req, res) => {
    renderPage(res, req, '/redirects/discord.ejs');
  });

  // discord server invite
  app.get('/join', (req, res) => {
    renderPage(res, req, '/redirects/discord.ejs');
  });

  // testing server invite
  app.get('/testing/server', (req, res) => {
    renderPage(res, req, '/redirects/testing.ejs');
  });

  // staff server invite
  app.get('/staff/server', (req, res) => {
    renderPage(res, req, '/redirects/staff.ejs');
  });

  //add bot
  app.get('/bots/add', checkAuth, async (req, res) => {
    let memberCheck = await client.guilds.cache
      .get(client.config.guildID)
      .members.cache.get(req.user.id);

    renderPage(res, req, '/actions/add.ejs', {
      alert: null,
      error: null,
      memberCheck,
    });
  });

  //add bot package
  app.get('/packs/add', checkAuth, (req, res) => {
    renderPage(res, req, '/actions/create_pack.ejs', {
      alert: null,
      error: null,
    });
  });

  // Statistics Page
  app.get('/stats', async (req, res) => {
    let currentUptime;

    let currentdate = new Date().toLocaleDateString();

    var milliseconds = parseInt((client.uptime % 1000) / 100),
      seconds = parseInt((client.uptime / 1000) % 60),
      minutes = parseInt((client.uptime / (1000 * 60)) % 60),
      hours = parseInt((client.uptime / (1000 * 60 * 60)) % 24);

    hours = hours < 10 ? '0' + hours : hours;
    minutes = minutes < 10 ? '0' + minutes : minutes;
    seconds = seconds < 10 ? '0' + seconds : seconds;

    currentUptime = `${hours} Hours, ${minutes} Minutes, ${seconds} Seconds`;

    const currentPing = client.ws.ping;

    let approved = await BOTS.find({ type: 'approved' }, { _id: false });
    let denied = await BOTS.find({ type: 'denied' }, { _id: false });
    let queue = await BOTS.find({ type: 'pending' }, { _id: false });

    let data = {
      approvedBots: approved.length,
      deniedBots: denied.length,
      botsInQueue: queue.length,
      ping: currentPing,
      uptime: currentUptime,
    };

    renderPage(res, req, 'stats.ejs', data);
  });

  // transfer bot
  app.get('/profile/transfer', checkAuth, async (req, res) => {
    let bots = await BOTS.find({ main_owner: req.user.id, type: 'approved' });
    renderPage(res, req, '/actions/transfer.ejs', {
      alert: null,
      error: null,
      bots,
    });
  });

  // certification system
  app.get('/bots/certification', checkAuth, async (req, res) => {
    let bots = await BOTS.find({
      main_owner: req.user.id,
      type: 'approved',
      pending_cert: false,
      certified: false,
    });
    renderPage(res, req, '/actions/certification.ejs', {
      alert: null,
      error: null,
      bots,
    });
  });

  // terms of service & privacy policy
  app.get('/terms', (req, res) => {
    renderPage(res, req, '/status/terms.ejs');
  });

  // Privacy Policy Direct
  app.get('/privacy', (req, res) => {
    renderPage(res, req, '/status/privacy.ejs');
  });

  app.get('/license', (req, res) => {
    renderPage(res, req, '/status/license.ejs');
  });

  // our bot list partners
  app.get('/partners', (req, res) => {
    renderPage(res, req, '/status/partners.ejs');
  });

  // premium system
  app.get('/premium', checkAuth, async (req, res) => {
    let bots = await BOTS.find({ main_owner: req.user.id });
    let bots2 = await BOTS.find({ additional_owners: req.user.id });
    renderPage(res, req, '/actions/premium.ejs', {
      alert: null,
      error: null,
      bots,
      bots2,
    });
  });

  // widget
  app.get('/bots/:id/widget', async (req, res) => {
    res.setHeader('mime-type', 'png/image');
    res.setHeader('Content-Type', 'image/png');

    let bot = await BOTS.findOne({ botID: req.params.id });
    if (!bot)
      bot = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bot) return found(req, res);
    try {
      registerFont(
        path.join(
          __dirname,
          'public/assets/fonts/quicksand/static/Quicksand-Bold.ttf',
        ),
        { family: 'Quicksand' },
      );
      let fetch = await client.users.fetch(bot.botID).catch(() => {});
      let owner = await client.users.fetch(bot.main_owner).catch(() => {});
      let bot_avatar = decodeURIComponent(
        fetch.displayAvatarURL().replace('/avatar/?avatar=', ''),
      )
        .replace('.png', '.png?size=512')
        .replace('.webp', '.png?size=512');
      let avatar = await resolveImage(bot_avatar);
      let icon = await resolveImage('https://i.imgur.com/x0LCfAh.png');
      let image;
      if (req.query.size == 'large') {
        image = new Canvas(400, 240)
          .setColor('#16151D')
          .printRoundedRectangle(0, 0, 400, 240, 10)
          .setTextAlign('left')
          .setTextFont('28px Quicksand')
          .setColor('#252330')
          .printRoundedRectangle(0, 215, 400, 25, 5)
          .printRoundedRectangle(0, 0, 400, 40, 10)
          .printRoundedRectangle(10, 180, 185, 25, 10)
          .printRoundedRectangle(207, 180, 185, 25, 10)
          .printRoundedRectangle(10, 150, 185, 25, 10)
          .printRoundedRectangle(207, 150, 185, 25, 10)
          .printRoundedRectangle(10, 120, 185, 25, 10)
          .printRoundedRectangle(207, 120, 185, 25, 10)
          .setColor('#fff')
          .setTextSize(12)
          .printText(client.user.username, 165, 230)
          .setTextSize(15)
          .printText(
            `${bot.servers === 0 ? 'N/A' : formatNumbers(bot.servers)} SERVERS`,
            20,
            197,
          )
          .printText(
            `${bot.shards === 0 ? 'N/A' : formatNumbers(bot.shards)} SHARDS`,
            217,
            197,
          )
          .printText(`${fetch.presence.status.toUpperCase()}`, 20, 167)
          .printText(
            `${bot.votes === 0 ? 0 : formatNumbers(bot.votes)} VOTES`,
            217,
            167,
          )
          .printText(
            `${
              owner.username.length > 12
                ? owner.username.slice(0, 12) + '...'
                : owner.username
            }#${owner.discriminator}`,
            20,
            137,
          )
          .printText(`${bot.library}`, 217, 137)
          .setTextSize(17)
          .printWrappedText(bot.short, 20, 60, 350, 15)
          .setTextSize(20)
          .printText(
            client.users.cache.get(bots.botID)
              ? client.users.cache.get(bots.botID).username.length > 25
                ? client.users.cache.get(bots.botID).username.slice(0, 25) +
                  '...'
                : client.users.cache.get(bots.botID).username
              : bot.botName.length > 25
              ? bot.botName.slice(0, 25) + '...'
              : bot.botName,
            40,
            25,
          )
          .printCircularImage(avatar, 20, 20, 15, 10, 5, true)
          .printCircularImage(icon, 148, 227, 10, 10, 5, true);
        if (bot.certified) {
          image.setTextFont('8px Quicksand').printText('CERTIFIED', 40, 35);
        }
      } else if (req.query.size == 'small') {
        image = new Canvas(400, 140)
          .setColor('#16151D')
          .printRoundedRectangle(0, 0, 400, 150, 10)
          .setTextAlign('left')
          .setTextFont('28px Quicksand')
          .setColor('#252330')
          .printRoundedRectangle(0, 115, 400, 25, 5)
          .printRoundedRectangle(0, 0, 400, 40, 10)
          .printRoundedRectangle(10, 50, 185, 25, 10)
          .printRoundedRectangle(207, 50, 185, 25, 10)
          .printRoundedRectangle(10, 80, 185, 25, 10)
          .printRoundedRectangle(207, 80, 185, 25, 10)
          .setColor('#fff')
          .setTextSize(12)
          .printText(client.user.username, 165, 130)
          .setTextSize(15)
          .printText(
            `${bot.servers === 0 ? 'N/A' : formatNumbers(bot.servers)} SERVERS`,
            20,
            67,
          )
          .printText(
            `${bot.shards === 0 ? 'N/A' : formatNumbers(bot.shards)} SHARDS`,
            217,
            67,
          )
          .printText(`${fetch.presence.status.toUpperCase()}`, 20, 97)
          .printText(
            `${bot.votes === 0 ? 0 : formatNumbers(bot.votes)} VOTES`,
            217,
            97,
          )
          .setTextSize(20)
          .printText(
            client.users.cache.get(bots.botID)
              ? client.users.cache.get(bots.botID).username.length > 25
                ? client.users.cache.get(bots.botID).username.slice(0, 25) +
                  '...'
                : client.users.cache.get(bots.botID).username
              : bot.botName.length > 25
              ? bot.botName.slice(0, 25) + '...'
              : bot.botName,
            40,
            25,
          )
          .printCircularImage(avatar, 20, 20, 15, 10, 5, true)
          .printCircularImage(icon, 148, 127, 10, 10, 5, true);
        if (bot.certified) {
          image.setTextFont('8px Quicksand').printText('CERTIFIED', 40, 35);
        }
      } else {
        image = new Canvas(400, 180)
          .setColor('#16151D')
          .printRoundedRectangle(0, 0, 400, 180, 10)
          .setTextAlign('left')
          .setTextFont('28px Quicksand')
          .setColor('#252330')
          .printRoundedRectangle(0, 155, 400, 25, 5)
          .printRoundedRectangle(0, 0, 400, 40, 10)
          .printRoundedRectangle(10, 120, 185, 25, 10)
          .printRoundedRectangle(207, 120, 185, 25, 10)
          .printRoundedRectangle(10, 90, 185, 25, 10)
          .printRoundedRectangle(207, 90, 185, 25, 10)
          .setColor('#fff')
          .setTextSize(12)
          .printText(client.user.username, 165, 170)
          .setTextSize(15)
          .printText(
            `${bot.servers === 0 ? 'N/A' : formatNumbers(bot.servers)} SERVERS`,
            20,
            137,
          )
          .printText(
            `${bot.shards === 0 ? 'N/A' : formatNumbers(bot.shards)} SHARDS`,
            217,
            137,
          )
          .printText(`${fetch.presence.status.toUpperCase()}`, 20, 107)
          .printText(
            `${bot.votes === 0 ? 0 : formatNumbers(bot.votes)} VOTES`,
            217,
            107,
          )
          .setTextSize(17)
          .printWrappedText(
            bot.short.length > 75 ? bot.short.slice(0, 75) + '...' : bot.short,
            20,
            60,
            350,
            15,
          )
          .setTextSize(20)
          .printText(
            client.users.cache.get(bots.botID)
              ? client.users.cache.get(bots.botID).username.length > 25
                ? client.users.cache.get(bots.botID).username.slice(0, 25) +
                  '...'
                : client.users.cache.get(bots.botID).username
              : bot.botName.length > 25
              ? bot.botName.slice(0, 25) + '...'
              : bot.botName,
            40,
            25,
          )
          .printCircularImage(avatar, 20, 20, 15, 10, 5, true)
          .printCircularImage(icon, 148, 167, 10, 10, 5, true);
        if (bot.certified) {
          image.setTextFont('8px Quicksand').printText('CERTIFIED', 40, 35);
        }
      }
      res.writeHead(200, { 'Content-Type': 'image/png' });
      res.end(await image.toBuffer(), 'binary');
    } catch (e) {
      console.log(e);
      await new_page(req, res, {
        title_text: 'Server Error',
        big_text: 500,
        small_text: 'Internal Server Error',
      });
    }
  });

  // bot page
  app.get('/bots/:id', async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });

    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    let owners = [bots.main_owner];
    bots.additional_owners.map((owner) => owners.push(owner));

    if (
      (req.user && is_staff(req.user.id)) ||
      (req.user && owners.includes(req.user.id))
    ) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots)
        bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }

    let reviews = await REVS.find({ botID: bots.botID }).sort([
      ['date', 'descending'],
    ]);
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    let getAverage = (array) => {
      if (array.length === 0) return 5;
      let popularitySum = 0;
      let itemsFound = 0;
      let len = array.length;
      let item = null;
      for (let i = 0; i < len; ++i) {
        item = array[i];
        popularitySum = parseInt(item.star_rate) + popularitySum;
        itemsFound = itemsFound + 1;
      }
      const averagePopularity = popularitySum / itemsFound;

      return averagePopularity;
    };
    let time = (time) => {
      return require('ms')(Date.now() - time, { long: true });
    };
    var announce_msg = converter.makeHtml(bots.announce_msg);
    var desc;
    let isUrl = url2(bots.long.replace('\n', '').replace(' ', ''));
    if (isUrl)
      desc = `<iframe src="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"><object data="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"><embed src="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"> </embed>${bots.long
        .replace('\n', '')
        .replace(' ', '')}</object></iframe>`;
    else if (bots.long) desc = converter.makeHtml(bots.long);
    else desc = bots.long;
    for (i = 0; i < owners.length; ++i) {
      await client.users.fetch(owners[i]).catch(() => {});
    }
    for (i = 0; i < reviews.length; ++i) {
      await client.users.fetch(reviews[i].author).catch(() => {});
    }
    bots.clicks = bots.clicks - +-1;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!bots.unique_clicks.includes(ip)) bots.unique_clicks.push(ip);
    await bots.save();

    renderPage(res, req, '/bots/botpage.ejs', {
      bots,
      owners,
      time,
      fetch,
      getAverage,
      desc,
      announce_msg,
      reviews,
      isUrl,
      alert: null,
      error: null,
    });
  });

  // analytics bot page
  app.get('/bots/:id/analytics', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
    if (!bots) return found(req, res);
    let owners = [bots.main_owner];
    bots.additional_owners.map((owner) => owners.push(owner));
    if (!owners.includes(req.user.id) || !is_staff(req.user.id))
      return found(req, res);

    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    let time = (time) => {
      return require('ms')(Date.now() - time, { long: true });
    };
    bots.clicks += 1;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!bots.unique_clicks.includes(ip)) bots.unique_clicks.push(ip);
    await bots.save();
    renderPage(res, req, '/actions/analytics.ejs', {
      bots,
      time,
      fetch,
      alert: null,
      error: null,
    });
  });

  app.get('/panel/queue/claim/:botID', checkAuth, async (req, res) => {
    if (is_staff(req.user.id)) return found(req, res);
    let claimBot = BOTS.findOne({ botID: req.params.botID });

    await claimBot.update({
      claimed: true,
      claimedBy: req.user.id,
    });

    let staffEmbed = new MessageEmbed()
      .setTitle('Bot Claimed!')
      .setField('Claimed by:', `\`${req.user.id}\``)
      .setField('Bot Name:', `${claimBot.botName}`);

    let memberEmbed = new MessageEmbed()
      .setTitle('Your bot has been claimed.')
      .setDescription(
        `Your bot has been claimed by **${req.user.username}**. It is currently being tested now!`,
      )
      .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

    send_stafflogs(staffEmbed);
    send_dm(claimBot.main_owner, memberEmbed);
    res.redirect('/panel/queue');
  });

  // profile
  app.get('/profile', checkAuth, async (req, res) => {
    let bots = await BOTS.find({ main_owner: req.user.id });
    let additionalbots = await BOTS.find({ additional_owners: req.user.id });
    let packs = await PACKS.find({ owner: req.user.id });
    let member = await USERS.findOne({ userID: req.user.id });
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID);
    }
    for (i = 0; i < additionalbots.length; ++i) {
      await client.users.fetch(additionalbots[i].botID);
    }
    if (!member) {
      await new_user(req.user.id);
      member = await USERS.findOne({ userID: req.user.id });
    } else await new_user(req.user.id);
    renderPage(res, req, '/users/profile.ejs', {
      alert: null,
      error: null,
      bots,
      additionalbots,
      member,
      packs,
    });
  });

  // users page
  app.get('/users/:id', async (req, res) => {
    let bots = await BOTS.find({ main_owner: req.params.id, type: 'approved' });
    let additionalbots = await BOTS.find({
      additional_owners: req.params.id,
      type: 'approved',
    });
    let packs = await PACKS.find({ owner: req.params.id });
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID).catch(() => {});
    }
    for (i = 0; i < additionalbots.length; ++i) {
      await client.users.fetch(additionalbots[i].botID).catch(() => {});
    }
    let list_member = await USERS.findOne({ userID: req.params.id });
    let member = await client.users.fetch(req.params.id).catch(() => {});
    let servMember;

    let userCheck = await check(req.params.id);

    if (userCheck) {
      servMember = true;
    } else {
      servMember = false;
    }

    if (!member) return found(req, res);
    else if (member.bot) return found(req, res);
    let user = new_user(member.id);
    if (!user) return found(req, res);
    renderPage(res, req, '/users/users.ejs', {
      alert: null,
      error: null,
      bots,
      additionalbots,
      member,
      servMember,
      list_member,
      packs,
    });
  });

  // bots
  let limit = 10;
  let max = bots.length < limit ? bots.length : limit;
  for (i = 0; i < bots.length; i++) {
    await client.users.fetch(bots[i].botID);
  }
  app.get('/list', async (req, res) => {
    prem_restart();
    if (isNaN(req.query.page)) return res.redirect('/list?page=1');
    if (req.query.page) {
      if (req.query.page == '0') return res.redirect('/list');
      else
        bots = await BOTS.find({ type: 'approved' })
          .sort([['votes', 'descending']])
          .limit(max)
          .skip(Math.abs(req.query.page * max - max));
      renderPage(res, req, '/bots/bots.ejs', { bots, premium_bots });
    } else return res.redirect('/list?page=1');
  });

  // packs
  let limit2 = 12;
  let max2 = packs.length < limit2 ? packs.length : limit2;
  app.get('/packs', async (req, res) => {
    if (isNaN(req.query.page)) return res.redirect('/packs?page=1');
    if (req.query.page) {
      if (req.query.page == '0') return res.redirect('/packs');
      else
        packs = await PACKS.find({})
          .sort([['votes', 'descending']])
          .limit(max2)
          .skip(Math.abs(req.query.page * max2 - max2));
      renderPage(res, req, '/bots/packs.ejs', { packs });
    } else return res.redirect('/packs?page=1');
  });

  // edit bot
  app.get('/bots/:id/edit', checkAuth, async (req, res) => {
    let editbot = await BOTS.findOne({ botID: req.params.id });
    if (!editbot)
      editbot = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!editbot) return found(req, res);
    let add_owners = [editbot.main_owner];
    editbot.additional_owners.map((owner) => add_owners.push(owner));
    if (!add_owners.includes(req.user.id)) return found(req, res);
    if (editbot.type == 'denied') return found(req, res);
    renderPage(res, req, '/actions/edit.ejs', {
      alert: null,
      error: null,
      editbot,
    });
  });

  // resubmit bot
  app.get('/bots/:id/resubmit', checkAuth, async (req, res) => {
    let rebot = await BOTS.findOne({ botID: req.params.id });
    if (!rebot)
      rebot = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!rebot) return found(req, res);
    let add_owners = [rebot.main_owner];
    rebot.additional_owners.map((owner) => add_owners.push(owner));
    if (!add_owners.includes(req.user.id)) return found(req, res);
    if (rebot.type !== 'denied') return found(req, res);
    renderPage(res, req, '/actions/resubmit.ejs', {
      alert: null,
      error: null,
      rebot,
    });
  });

  // edit bot package
  app.get('/packs/:name/edit', checkAuth, async (req, res) => {
    let pack = await PACKS.findOne({ url: req.params.name });
    if (!pack) return found(req, res);
    else if (pack.owner !== req.user.id) return found(req, res);
    renderPage(res, req, '/actions/edit_pack.ejs', {
      alert: null,
      error: null,
      pack,
    });
  });

  // bot package
  app.get('/packs/:name', async (req, res) => {
    let pack = await PACKS.findOne({ url: req.params.name });
    if (!pack) return found(req, res);
    pack.bots.map(async (bot) => {
      let bot_check = await BOTS.findOne({ botID: bot });
      if (!bot_check) {
        pack.bots.pull(bot);
        await pack.save();
      }
      await client.users.fetch(bot).catch(() => {});
    });
    renderPage(res, req, '/actions/pack.ejs', {
      alert: null,
      error: null,
      pack,
    });
  });

  // vote bot
  app.get('/bots/:id/vote', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    if (bots.type !== 'approved' && bots.owner === req.user.id)
      return found(req, res);
    else if (req.user && is_staff(req.user.id)) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    bots.clicks = bots.clicks - +-1;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!bots.unique_clicks.includes(ip)) bots.unique_clicks.push(ip);
    await bots.save();

    renderPage(res, req, '/actions/vote.ejs', {
      alert: null,
      error: null,
      fetch,
      bots,
    });
  });

  // report bot
  app.get('/bots/:id/report', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    if ((req.user && is_staff(req.user.id)) || req.user.id == bots.main_owner) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    bots.clicks = bots.clicks - +-1;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!bots.unique_clicks.includes(ip)) bots.unique_clicks.push(ip);
    await bots.save();

    renderPage(res, req, '/actions/report.ejs', {
      alert: null,
      error: null,
      fetch,
      bots,
    });
  });

  // review bot
  app.get('/bots/:id/review', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    if ((req.user && is_staff(req.user.id)) || req.user.id == bots.main_owner) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    bots.clicks = bots.clicks - +-1;
    const ip = req.headers['x-forwarded-for'] || req.connection.remoteAddress;
    if (!bots.unique_clicks.includes(ip)) bots.unique_clicks.push(ip);
    await bots.save();

    renderPage(res, req, '/actions/review.ejs', {
      alert: null,
      error: null,
      fetch,
    });
  });

  // panel main
  app.get('/panel', checkAuth, async (req, res) => {
    if (!is_staff(req.user.id)) return found(req, res);
    let check_staff = await USERS.findOne({ userID: req.user.id });
    let queue = await BOTS.find({ type: 'pending' }, { _id: false });

    let staffArray = [];
    config.team.forEach(async (staff) => {
      let staff2 = await USERS.findOne({ userID: staff, staff: true });

      staffArray.push({
        staffMember: staff,
        staffData: staff2,
      });
    });

    staffArray.sort((a, b) => (a === b ? 0 : a ? -1 : 1));

    let check_all = await USERS.find({ staff: true });
    if (!check_staff) new_user(req.user.id);
    config.team.map(async (member) => {
      await client.users.fetch(member);
      await new_user(member);
    });
    check_all.map(async (user) => {
      await new_user(user.userID);
    });
    let members = await USERS.find({ staff: true });
    renderPage(res, req, '/panel/main.ejs', {
      staffMembers: staffArray,
      queueSize: queue.length,
      alert: null,
      error: null,
      members,
    });
  });

  // panel verification normal bots
  app.get('/panel/queue', checkAuth, async (req, res) => {
    if (!is_staff(req.user.id)) return found(req, res);
    let bots = await BOTS.find({ type: 'pending' });
    let botCheck;
    let ownerCheck;
    for (i = 0; i < bots.length; ++i) {
      botCheck = await client.guilds.cache
        .get(client.config.guildID)
        .members.cache.get(bots[i].botID);
      ownerCheck = await client.guilds.cache
        .get(client.config.guildID)
        .members.cache.get(bots[i].main_owner);

      await client.users.fetch(bots[i].botID);
    }
    renderPage(res, req, '/panel/queue.ejs', {
      alert: null,
      error: null,
      ownerCheck,
      botCheck,
      bots,
    });
  });

  app.get('/queue', async (req, res) => {
    let bots = await BOTS.find({ type: 'pending' });
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID);
    }

    const denied = await BOTS.find({ type: 'denied' });
    const approved = await BOTS.find({ type: 'approved' });

    renderPage(res, req, '/bots/queue.ejs', {
      alert: null,
      error: null,
      approved,
      denied,
      bots,
    });
  });

  // panel certification
  app.get('/panel/certification', checkAuth, async (req, res) => {
    if (!is_admin(req.user.id)) return res.redirect('/panel');
    let bots = await BOTS.find({ pending_cert: true });
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID);
    }
    renderPage(res, req, '/panel/cert.ejs', { alert: null, error: null, bots });
  });

  // search engine
  app.get('/search', async (req, res) => {
    if (req.query.packs && req.query.packs == 'true') {
      let pack = packs;
      pack = pack.filter((bot_pack) => {
        if (
          bot_pack.name &&
          bot_pack.name.toLowerCase().includes(req.query.q.toLowerCase())
        )
          return true;
        else if (
          bot_pack.tags &&
          bot_pack.tags.toLowerCase().includes(req.query.q.toLowerCase())
        )
          return true;
        else if (
          bot_pack.short &&
          bot_pack.short.toLowerCase().includes(req.query.q.toLowerCase())
        )
          return true;
        else return false;
      });
      renderPage(res, req, '/bots/search_pack.ejs', { pack });
    } else {
      let bots = votes_bots;
      bots = bots.filter((bot) => {
        if (
          bot.botName &&
          bot.botName
            .toLowerCase()
            .includes(req.query.q ? req.query.q.toLowerCase() : 'none')
        )
          return true;
        else if (
          bot.tags &&
          bot.tags
            .toLowerCase()
            .includes(req.query.q ? req.query.q.toLowerCase() : 'none')
        )
          return true;
        else if (
          bot.short &&
          bot.short
            .toLowerCase()
            .includes(req.query.q ? req.query.q.toLowerCase() : 'none')
        )
          return true;
        else return false;
      });
      renderPage(res, req, '/bots/search.ejs', { bots });
    }
  });

  // search bar results
  app.get('/search/bar', async (req, res) => {
    if (req.query.packs && req.query.packs == 'true') {
      const pack = packs;
      const search = req.query.q;
      if (!search) return res.json({ error: 'No query defined.' });

      let info = [];
      for (let i = 0; i < pack.length; i++) {
        String.prototype.toProperCase = function () {
          return this.replace(
            /([^\W_]+[^\s-]*) */g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
          );
        };
        if (
          pack[i].tags.toLowerCase().includes(search.toLowerCase()) ||
          pack[i].name.toLowerCase().includes(search.toLowerCase()) ||
          pack[i].short.toLowerCase().includes(search.toLowerCase())
        ) {
          info.push({
            name: pack[i].name,
            votes: pack[i].votes,
            url: pack[i].url,
          });
        }
      }
      return res.json({ packs: info });
    } else {
      const bots = votes_bots;
      const search = req.query.q;
      if (!search) return res.json({ error: 'No query defined.' });

      let info = [];
      for (let i = 0; i < bots.length; ++i) {
        let fetch = await client.users.fetch(bots[i].botID).catch(() => {});
        if (!fetch) return;
        String.prototype.toProperCase = function () {
          return this.replace(
            /([^\W_]+[^\s-]*) */g,
            (txt) => txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase(),
          );
        };
        if (
          bots[i].tags.toLowerCase().includes(search.toLowerCase()) ||
          bots[i].botName.toLowerCase().includes(search.toLowerCase()) ||
          bots[i].short.toLowerCase().includes(search.toLowerCase())
        ) {
          info.push({
            desc: bots[i].desc,
            name: fetch.username,
            ID: fetch.id,
            votes: bots[i].votes,
            avatar: fetch.displayAvatarURL(),
          });
        }
      }
      return res.json({ bots: info });
    }
  });

  app.get('/payments', checkAuth, async (req, res) => {
    const payerId = req.query.PayerID;
    const paymentId = req.query.paymentId;
    const invoice = payments.get('Invoice');
    const botID = payments.get('botID');

    const execute_payment_json = {
      payer_id: payerId,
      transactions: [
        {
          amount: {
            currency: 'USD',
            total: invoice,
          },
        },
      ],
    };

    paypal.payment.execute(
      paymentId,
      execute_payment_json,
      async function (error, payment) {
        if (error) {
          return found(req, res);
        } else {
          let bot = await BOTS.findOne({ botID: botID });
          if (!bot)
            return new_page(req, res, {
              title_text: 'Internal Error',
              big_text: 400,
              small_text: `Error occurred we couldn't find the bot, You can dm founder for refund or get a manuel promotion!`,
            });
          bot.premium = true;
          bot.start_period = Date.now();
          bot.sub_period = ms(payment.transactions[0].item_list.items[0].name);
          await bot.save();
          const botlogembed = new MessageEmbed()
            .setTitle('**__Premium Added:__**')
            .setColor('#110dfc')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
              `<@!${req.user.id}> has now got an Premium Subscription for: <@!${bot.botID}> (\`${bot.botName}\`), Period: (\`${payment.transactions[0].item_list.items[0].name}\`)`,
            )
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          send_stafflogs(botlogembed);
          send_botlogs(botlogembed);
          send_dm(req.user.id, botlogembed);
          new_page(req, res, {
            title_text: 'Success',
            big_text: 200,
            small_text: `${bot.botName} is Paid Promoted for ${payment.transactions[0].item_list.items[0].name}, Paid: $${payment.transactions[0].item_list.items[0].price}`,
          });
        }
      },
    );
  });

  // invite
  app.get('/bots/:id/invite', async (req, res) => {
    let bot = await BOTS.findOne({ botID: req.params.id });
    if (!bot) bot = await BOTS.findOne({ vanity: req.params.id });
    if (!bot) return found(req, res);
    else {
      if (req.cookies.__cfduid) {
        bot.invite_clicks = bot.invite_clicks - +-1;
        await bot.save();
        res.redirect(bot.invite);
      } else res.redirect(bot.invite);
    }
  });

  //add bot
  app.post('/bots/add', checkAuth, async (req, res) => {
    if (req.body.submit) {
      let fetch = await client.users.fetch(req.body.botID).catch(() => {});
      let bot = await BOTS.findOne({ botID: req.body.botID });
      let alertmsg;
      let errormsg;
      let owners_check = req.body.additional_owners.toString().split(', ');
      let owners = '';

      let memberCheck = await client.guilds.cache
        .get(client.config.guildID)
        .members.cache.get(req.user.id);

      if (!fetch) errormsg = "Couldn't find that bot";
      else if (!fetch.bot)
        errormsg = 'You cannot use a UserID, please add your BotID!';
      else if (bot)
        errormsg =
          'This bot already exists in our list, Maybe you meant to Resubmit?';
      else if (!memberCheck)
        errormsg = 'Please join our support server to be able to add your bot!';
      else if (req.body.short.length < 50)
        errormsg = "Short Description can't be less than 50 characters";
      else if (req.body.short.length > 150)
        errormsg = "Short Description can't be more than 150 characters";
      else if (req.body.long.length < 100)
        errormsg = "Long Description can't be less than 100 characters";
      else if (req.body.long.length > 15000)
        errormsg = "Long Description can't be more than 15K characters";
      else if (req.body.prefix.length > 10) errormsg = 'Too long prefix';
      else if (req.body.tags.toString().split(',').length > 10)
        errormsg = 'Max tags is 10';
      else if (req.body.additional_owners.toString().split(', ').length > 3)
        errormsg = 'Additional Owners cannot be more than 3';
      else if (
        req.body.additional_owners.toString().split(', ').includes(req.user.id)
      )
        errormsg = "You can't add yourself to additional owners.";
      else if (
        req.body.background &&
        !/^(http|https):\/\//gi.test(req.body.background)
      )
        errormsg = 'Background URL must start with https:// or http://';
      else if (
        req.body.background &&
        !url
          .parse(req.body.background, true)
          .host.match(/(imgur.com|i.imgur.com|discord.mx|gyazo.com)/gi)
      )
        errormsg = 'Unknown referral background url';
      else {
        if (req.body.additional_owners) {
          for (i = 0; i < owners_check.length; ++i) {
            let check = await client.users
              .fetch(owners_check[i])
              .catch(() => {});
            if (!check || check.bot) owners += `${owners_check[i]}, `;
          }
        }
        if (owners == '') {
          await new BOTS({
            botID: req.body.botID,
            botName: fetch.username,
            prefix: req.body.prefix,
            main_owner: req.user.id,
            token: generate_token(100),
            vanity: fetch.username
              .replace('[^a-zA-Z0-9]', '')
              .split(' ')
              .join('-')
              .toLowerCase(),
            note: req.body.note,
            tags: req.body.tags.toString().split(',').join(', '),
            date: Date.now(),
            webhook: req.body.webhook ? req.body.webhook : 'None',
            long: req.body.long,
            short: req.body.short,
            library: req.body.library,
            nsfw: req.body.nsfw == 'on' ? true : false,
            cross_add: req.body.cross_add == 'on' ? true : false,
            website: req.body.website ? req.body.website : 'None',
            donate: req.body.donate ? req.body.donate : 'None',
            github: req.body.github ? req.body.github : 'None',
            invite: req.body.invite
              ? req.body.invite
              : fix_invite(req.body.botID, req.body.invite),
            support: req.body.support,
            additional_owners: req.body.additional_owners
              .toString()
              .split(', ')
              .filter(function (el) {
                return el;
              }),
            webAuth: req.body.custom_webhook_auth,
            webURL: req.body.custom_webhook,
          }).save();
          alertmsg = 'Awesome I have added your bot to our queue!';
          await new_user(req.user.id);

          // Push to Metro Reviewers
          try {
            let mreq = await request(
              'https://catnip.metrobots.xyz/bots?list_id=3b50d5e8-d0a0-4e63-aff7-f81068e9ad36',
              {
                method: 'POST',
                headers: {
                  Authorization: config.metrokey,
                  'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                  bot_id: req.body.botID,
                  username: fetch.username,
                  banner: req.body.background,
                  owner: req.user.id,
                  extra_owners: req.body.additional_owners
                    .toString()
                    .split(', ')
                    .filter(function (el) {
                      return el;
                    }),
                  description: req.body.short,
                  long_description: req.body.long,
                  website: req.body.website,
                  support: req.body.support,
                  donate: req.body.donate,
                  library: req.body.library,
                  nsfw: req.body.nsfw == 'on' ? true : false,
                  cross_add: req.body.cross_add == 'on' ? true : false,
                  prefix: req.body.prefix,
                  tags: req.body.tags.toString().split(','),
                  review_note: req.body.note,
                  invite: req.body.invite
                    ? req.body.invite
                    : fix_invite(req.body.botID, req.body.invite),
                }),
              },
            );
            let mJSON = await mreq.json();
            console.log(mJSON);
          } catch (err) {
            console.error(err);
          }

          const addedToQueue = new MessageEmbed()
            .setTitle('**__Bot Added:__**')
            .setColor('#426ff5')
            .setThumbnail(client.user.displayAvatarURL())
            .addField('Bot:', `${fetch} (${fetch.username})`, true)
            .addField('Owner:', `<@${req.user.id}>`, true)
            .addField(
              'Bot Page:',
              `${config.domain}/bots/${req.body.botID}`,
              false,
            )
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          const addedToQueue2 = new MessageEmbed()
            .setTitle('**__Bot Added:__**')
            .setDescription(
              'Thanks for adding your bot, We now have a our Testing Server Public.. If you wish to join here is an invite: [Join Here](https://discord.gg/NW92GTKA62) ❤',
            )
            .setColor('#cb42f5')
            .setThumbnail(client.user.displayAvatarURL())
            .addField('Bot:', `${fetch} (${fetch.username})`, true)
            .addField('Owner:', `<@${req.user.id}>`, true)
            .addField(
              'Bot Page:',
              `${config.domain}/bots/${req.body.botID}`,
              false,
            )
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          send_dm(req.user.id, addedToQueue2);
          send_botlogs(`${await staff_role}`);
          send_botlogs(addedToQueue);
        } else errormsg = `${owners} additional owners are wrong.`;
      }
      renderPage(res, req, '/actions/add.ejs', {
        alert: alertmsg,
        error: errormsg,
        memberCheck,
      });
    }
  });

  //edit bot
  app.post('/bots/:id/edit', checkAuth, async (req, res) => {
    let editbot = await BOTS.findOne({ botID: req.params.id });
    let alertmsg;
    let errormsg;
    let owners_check = req.body.additional_owners.toString().split(', ');
    let owners = '';

    if (!editbot)
      editbot = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!editbot) return found(req, res);
    let check = await client.users.fetch(editbot.botID).catch(() => {});
    let add_owners = [editbot.main_owner];
    editbot.additional_owners.map((owner) => add_owners.push(owner));
    if (!add_owners.includes(req.user.id)) return found(req, res);
    if (editbot.type == 'denied') return found(req, res);
    if (req.body.submit) {
      if (!check) errormsg = 'Error occurred while editing bot';
      else if (!check.bot) errormsg = "You can't edit humans";
      else if (req.body.short.length < 50)
        errormsg = "Short Description can't be less than 50 characters";
      else if (req.body.short.length > 150)
        errormsg = "Short Description can't be more than 150 characters";
      else if (req.body.long.length < 100)
        errormsg = "Long Description can't be less than 100 characters";
      else if (req.body.long.length > 15000)
        errormsg = "Long Description can't be more than 15k characters";
      else if (req.body.prefix.length > 10) errormsg = 'Too long prefix';
      else if (req.body.tags.toString().split(',').length > 10)
        errormsg = 'Max tags is 10';
      else if (req.body.additional_owners.toString().split(', ').length > 3)
        errormsg = "Additional Owners can't be more than 3";
      else if (
        req.body.additional_owners
          .toString()
          .split(', ')
          .includes(editbot.main_owner)
      )
        errormsg = 'Additional Owners cannot contain the Main Owners ID';
      else if (
        req.body.background &&
        !/^(http|https):\/\//gi.test(req.body.background)
      )
        errormsg = 'Background URL must start with https:// or http://';
      else if (
        req.body.background &&
        !url
          .parse(req.body.background, true)
          .host.match(/(imgur.com|i.imgur.com|discord.mx|gyazo.com)/gi)
      )
        errormsg = 'Unknown referral background url';
      else {
        if (req.body.additional_owners) {
          for (i = 0; i < owners_check.length; ++i) {
            let check = await client.users
              .fetch(owners_check[i])
              .catch(() => {});
            if (!check || check.bot) owners += `${owners_check[i]}, `;
          }
        }
        if (owners == '') {
          (editbot.botName = check.username),
            (editbot.prefix = req.body.prefix),
            (editbot.tags = req.body.tags.toString().split(',').join(', ')),
            (editbot.long = req.body.long),
            (editbot.short = req.body.short);
          if (editbot.main_owner == req.user.id)
            editbot.additional_owners = req.body.additional_owners
              .toString()
              .split(', ')
              .filter(function (el) {
                return el;
              });
          (editbot.website = req.body.website ? req.body.website : 'None'),
            (editbot.github = req.body.github ? req.body.github : 'None'),
            (editbot.donate = req.body.donate ? req.body.donate : 'None'),
            (editbot.invite = req.body.invite
              ? req.body.invite
              : fix_invite(req.body.botID, req.body.invite)),
            (editbot.support = req.body.support);
          editbot.webAuth = req.body.custom_webhook_auth;
          editbot.webURL = req.body.custom_webhook;
          editbot.library = req.body.library;
          (editbot.webHmacAuth = req.body.hmac_auth == 'on' ? true : false),
            (editbot.background =
              req.body.background || 'https://i.imgur.com/lNdMzuW.png');
          (editbot.webhook = req.body.webhook ? req.body.webhook : 'None'),
            (editbot.nsfw = req.body.nsfw == 'on' ? true : false),
            (editbot.vanity = check.username
              .replace('[^a-zA-Z0-9]', '')
              .split(' ')
              .join('-')
              .toLowerCase());
          editbot.save().catch(() => {});

          const botUpdatedEmbed = new MessageEmbed()
            .setTitle('**__Bot Updated:__**')
            .setDescription(
              `<@${req.user.id}> has just edited: ${check} (\`${check.username}\`)`,
            )
            .setColor('#42b9f5')
            .setThumbnail(client.user.displayAvatarURL())
            .addField('Editor:', `<@${req.user.id}>`, true)
            .addField(
              'Bot Page:',
              `${config.domain}/bots/${req.params.id}`,
              false,
            )
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          await new_user(editbot.main_owner);
          send_botlogs(botUpdatedEmbed);
          return res.redirect(
            `/bots/${editbot.certified ? editbot.vanity : editbot.botID}`,
          );
        } else errormsg = `${owners} additional owners are wrong.`;
      }
      renderPage(res, req, '/actions/edit.ejs', {
        alert: alertmsg,
        error: errormsg,
        editbot,
      });
    }
  });

  //resubmit bot
  app.post('/bots/:id/resubmit', checkAuth, async (req, res) => {
    let rebot = await BOTS.findOne({ botID: req.params.id });
    let alertmsg;
    let errormsg;
    let owners_check = req.body.additional_owners.toString().split(', ');
    let owners = '';

    if (!rebot)
      rebot = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!rebot) return found(req, res);
    let check = await client.users.fetch(rebot.botID).catch(() => {});
    let add_owners = [rebot.main_owner];
    rebot.additional_owners.map((owner) => add_owners.push(owner));
    if (!add_owners.includes(req.user.id)) return found(req, res);
    if (rebot.type !== 'denied') return found(req, res);
    if (req.body.submit) {
      if (!check) errormsg = 'Error occurred while editing bot';
      else if (!check.bot) errormsg = "You can't edit humans";
      else if (req.body.short.length < 50)
        errormsg = "Short Description can't be less than 50 characters";
      else if (req.body.short.length > 150)
        errormsg = "Short Description can't be more than 150 characters";
      else if (req.body.long.length < 100)
        errormsg = "Long Description can't be less than 100 characters";
      else if (req.body.long.length > 15000)
        errormsg = "Long Description can't be more than 15k characters";
      else if (req.body.prefix.length > 10) errormsg = 'Too long prefix';
      else if (req.body.tags.toString().split(',').length > 10)
        errormsg = 'Max tags is 10';
      else if (req.body.additional_owners.toString().split(', ').length > 3)
        errormsg = "Additional Owners can't be more than 3";
      else if (
        req.body.additional_owners
          .toString()
          .split(', ')
          .includes(rebot.main_owner)
      )
        errormsg = "You can't include ownerID in additional owner";
      else if (
        req.body.background &&
        !/^(http|https):\/\//gi.test(req.body.background)
      )
        errormsg = 'Background URL must start with https:// or http://';
      else if (
        req.body.background &&
        !url
          .parse(req.body.background, true)
          .host.match(/(imgur.com|i.imgur.com|discord.mx|gyazo.com)/gi)
      )
        errormsg = 'Unknown referral background url';
      else {
        if (req.body.additional_owners) {
          for (i = 0; i < owners_check.length; ++i) {
            let check = await client.users
              .fetch(owners_check[i])
              .catch(() => {});
            if (!check || check.bot) owners += `${owners_check[i]}, `;
          }
        }
        if (owners == '') {
          (rebot.botName = check.username),
            (rebot.prefix = req.body.prefix),
            (rebot.tags = req.body.tags.toString().split(',').join(', ')),
            (rebot.long = req.body.long),
            (rebot.short = req.body.short);
          if (rebot.main_owner == req.user.id)
            (rebot.additional_owners = req.body.additional_owners
              .toString()
              .split(', ')
              .filter(function (el) {
                return el;
              })),
              (rebot.website = req.body.website ? req.body.website : 'None'),
              (rebot.donate = req.body.donate ? req.body.donate : 'None'),
              (rebot.invite = req.body.invite
                ? req.body.invite
                : fix_invite(req.body.botID, req.body.invite)),
              (rebot.support = req.body.support);
          (rebot.github = req.body.github ? req.body.github : 'None'),
            (rebot.webAuth = req.body.custom_webhook_auth);
          rebot.webURL = req.body.custom_webhook;
          rebot.library = req.body.library;
          rebot.background =
            req.body.background || 'https://i.imgur.com/lNdMzuW.png';
          (rebot.webhook = req.body.webhook ? req.body.webhook : 'None'),
            (rebot.nsfw = req.body.nsfw == 'on' ? true : false),
            (rebot.type = 'pending');
          rebot.vanity = check.username
            .replace('[^a-zA-Z0-9]', '')
            .split(' ')
            .join('-')
            .toLowerCase();
          rebot.save().catch(() => {});
          alertmsg = 'Your bot has been resubmitted!';
          await new_user(rebot.main_owner);

          const botResubmitted = new MessageEmbed()
            .setTitle('**__Bot Resubmitted:__**')
            .setColor('#8285d9')
            .setThumbnail(client.user.displayAvatarURL())
            .addField('Bot:', `${check} (${check.username})`, true)
            .addField('Owner:', `<@${req.user.id}>`, true)
            .addField(
              'Bot Page:',
              `${config.domain}/bots/${req.params.id}`,
              false,
            )
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          send_dm(req.user.id, botResubmitted);
          send_botlogs(`${await staff_role}`);
          send_botlogs(botResubmitted);
        } else errormsg = `${owners2} additional owners are wrong.`;
      }
      renderPage(res, req, '/actions/resubmit.ejs', {
        alert: alertmsg,
        error: errormsg,
        rebot,
      });
    }
  });
  //add bot package
  app.post('/packs/add', checkAuth, async (req, res) => {
    if (req.body.submit) {
      let check_name = await PACKS.findOne({ name: req.body.name });
      let check_owner = await PACKS.findOne({ owner: req.user.id });
      let bots_check = req.body.bots.toString().split(', ');
      let errors = '';
      let alertmsg;
      let errormsg;

      if (check_name) errormsg = 'Package name already exists';
      else if (check_owner) errormsg = "You can't add more than one package!";
      else if (!check(req.user.id))
        errormsg = 'You are not in the support server';
      else if (req.body.name.length > 150)
        errormsg = "Package name can't be more than 150 characters";
      else if (req.body.name.length < 10)
        errormsg = "Package name can't be less than 10 characters";
      else if (req.body.short.length < 50)
        errormsg = "Short Description can't be less than 50 characters";
      else if (req.body.short.length > 150)
        errormsg = "Short Description can't be more than 150 characters";
      else if (req.body.tags.toString().split(',').length > 10)
        errormsg = 'Max tags is 10';
      else if (req.body.bots.toString().split(', ').length < 3)
        errormsg = "Bots can't be less than 3";
      else if (req.body.bots.toString().split(', ').length > 50)
        errormsg = "Bots can't be more than 50";
      else if (req.body.bots.toString().split(', ').includes(req.user.id))
        errormsg = "You can't add yourself to bots";
      else {
        if (req.body.bots) {
          for (i = 0; i < bots_check.length; i++) {
            let bot = await BOTS.findOne({
              botID: bots_check[i],
              type: 'approved',
            });
            if (!bot) errors += `${bots_check[i]}, `;
          }
        }
        if (errors == '') {
          await new PACKS({
            name: req.body.name,
            short: req.body.short,
            bots: req.body.bots
              .toString()
              .split(', ')
              .filter(function (el) {
                return el;
              }),
            tags: req.body.tags.toString().split(',').join(', '),
            owner: req.user.id,
            date: Date.now(),
            url: req.body.name
              .replace('[^a-zA-Z0-9]', '')
              .split(' ')
              .join('-')
              .toLowerCase(),
          }).save();
          alertmsg = 'Your package has been added to the list!';
          send_botlogs(
            `<@${req.user.id}> has created (\`${
              req.body.name
            }\`) Bot Packs\n<${domain}/packs/${req.body.name
              .replace('[^a-zA-Z0-9]', '')
              .split(' ')
              .join('-')
              .toLowerCase()}>`,
          );
        } else
          errormsg = `${errors} bots aren't in our bot list or they aren't bots!`;
      }
      renderPage(res, req, '/actions/create_pack.ejs', {
        alert: alertmsg,
        error: errormsg,
      });
    }
  });

  //add bot package
  app.post('/packs/:name/edit', checkAuth, async (req, res) => {
    let pack = await PACKS.findOne({ url: req.params.name });
    if (!pack) return found(req, res);
    else if (pack.owner !== req.user.id) return found(req, res);
    if (req.body.submit) {
      let bots_check = req.body.bots.toString().split(', ');
      let errors = '';
      let alertmsg;
      let errormsg;

      if (!check(req.user.id)) errormsg = 'You are not in the support server';
      else if (req.body.name.length > 150)
        errormsg = "Package name can't be more than 150 characters";
      else if (req.body.name.length < 10)
        errormsg = "Package name can't be less than 10 characters";
      else if (req.body.short.length < 50)
        errormsg = "Short Description can't be less than 50 characters";
      else if (req.body.short.length > 150)
        errormsg = "Short Description can't be more than 150 characters";
      else if (req.body.tags.toString().split(',').length > 10)
        errormsg = 'Max tags is 10';
      else if (req.body.bots.toString().split(', ').length < 3)
        errormsg = "Bots can't be less than 3";
      else if (req.body.bots.toString().split(', ').length > 50)
        errormsg = "Bots can't be more than 50";
      else if (req.body.bots.toString().split(', ').includes(req.user.id))
        errormsg = "You can't add yourself to bots";
      else {
        if (req.body.bots) {
          for (i = 0; i < bots_check.length; i++) {
            let bot = await BOTS.findOne({
              botID: bots_check[i],
              type: 'approved',
            });
            if (!bot) errors += `${bots_check[i]}, `;
          }
        }
        if (errors == '') {
          pack.name = req.body.name;
          pack.short = req.body.short;
          pack.bots = req.body.bots
            .toString()
            .split(', ')
            .filter(function (el) {
              return el;
            });
          pack.tags = req.body.tags.toString().split(',').join(', ');
          pack.date = Date.now();
          pack.url = req.body.name
            .replace('[^a-zA-Z0-9]', '')
            .split(' ')
            .join('-')
            .toLowerCase();
          pack.save();
          alertmsg = 'Your package has been edited!';
          send_botlogs(
            `<@${req.user.id}> has edited: (\`${
              req.body.name
            }\`) Bot Packs\n<${domain}/packs/${req.body.name
              .replace('[^a-zA-Z0-9]', '')
              .split(' ')
              .join('-')
              .toLowerCase()}>`,
          );
        } else
          errormsg = `${errors} bots aren't in our bot list or they aren't bots!`;
      }
      renderPage(res, req, '/actions/edit_pack.ejs', {
        alert: alertmsg,
        error: errormsg,
        pack,
      });
    }
  });
  //profile
  app.post('/profile', checkAuth, async (req, res) => {
    let bots = await BOTS.find({ main_owner: req.user.id });
    let member = await USERS.findOne({ userID: req.user.id });
    let additionalbots = await BOTS.find({ additional_owners: req.user.id });
    let packs = await PACKS.find({ owner: req.user.id });
    let alertmsg;
    let errormsg;
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID);
    }
    new_user(req.user.id);
    if (req.body.submit) {
      if (req.body.bio.length > 150)
        errormsg = 'Biography can not be more than 150 characters';
      else if (req.body.bio.length < 10)
        errormsg = 'Biography can not be less than 10 characters';
      else {
        let site;
        let git;

        if (validator.isURL(req.body.website)) {
          site = req.body.website;
        } else {
          site = 'Lol nice try noob!';
        }

        if (validator.isURL(req.body.github)) {
          git = req.body.github;
        } else {
          git = 'Lol nice try noob!';
        }

        member.about = validator.escape(req.body.bio);
        member.website = site;
        member.github = git;
        member.nickname = validator.escape(req.body.nickname);
        await member.save();
        alertmsg = 'Profile changes has been saved!';
      }
    }
    if (req.body.delete_data) {
      member.about = 'I am a very mysterious person';
      await member.save();
      return res.redirect('/logout');
    }
    renderPage(res, req, '/users/profile.ejs', {
      alert: alertmsg,
      error: errormsg,
      additionalbots,
      bots,
      member,
      packs,
    });
  });
  //panel main
  app.post('/panel', checkAuth, async (req, res) => {
    if (!is_staff(req.user.id)) return found(req, res);
    let check_staff = await USERS.findOne({ userID: req.user.id });
    if (!check_staff) new_user(req.user.id);
    let members = await USERS.find({ staff: true });
    let staffArray = [];
    config.team.forEach(async (staff) => {
      let staff2 = await USERS.findOne({ userID: staff, staff: true });

      staffArray.push({
        staffMember: staff,
        staffData: staff2,
      });
    });

    staffArray.sort((a, b) => (a === b ? 0 : a ? -1 : 1));
    let alertmsg;
    let errormsg;
    if (req.body.submit) {
      let bot = await BOTS.findOne({ botID: req.body.botID });
      if (!bot) errormsg = "Couldn't find that bot!";
      else {
        alertmsg = `Successful ${bot.botName} has been deleted!`;
        await bot.deleteOne();
        await kick(bot.botID);
        await new_user(bot.main_owner);
        await votes_fix();
        await roles_fix(bot.main_owner);
        await reviews_fix(bot.botID);
        bot.additional_owners.map(async (owner) => await roles_fix(owner));
        bot.additional_owners.map(async (owner) => await new_user(owner));

        const deletedBot = new MessageEmbed()
          .setTitle('**__Bot Deleted:__**')
          .setColor('#b0d982')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('Bot:', `<@${bot.botID}> (${bot.botName})`, true)
          .addField('Moderator:', `<@${req.user.id}>`, true)
          .addField('Owner:', `<@${bot.main_owner}>`, true)
          .addField('Reason:', req.body.reason, false)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        await send_dm(
          bot.main_owner,
          `Hello, Looks like your bot **${bot.botName}** has been deleted by: **${req.user.username}**\n**Reason:** \`${req.body.reason}\``,
        );
        await send_botlogs(deletedBot);
      }
    }
    if (req.body.uncertify_submit && is_admin(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.uncertify_ID });
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (!bot.certified) errormsg = "This bot isn't certified";
      else if (bot.pending_cert)
        errormsg = 'This bot only awaiting certification';
      else {
        alertmsg = `Successful ${bot.botName} has been uncertified!`;
        bot.certified = false;
        await bot.save();
        await new_user(bot.main_owner);
        await roles_fix(bot.main_owner);
        await remove_role(bot.main_owner, config.certified_dev);
        await remove_role(bot.botID, config.certified_bot);

        let uncert_dm_log = new MessageEmbed()
          .setTitle('**__Bot Uncertified:__**')
          .setColor('#f58e2f')
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(`Your bot ${bot.botName} has been Uncertified`)
          .addField('Moderator:', `${req.user.username}`, true)
          .addField('Reason:', `${req.body.uncertify_reason}`, true)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        await send_dm(bot.main_owner, uncert_dm_log);

        let uncert_bot_log = new MessageEmbed()
          .setTitle('**__Bot Uncertified:__**')
          .setColor('#2ff5de')
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(`${bot.botName} has been Uncertified`)
          .addField('Owner:', `<@${bot.main_owner}>`, true)
          .addField('Moderator', `${req.user.username}`, true)
          .addField('Reason:', `${req.body.uncertify_reason}`, true)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        send_modlogs(uncert_bot_log);
      }
    }
    if (req.body.staff_submit && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.staff_ID });
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (bot.staff) errormsg = 'This bot is already staff';
      else {
        alertmsg = `Successful ${bot.botName} is staff now!`;

        let new_staff_bot = new MessageEmbed()
          .setTitle('**__New Staff Bot Added:__**')
          .setColor('#2f9ff5')
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(`${bot.botName} has been added to Staff Bots`)
          .addField('Added By:', `${req.user.username}`, true)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        send_stafflogs(new_staff_bot);

        bot.staff = true;
        await add_role(bot.botID, client.config.staff_bot);
        await bot.save();
        await new_user(bot.main_owner);
      }
    }

    if (req.body.user_voteban_submit && is_root(req.user.id)) {
      let user = await USERS.findOne({ userID: req.body.banned_user_ID });
      if (!user) errormsg = "Couldn't find that user in the DB!";
      if (user.vote_banned) errormsg = 'User has already been Vote Banned';
      else {
        alertmsg = `User has been banned from Voting!`;

        const userVoteBan = new MessageEmbed()
          .setTitle('⛔️ **__User Vote Ban:__**')
          .setColor('#b0d982')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('User:', `<@!${user.userID}>`, true)
          .addField('Moderator:', `${req.user.username}`, true)
          .addField(
            'Reason:',
            'Abuse of the Infinity API or Voting Endpoints!',
            false,
          )
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

        send_stafflogs(userVoteBan);
        user.vote_banned = true;
        await user.save();
      }
    }

    if (req.body.bot_votes_fix && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.bot_to_fix });
      if (!bot) bot = await BOTS.findOne({ vanity: req.body.bot_to_fix });
      if (!bot) errormsg = "Couldn't find that bot in the DB";

      alertmsg = `Vote count for ${bot.botName} has been corrected!`;

      const voteCountUpdate = new MessageEmbed()
        .setTitle('📊 **__Vote Count Corrected:__**')
        .setColor('#b0d982')
        .setThumbnail(client.user.displayAvatarURL())
        .addField('Bot:', `${bot.botName} (${bot.botID})`, true)
        .addField('Previous Votes:', `${bot.votes}`, true)
        .addField('Updated Votes:', `${req.body.vote_count}`, true)
        .addField(
          'Moderator Info',
          `${req.user.username} (${req.user.id})`,
          true,
        )
        .setTimestamp()
        .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

      bot.votes = req.body.vote_count;
      await bot.save();

      send_stafflogs(voteCountUpdate);
    }

    if (req.body.bot_voteban_submit && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.banned_bot_ID });
      if (!bot) errormsg = "Couldn't find that bot in the DB!";
      if (bot.vote_banned) errormsg = 'Bot has already been Vote Banned';
      else {
        alertmsg = `${bot.botName} has been banned from Voting!`;

        const botVoteBan = new MessageEmbed()
          .setTitle('⛔️ **__Bot Vote Ban:__**')
          .setColor('#b0d982')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('Bot:', `${bot.botName} (${bot.botID})`, true)
          .addField('Moderator:', `${req.user.username}`, true)
          .addField(
            'Reason:',
            'Abuse of the Infinity API or Voting Endpoints!',
            false,
          )
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - Infinity Bot List');

        send_stafflogs(botVoteBan);
        bot.vote_banned = true;
        await bot.save();
      }
    }

    if (req.body.transfer_submit && is_admin(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.transfer_botID });
      let fetch = await client.users
        .fetch(req.body.transfer_userID)
        .catch(() => {});
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (bot.type == 'denied')
        errormsg = "You can't transfer denied bot!";
      else if (!fetch) errormsg = "Couldn't fetch the new ownerID";
      else if (fetch.bot) errormsg = "The new owner isn't user!";
      else if (bot.main_owner == fetch.id)
        errormsg = "You can't transfer the bot to same owner!";
      else if (!check(req.body.transfer_userID))
        errormsg = "The new owner isn't in the server!";
      else {
        alertmsg = `${bot.botName} has been transferred to ${fetch.username}!`;
        send_botlogs(
          `<@${req.user.id}> has forced transferred: <@${bot.botID}> (\`${bot.botName}\`) to <@${fetch.id}>`,
        );
        send_dm(
          req.body.transfer_userID,
          `<@${req.user.id}> has forced transferred: <@${bot.botID}> (\`${bot.botName}\`) to you!`,
        );
        send_dm(
          bot.main_owner,
          `Your bot <@${bot.botID}> (\`${bot.botName}\`) has been forced transferred to: <@!${fetch.id}> (\`${fetch.username}\`) by: <@${req.user.id}>`,
        );
        send_stafflogs(
          `**${bot.botName}** has been forced transferred to: ${fetch.username} by: **${req.user.username}**`,
        );
        await remove_role(bot.main_owner, client.config.developer);
        await add_role(req.body.transfer_userID, client.config.developer);
        await new_user(bot.main_owner);
        await new_user(req.body.transfer_userID);
        roles_fix(req.body.transfer_userID);
        roles_fix(bot.main_owner);
        bot.main_owner = req.body.transfer_userID;
        bot.additional_owners = [];
        await bot.save();
      }
    }
    if (req.body.unstaff_submit && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.staff_ID });
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (!bot.staff) errormsg = 'This bot is not staff';
      else {
        alertmsg = `Successful ${bot.botName} is not staff now!`;
        send_stafflogs(
          `**${bot.botName}** has been removed from staff bots by: **${req.user.username}**`,
        );
        bot.staff = false;
        await remove_role(bot.botID, client.config.staff_bot);
        await bot.save();
        await new_user(bot.main_owner);
      }
    }

    if (req.body.user_unvoteban_submit && is_root(req.user.id)) {
      let user = await USERS.findOne({ userID: req.body.banned_user_ID });
      if (!user) errormsg = 'User not found in our DB';
      if (!user.vote_banned) errormsg = 'User has not been Vote Banned';
      else {
        alertmsg = `User has been removed from Vote Ban`;
        send_stafflogs(
          `**<@!${user.userID}>** has been removed from Vote Ban by: **${req.user.username}**`,
        );
        user.vote_banned = false;
        await user.save();
      }
    }

    if (req.body.bot_unvoteban_submit && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.banned_bot_ID });
      if (!bot) errormsg = 'Bot not found in our DB';
      if (!bot.vote_banned) errormsg = 'Bot has not been Vote Banned';
      else {
        alertmsg = `${bot.botName} has been removed from Vote Ban`;
        send_stafflogs(
          `**${bot.botName}** has been removed from Vote Ban by: **${req.user.username}**`,
        );
        bot.vote_banned = false;
        await bot.save();
      }
    }

    if (req.body.premium_remove && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.premiumID });
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (!bot.premium) errormsg = 'This bot is not premium';
      else {
        alertmsg = `Successful ${bot.botName} is not premium now!`;
        send_stafflogs(
          `**${bot.botName}** has been removed from Premium by: **${req.user.username}**`,
        );
        send_botlogs(
          `<@!${bot.botID}> (\`${bot.botName}\`) by <@!${bot.main_owner}> has been removed from Premium by: <@!${req.user.id}>`,
        );
        send_dm(
          bot.main_owner,
          `Your bot **${bot.botName}** by has been removed from Premium by: <@!${req.user.id}>`,
        );
        bot.premium = false;
        bot.start_period = Date.now();
        bot.sub_period = ms('30 days');
        await bot.save();
      }
    }
    if (req.body.premium_submit && is_root(req.user.id)) {
      let bot = await BOTS.findOne({ botID: req.body.premiumID2 });
      let sub =
        req.body.premium_sub == 'other'
          ? req.body.premium_sub2
            ? req.body.premium_sub2
            : '30 days'
          : req.body.premium_sub;
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (!require('ms')(sub))
        errormsg = 'Error Occurred while formatting time!';
      else if (!isNaN(sub)) errormsg = 'Error Occurred while formatting time!';
      else {
        if (bot.premium) {
          bot.sub_period = require('ms')(sub);
          await bot.save();
          alertmsg = `${bot.botName} Premium Subscribe has been updated!`;
          send_stafflogs(
            `**${bot.botName}** Premium has been edited to: (\`${sub}\`) by: **${req.user.username}**`,
          );
          send_botlogs(
            `<@!${bot.botID}> (\`${bot.botName}\`) by: <@!${bot.main_owner}> Premium has been edited to: (\`${sub}\`) by: <@!${req.user.id}>`,
          );
          send_dm(
            bot.main_owner,
            `Your bot **${bot.botName}** Premium has been edited to: (\`${sub}\`) by: <@!${req.user.id}>`,
          );
        } else {
          bot.premium = true;
          bot.sub_period = require('ms')(sub);
          bot.start_period = Date.now();
          await bot.save();
          send_stafflogs(
            `**${bot.botName}** has been added to Premium for: (\`${sub}\`) by: **${req.user.username}**`,
          );
          send_botlogs(
            `<@!${bot.botID}> (\`${bot.botName}\`) by: <@!${bot.main_owner}> has been added to Premium for: (\`${sub}\`) by: <@!${req.user.id}>`,
          );
          send_dm(
            bot.main_owner,
            `Your bot **${bot.botName}** has been added to Premium for: (\`${sub}\`) by: <@!${req.user.id}>`,
          );
          alertmsg = `${bot.botName} has been added to Premium!`;
        }
      }
    }
    renderPage(res, req, '/panel/main.ejs', {
      alert: alertmsg,
      error: errormsg,
      staffMembers: staffArray,
      members,
    });
  });
  //panel verification normal bots
  app.post('/panel/queue', checkAuth, async (req, res) => {
    if (!is_staff(req.user.id)) return found(req, res);
    let alertmsg;
    let errormsg;
    let botCheck;
    let ownerCheck = false;
    if (req.body.approve) {
      let bot = await BOTS.findOne({ botID: req.body.approve });
      try {
        let res = await request(
          `https://spider.infinitybots.gg/_duser/${bot.main_owner}`,
        );

        let duserJson = await res.json();

        let res2 = await request(
          `https://spider.infinitybots.gg/_duser/${bot.botID}`,
        );

        let botJson = await res2.json();

        botCheck = botJson.is_member;
        ownerCheck = duserJson.is_member;

        console.log(botCheck, ownerCheck, duserJson, botJson);

        try {
          if (!ownerCheck) {
            // Try additional owners?
            if (bot.additional_owners && bot.additional_owners.length > 0) {
              for (const owner of bot.additional_owners) {
                let res28 = await request(
                  `https://spider.infinitybots.gg/_duser/${owner}`,
                );

                let json = await res28.json();

                if (json.is_member) {
                  ownerCheck = true;
                }
              }
            }
          }
        } catch (err) {
          console.error(err);
        }
      } catch (err) {
        errormsg = err;
        console.error(err);
      }

      if (!bot) errormsg = "Couldn't find that bot!";
      else if (bot.type !== 'pending')
        errormsg = 'Bot maybe got denied or approved, use main page at panel!';
      else if (!botCheck)
        errormsg = 'Please add the bot to our Main Server prior to Approval!';
      else if (!ownerCheck)
        errormsg =
          "Bot owner isn't a member of our server. Please deny this bot for that reason!";
      else {
        let staff = await USERS.findOne({ userID: req.user.id });
        if (staff) {
          staff.new_staff_stats.set(
            'approved_bots',
            staff.new_staff_stats.get('approved_bots') + 1,
          );
          await staff.save();
        }
        alertmsg = `Awesome I have approved ${bot.botName}...`;
        bot.type = 'approved';
        bot.date = Date.now();
        await bot.save();
        await add_role(bot.botID, client.config.bots);
        await add_role(bot.main_owner, client.config.developer);
        await remove_role(bot.botID, client.config.pending);
        new_user(bot.main_owner);
        bot.additional_owners.map(
          async (owner) => await add_role(owner, client.config.developer),
        );
        bot.additional_owners.map(async (owner) => await new_user(owner));

        const botapproved = new MessageEmbed()
          .setTitle('**__Bot Approved:__**')
          .setColor('#134cad')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('Bot:', `<@${bot.botID}> (${bot.botName})`, true)
          .addField('Owner:', `<@${bot.main_owner}>`, true)
          .addField('Moderator:', `<@${req.user.id}>`, true)
          .addField('Bot Page:', `${config.domain}/bots/${bot.botID}`, true)
          .addField('Feedback:', req.body.reason, false)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        await send_dm(bot.main_owner, botapproved);
        await send_modlogs(botapproved);
        await send_stafflogs(botapproved);

        // Try posting to metro reviews
        // Push to Metro Reviewers
        try {
          let mreq = await request(
            `https://catnip.metrobots.xyz/bots/${bot.botID}/approve?reviewer=${req.user.id}&list_id=3b50d5e8-d0a0-4e63-aff7-f81068e9ad36`,
            {
              method: 'POST',
              body: JSON.stringify({
                reason: req.body.reason,
              }),
              headers: {
                Authorization: config.metrokey,
                'Content-Type': 'application/json',
              },
            },
          );
          let mJSON = await mreq.json();
          console.log(mJSON);
        } catch (err) {
          console.error(err);
        }
      }
    }
    if (req.body.deny) {
      let bot = await BOTS.findOne({ botID: req.body.deny });
      if (!bot) errormsg = "Couldn't find that bot!";
      else if (bot.type !== 'pending')
        errormsg =
          'Whoops, Maybe this bot has already been approved or denied!';
      else {
        let staff = await USERS.findOne({ userID: req.user.id });
        if (staff) {
          staff.new_staff_stats.set(
            'denied_bots',
            staff.new_staff_stats.get('denied_bots') + 1,
          );
          await staff.save();
        }
        alertmsg = `Awesome I have declined ${bot.botName}...`;
        bot.type = 'denied';
        await bot.save();
        await kick(bot.botID);
        new_user(bot.main_owner);
        bot.additional_owners.map(async (owner) => await new_user(owner));

        const botdenied = new MessageEmbed()
          .setTitle('**__Bot Denied:__**')
          .setColor('#13ad84')
          .setThumbnail(client.user.displayAvatarURL())
          .setDescription(
            'If you feel this has been a mistake or not a valid reason.. Please create a ticket: <#816156732929081366>',
          )
          .addField('Bot:', `<@${bot.botID}> (${bot.botName})`, true)
          .addField('Owner:', `<@${bot.main_owner}>`, true)
          .addField('Moderator:', `<@${req.user.id}>`, true)
          .addField('Feedback:', req.body.reason, false)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        await send_dm(bot.main_owner, botdenied);
        await send_modlogs(botdenied);
        await send_stafflogs(botdenied);
      }
    }
    let bots = await BOTS.find({ type: 'pending' });
    for (i = 0; i < bots.length; ++i) {
      await client.users.fetch(bots[i].botID);
    }
    renderPage(res, req, '/panel/queue.ejs', {
      alert: alertmsg,
      error: errormsg,
      botCheck,
      ownerCheck,
      bots,
    });
  });
  //transfer bot
  app.post('/profile/transfer', checkAuth, async (req, res) => {
    let alertmsg;
    let errormsg;
    if (req.body.submit) {
      let user = await client.users.fetch(req.body.userID).catch(() => {});
      let bot = await BOTS.findOne({ botID: req.body.botID });
      if (!bot) errormsg = 'Error occurred while transferring';
      else if (!user) errormsg = "Couldn't find that userID";
      else if (user.bot) errormsg = "Bots can't own another bots";
      else if (!check(req.body.userID))
        errormsg = "This user isn't at bot list discord server";
      else if (bot.main_owner !== req.user.id)
        errormsg = 'You are not the owner of this bot';
      else if (bot.main_owner == req.body.userID)
        errormsg = "It's already your bot";
      else {
        bot.main_owner = req.body.userID;
        bot.additional_owners = [];
        await bot.save();
        new_user(req.user.id);
        new_user(req.body.userID);
        roles_fix(req.user.id);
        roles_fix(req.body.userID);
        alertmsg = `Your bot has been transferred to ${user.username}`;
        send_botlogs(
          `<@${req.user.id}> has transferred: <@${bot.botID}> (\`${bot.botName}\`) to: <@${user.id}>`,
        );
        send_dm(
          user.id,
          `<@${req.user.id}> has transferred <@${bot.botID}> (\`${bot.botName}\`) to you!`,
        );
        send_dm(
          req.user.id,
          `Your bot: <@${bot.botID}> (\`${bot.botName}\`) has been transferred to: <@!${user.id}>`,
        );
        send_stafflogs(
          `**${req.user.username}** transferred: <@${bot.botID}> (\`${bot.botName}\`) to: **${user.username}**`,
        );
      }
    }
    let bots = await BOTS.find({ main_owner: req.user.id, type: 'approved' });
    renderPage(res, req, '/actions/transfer.ejs', {
      alert: alertmsg,
      error: errormsg,
      bots,
    });
  });
  //certification bot
  app.post('/bots/certification', checkAuth, async (req, res) => {
    let alertmsg;
    let errormsg;
    if (req.body.submit) {
      let bot = await BOTS.findOne({ botID: req.body.botID });
      if (!bot) errormsg = 'Error occured while certification';
      else if (!check(req.user.id))
        errormsg = 'You are not in the support server';
      else if (bot.main_owner !== req.user.id)
        errormsg = 'You are not the owner of this bot';
      else if (bot.type !== 'approved') errormsg = 'This bot is at queue';
      else if (!check(bot.botID))
        errormsg = "This bot isn't at server ask staff to add";
      else if (bot.pending_cert)
        errormsg = 'This bot is awaiting certification';
      else if (bot.certified) errormsg = 'This bot is already certified';
      else {
        bot.pending_cert = true;
        bot.vanity = bot.botName.split(' ').join('-').toLowerCase();
        bot.cert_reason = req.body.cert_reason;
        await bot.save();
        alertmsg = `Your bot has been added to certification queue`;
        add_role(bot.botID, config.pending_cert);

        const botCertificationQueue = new MessageEmbed()
          .setTitle('**__Certification Added:__**')
          .setColor('#0d79fc')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('Bot:', `<@${bot.botID}> (${bot.botName})`, true)
          .addField('Owner:', `<@${req.user.id}>`, true)
          .addField('Bot Page:', `${config.domain}/bots/${bot.botID}`, false)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        send_dm(bot.main_owner, botCertificationQueue);
        //send_botlogs(`${await config.staff_man}`);
        send_botlogs(botCertificationQueue);
      }
    }
    let bots = await BOTS.find({
      main_owner: req.user.id,
      type: 'approved',
      pending_cert: false,
      certified: false,
    });
    renderPage(res, req, '/actions/certification.ejs', {
      alert: alertmsg,
      error: errormsg,
      bots,
    });
  });

  //certification panel
  app.post('/panel/certification', checkAuth, async (req, res) => {
    if (!is_admin(req.user.id)) return res.redirect('/panel');
    let alertmsg;
    let errormsg;
    if (req.body.certify) {
      let bot = await BOTS.findOne({ botID: req.body.certify });
      if (!bot) errormsg = 'Error occured while certification';
      else if (!check(bot.main_owner))
        errormsg = 'Owner not in the support server';
      else if (bot.certified) errormsg = 'Bot it already certified!';
      else if (!check(bot.botID)) errormsg = "This bot isn't at server add it";
      else if (!bot.pending_cert)
        errormsg = 'This bot is not awaiting certification';
      else {
        let staff = await USERS.findOne({ userID: req.user.id });
        if (staff) {
          staff.new_staff_stats.set(
            'certified_bots',
            staff.new_staff_stats.get('certified_bots') + 1,
          );
          await staff.save();
        }
        bot.pending_cert = false;
        bot.certified = true;
        bot.vanity = bot.botName.split(' ').join('-').toLowerCase();
        await bot.save();
        alertmsg = `${bot.botName} has been certified!`;
        remove_role(bot.botID, config.pending_cert);
        await add_role(bot.botID, config.certified_bot);
        await add_role(bot.main_owner, config.certified_dev);
        new_user(bot.main_owner);

        const botCertificationApproved = new MessageEmbed()
          .setTitle('**__Certification Approved:__**')
          .setColor('#ad5313')
          .setThumbnail(client.user.displayAvatarURL())
          .addField('Bot:', `<@${bot.botID}> (${bot.botName})`, true)
          .addField('Owner:', `<@${bot.main_owner}>`, true)
          .addField('Bot Page:', `${config.domain}/bots/${bot.botID}`, true)
          .addField('Moderator:', req.user.username, true)
          .addField('Feedback:', req.body.cert_reason, false)
          .setTimestamp()
          .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

        send_dm(bot.main_owner, botCertificationApproved);
        send_modlogs(botCertificationApproved);
        send_stafflogs(botCertificationApproved);
      }
    } else if (req.body.uncertify) {
      let bot = await BOTS.findOne({ botID: req.body.uncertify });
      if (!bot) errormsg = 'Error occurred while decertification';
      else if (!check(bot.botID)) errormsg = "This bot isn't at server add it";
      else if (!bot.pending_cert)
        errormsg = 'This bot is not awaiting certification';
      else {
        bot.pending_cert = false;
        bot.vanity = bot.botName.split(' ').join('-').toLowerCase();
        await bot.save();
        alertmsg = `${bot.botName} has been uncertified!`;
        await remove_role(bot.botID, config.pending_cert);
        new_user(bot.main_owner);
        send_dm(
          bot.main_owner,
          `Your bot **${bot.botName}** certification was denied:\n**Reason:** \`${req.body.cert_reason}\``,
        );
        send_botlogs(
          `<@${bot.botID}> (\`${bot.botName}\`) by: <@${bot.main_owner}> certification was denied by: <@${req.user.id}>`,
        );
        send_stafflogs(
          `**${bot.botName}** certification was denied by: **${req.user.username}**\n**Reason:** \`${req.body.cert_reason}\``,
        );
      }
    }
    let bots = await BOTS.find({
      main_owner: req.user.id,
      type: 'approved',
      pending_cert: true,
      certified: false,
    });
    renderPage(res, req, '/panel/cert.ejs', {
      alert: alertmsg,
      error: errormsg,
      bots,
    });
  });

  //bot page
  app.post('/bots/:id', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    let owners = [bots.main_owner];
    bots.additional_owners.map((owner) => owners.push(owner));

    if (
      (req.user && is_staff(req.user.id)) ||
      (req.user && owners.includes(req.user.id))
    ) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots)
        bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }

    let reviews = await REVS.find({ botID: bots.botID }).sort([
      ['date', 'descending'],
    ]);
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    let getAverage = (array) => {
      if (array.length === 0) return 5;
      let popularitySum = 0;
      let itemsFound = 0;
      let len = array.length;
      let item = null;
      for (let i = 0; i < len; ++i) {
        item = array[i];
        popularitySum = parseInt(item.star_rate) + popularitySum;
        itemsFound = itemsFound + 1;
      }
      const averagePopularity = popularitySum / itemsFound;

      return averagePopularity;
    };
    let time = (time) => {
      return require('ms')(Date.now() - time, { long: true });
    };
    let alertmsg;
    let errormsg;
    var announce_msg = converter.makeHtml(bots.announce_msg);
    var desc;
    let isUrl = url2(bots.long.replace('\n', '').replace(' ', ''));
    if (isUrl)
      desc = `<iframe src="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"><object data="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"><embed src="${bots.long
        .replace('\n', '')
        .replace(
          ' ',
          '',
        )}" width="600" height="400" style="width: 100%; height: 100vh; color: black;"> </embed>${bots.long
        .replace('\n', '')
        .replace(' ', '')}</object></iframe>`;
    else if (bots.long) desc = converter.makeHtml(bots.long);
    else desc = bots.long;
    for (i = 0; i < owners.length; i++) {
      await client.users.fetch(owners[i]).catch(() => {});
    }
    for (i = 0; i < reviews.length; i++) {
      await client.users.fetch(reviews[i].author).catch(() => {});
    }

    //actions
    if (req.body.token) {
      if (owners.includes(req.user.id))
        alertmsg = `Your API Token: ${bots.token}`;
    }
    if (req.body.announce) {
      bots.announce_msg = req.body.announce_msg;
      bots.announce = req.body.announce_check == 'on' ? true : false;
      bots.save();
      alertmsg = 'Your Announcement Message Has Been Updated!';
      announce_msg = converter.makeHtml(bots.announce_msg);
    }
    if (req.body.generate_token) {
      if (owners.includes(req.user.id)) {
        let new_token = generate_token(100);
        bots.token = new_token;
        await bots.save();
        alertmsg = `New API Token: ${new_token}`;
      }
    }
    if (req.body.delete) {
      let del_embed_1 = new MessageEmbed()
        .setTitle('**__Deleted Bot:__**')
        .setColor('RED')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription(`Your bot has been Deleted from our Bot List.`)
        .addField('Bot(s):', `${bots.botName}`)
        .setTimestamp()
        .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

      let del_embed_2 = new MessageEmbed()
        .setTitle('**__Deleted Bot:__**')
        .setColor('RED')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription('Looks like a bot has been deleted from our list.')
        .addField('Bot(s):', `<@${bots.botID}> (\`${bots.botName}\`)`)
        .addField('User:', `<@${bots.main_owner}>`)
        .setTimestamp()
        .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

      let del_embed_3 = new MessageEmbed()
        .setTitle('**__Deleted Bot:__**')
        .setColor('RED')
        .setThumbnail(client.user.displayAvatarURL())
        .setDescription('Looks like a bot has been deleted from our list.')
        .addField('Bot(s)', `<@${bots.botID}> (\`${bots.botName}\`)`)
        .addField('User:', `<@${bots.main_owner}>`)
        .setTimestamp()
        .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

      if (bots.main_owner === req.user.id) {
        await send_dm(bots.main_owner, del_embed_1);
        await send_modlogs(del_embed_2);
        await send_stafflogs(del_embed_3);
        await bots.deleteOne();
        await new_user(bots.main_owner);
        await kick(bots.botID);
        await votes_fix();
        owners.map((owner) => {
          new_user(owner);
          roles_fix(owner);
        });
        await roles_fix(bots.main_owner);
        await reviews_fix(bots.botID);
        return res.redirect('/');
      }
    }
    if (req.body.archive) {
      if (bots.main_owner === req.user.id) {
        if (bots.type == 'denied') errormsg = 'The bot is already archived!';
        else {
          let arch_embed_1 = new MessageEmbed()
            .setTitle('**__Archived Bot:__**')
            .setColor('RED')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription(
              `Your bot has been Archived and will need to be Resubmitted!`,
            )
            .addField('Bot(s):', `${bots.botName}`)
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          let arch_embed_2 = new MessageEmbed()
            .setTitle('**__Archived Bot:__**')
            .setColor('RED')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('Looks like a bot has been archived.')
            .addField('Bot(s):', `<@${bots.botID}> (\`${bots.botName}\`)`)
            .addField('User:', `<@${bots.main_owner}>`)
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          let arch_embed_3 = new MessageEmbed()
            .setTitle('**__Archived Bot:__**')
            .setColor('RED')
            .setThumbnail(client.user.displayAvatarURL())
            .setDescription('Looks like a bot has been archived.')
            .addField('Bot(s):', `<@${bots.botID}> (\`${bots.botName}\`)`)
            .addField('User:', `<@${bots.main_owner}>`)
            .setTimestamp()
            .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

          await send_dm(bots.main_owner, arch_embed_1);
          await send_modlogs(arch_embed_2);
          await send_stafflogs(arch_embed_3);
          await new_user(bots.main_owner);
          await kick(bots.botID);
          await roles_fix(bots.main_owner);
          owners.map((owner) => {
            new_user(owner);
            roles_fix(owner);
          });
          bots.type = 'denied';
          await bots.save();
          alertmsg = 'Your bot has been archived successfully!';
        }
      }
    }

    if (req.body.like) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.author,
      });
      if (!review)
        return res.json({ error: true, message: "Couldn't find that review" });
      else {
        let check = review.likes.get(req.user.id);
        if (review.likes.get(req.user.id)) review.likes.delete(req.user.id);
        else review.likes.set(req.user.id, 1);
        if (review.dislikes.get(req.user.id))
          review.dislikes.delete(req.user.id);
        await review.save();
        return res.json({
          error: false,
          likes: review.likes.size,
          dislikes: review.dislikes.size,
          check,
        });
      }
    }
    if (req.body.dislike) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.author,
      });
      if (!review)
        return res.json({ error: true, message: "Couldn't find that review" });
      else {
        let check = review.dislikes.get(req.user.id);
        if (review.dislikes.get(req.user.id))
          review.dislikes.delete(req.user.id);
        else review.dislikes.set(req.user.id, 1);
        if (review.likes.get(req.user.id)) review.likes.delete(req.user.id);
        await review.save();
        return res.json({
          error: false,
          dislikes: review.dislikes.size,
          likes: review.likes.size,
          check,
        });
      }
    }
    if (req.body.delete_review) {
      if (!req.user) res.json({ error: true, message: 'Unauthorized request' });
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.author,
      });
      if (!review)
        res.json({ error: true, message: "Couldn't find that review" });
      else if (!is_root(req.user.id))
        res.json({
          error: true,
          message: 'Sorry chief! You cannot perform this action',
        });
      else {
        await review.deleteOne();
        reviews = await REVS.find({ botID: bots.botID });
        return res.json({
          reviews: reviews.length,
          average: getAverage(reviews),
        });
      }
    }
    if (req.body.delete_reply) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.author,
      });
      if (!review)
        res.json({ error: true, message: "Couldn't find that review" });
      else if (!req.user.id === bots.main_owner)
        res.json({
          error: true,
          message: 'Sorry chief! You cannot perform this action!',
        });
      else {
        review.replies.delete(req.body.reply);
        await review.save();
      }
    }
    if (req.body.flag_review) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.author,
      });
      if (!review) errormsg = "Couldn't find that review";
      else if (req.user.id !== bots.main_owner)
        errormsg = 'You are not the owner of bot!';
      else {
        review.flagged = review.flagged ? false : true;
        await review.save();
        return res.json({ content: review.content, flagged: review.flagged });
      }
    }
    if (req.body.add_reply) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.add_reply,
      });
      if (!review) errormsg = "Couldn't find that review";
      else if (!req.user.id === bots.main_owner)
        errormsg = 'You are not the owner of the bot!';
      else if (review.replies.size >= 1)
        errormsg = "You can't reply twice to same review!";
      else {
        review.replies.set(req.body.reply, Date.now());
        await review.save();
        reviews = await REVS.find({ botID: bots.botID }).sort([
          ['date', 'descending'],
        ]);
        alertmsg = 'Your review has been added!';
      }
    }
    if (req.body.edit_review) {
      let review = await REVS.findOne({
        botID: bots.botID,
        author: req.body.edit_review,
      });
      if (!review) errormsg = "Couldn't find that review";
      else if (req.user.id !== review.author)
        errormsg = 'You are not the writer of review!';
      else {
        review.content = req.body.review_edits;
        if (!review.edited) review.edited = true;
        await review.save();
        reviews = await REVS.find({ botID: bots.botID }).sort([
          ['date', 'descending'],
        ]);
        alertmsg = 'Your review has been changed!';
      }
    }
    //re add
    bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });

    renderPage(res, req, '/bots/botpage.ejs', {
      bots,
      owners,
      fetch,
      reviews,
      desc,
      isUrl,
      announce_msg,
      time,
      getAverage,
      alert: alertmsg,
      error: errormsg,
    });
  });
  // bot package
  app.post('/packs/:name', checkAuth, async (req, res) => {
    let pack = await PACKS.findOne({ url: req.params.name });
    let user = await USERS.findOne({ userID: req.user.id });
    if (!user) user = await new_user(req.user.id);
    let alertmsg;
    let errormsg;
    if (!pack) return found(req, res);

    if (req.body.vote) {
      if (user.pack_votes.get(pack.name)) {
        user.pack_votes.delete(pack.name);
        pack.votes = pack.votes - 1;
        alertmsg = 'Your vote has been removed!';
      } else {
        user.pack_votes.set(pack.name, Date.now());
        pack.votes = pack.votes - +-1;
        alertmsg = 'Your vote has been added!';
      }
      await pack.save();
      await user.save();
    }
    if (req.body.delete && req.user.id == pack.owner) {
      await pack.deleteOne();
      await pack_votes_fix();
      send_botlogs(`<@${req.user.id}> deleted: (\`${pack.name}\`) Bot Pack`);
      return res.redirect('/');
    }
    renderPage(res, req, '/actions/pack.ejs', {
      alert: alertmsg,
      error: errormsg,
      pack,
      visitor: user,
    });
  });
  //vote bot
  app.post('/bots/:id/vote', checkAuth, async (req, res) => {
    let user = await USERS.findOne({ userID: req.user.id });

    if (!user) user = await new_user(req.user.id);

    let newApiToken = generate_token(120);

    user.apiToken = newApiToken;

    await user.save();

    console.log(user.apiToken);

    // Until v4 is released, we use Popplio for voting
    let resData = await request(
      `http://localhost:8080/users/${req.user.id}/bots/${req.params.id}/votes`,
      {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `User ${newApiToken}`,
        },
      },
    );

    let alertmsg;
    let errormsg;

    console.log(resData.ok);

    if (resData.ok) {
      alertmsg = 'Successfully voted for this bot!';
    } else {
      let json = await resData.json();
      console.log(json);
      errormsg =
        json.message ||
        "Something happened and we couldn't cast a vote for this bot";
    }

    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!user) user = await new_user(req.user.id);
    if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
    if (!bots) return found(req, res);
    let fetch = await client.users.fetch(bots.botID).catch(() => {});

    renderPage(res, req, '/actions/vote.ejs', {
      alert: alertmsg,
      error: errormsg,
      fetch,
      bots,
    });
  });

  // review bot
  app.post('/bots/:id/review', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    if ((req.user && is_staff(req.user.id)) || req.user.id == bots.main_owner) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }
    let owners = [bots.main_owner];
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    let errormsg;
    bots.additional_owners.map((owner) => owners.push(owner));

    if (req.body.add_review) {
      let check = await REVS.findOne({
        author: req.user.id,
        botID: bots.botID,
      });
      if (req.body.content.length < 5)
        errormsg = 'Review content cannot be less than 5 charactars!';
      else if (owners.includes(req.user.id))
        errormsg = "Owners can't review to their bots!";
      else if (check)
        errormsg = "You can't add more than two reviews for same bots!";
      else {
        await new REVS({
          botID: bots.botID,
          author: req.user.id,
          content: req.body.content,
          star_rate: isNaN(req.body.star)
            ? 1
            : req.body.star > 5
            ? 1
            : req.body.star < 1
            ? 1
            : req.body.star,
          rate: req.body.rate == 'positive' ? true : false,
          date: Date.now(),
        }).save();
        return res.redirect(`/bots/${bots.botID}`);
      }
    }
    renderPage(res, req, '/actions/review.ejs', {
      alert: null,
      error: errormsg,
      fetch,
    });
  });
  // premium system
  app.post('/premium', checkAuth, async (req, res) => {
    let bot = await BOTS.findOne({ botID: req.body.botID });
    if (!bot) return res.redirect('/');
    if (bot.premium) {
      return new_page(req, res, {
        small_text: `${bot.botName} is already premium!`,
        big_text: 400,
        title_text: 'Premium',
      });
    }
    const create_payment_json = {
      intent: 'sale',
      payer: {
        payment_method: 'paypal',
      },
      redirect_urls: {
        return_url: `${domain}/payments`,
        cancel_url: `${domain}/`,
      },
      transactions: [
        {
          item_list: {
            items: [
              {
                name: req.body.year
                  ? '1 year'
                  : req.body.month
                  ? '30 days'
                  : req.body.three_months
                  ? '90 days'
                  : '30 days',
                sku: '001',
                price: req.body.year
                  ? '20.00'
                  : req.body.month
                  ? '3.00'
                  : req.body.three_months
                  ? '10.00'
                  : '4.99',
                currency: 'USD',
                quantity: 1,
              },
            ],
          },
          amount: {
            currency: 'USD',
            total: req.body.year
              ? '20.00'
              : req.body.month
              ? '3.00'
              : req.body.three_months
              ? '10.00'
              : '4.99',
          },
          description: `Paid Promotion at Infinity Bot List for ${bot.botName}`,
        },
      ],
    };

    paypal.payment.create(create_payment_json, function (error, payment) {
      if (error) {
        throw error;
      } else {
        for (let i = 0; i < payment.links.length; ++i) {
          if (payment.links[i].rel === 'approval_url') {
            res.redirect(payment.links[i].href);
            payments.set('botID', bot.botID);
            payments.set(
              'Invoice',
              req.body.year
                ? '20.00'
                : req.body.month
                ? '3.00'
                : req.body.three_months
                ? '10.00'
                : '4.99',
            );
          }
        }
      }
    });
  });
  // report bot
  app.post('/bots/:id/report', checkAuth, async (req, res) => {
    let bots = await BOTS.findOne({ botID: req.params.id });
    let alertmsg;
    let errormsg;
    if (!bots)
      bots = await BOTS.findOne({ vanity: req.params.id, certified: true });
    if (!bots) return found(req, res);

    if ((req.user && is_staff(req.user.id)) || req.user.id == bots.main_owner) {
      bots = await BOTS.findOne({ botID: req.params.id });
      if (!bots) bots = await BOTS.findOne({ vanity: req.params.id });
      if (!bots) return found(req, res);
    } else {
      bots = await BOTS.findOne({ botID: req.params.id, type: 'approved' });
      if (!bots)
        bots = await BOTS.findOne({
          vanity: req.params.id,
          type: 'approved',
          certified: true,
        });
      if (!bots) return found(req, res);
      if (req.params.id == 'none') return found(req, res);
    }
    let fetch = await client.users.fetch(bots.botID).catch(() => {});
    let owner = await client.users.fetch(bots.main_owner).catch(() => {});
    if (req.body.submit) {
      if (req.body.report_desc.length < 100)
        errormsg = 'Report content cannot be less than 100 charactars!';
      else if (req.body.report_desc.length > 2000)
        errormsg = 'Report content cannot be more than 2000 charactars!';
      else {
        let r = client.guilds.cache
          .get(config.staffGuild)
          .roles.cache.find((r) => r.id === '870950609291972622');

        await client.guilds.cache
          .get(config.staffGuild)
          .channels.cache.get(config.reports2)
          .send(`${r}`);

        client.guilds.cache
          .get(config.staffGuild)
          .channels.cache.get(config.reports2)
          .send(
            new MessageEmbed()
              .setAuthor(
                `${fetch.username} has been reported!`,
                fetch.displayAvatarURL(),
              )
              .setDescription(
                `
      **Report Information:**
      BotID: (\`${bots.botID}\`)\nBotTag: (\`${fetch.tag}\`)\nOwnerID: (\`${
                  owner.id
                }\`)\nOwnerTag: (\`${owner.tag}\`)\nReporterID: (\`${
                  req.user.id
                }\`)\nReporterTag: (\`${
                  client.users.cache.get(req.user.id)
                    ? client.users.cache.get(req.user.id).tag
                    : req.user.username + '#UNKOWN'
                }\`)`,
              )
              .addField('**Information:**', `\`${req.body.report_desc}\``)
              .setColor('#fc0d79')
              .setFooter('© Copyright 2021 - 2022 - InfinityBotList'),
          )
          .then((msg) => {
            msg.react('✅');
            msg.react('❌');
          });
        alertmsg = 'Your report has been sent to our Trust and Safety Team!';
      }
    }
    renderPage(res, req, '/actions/report.ejs', {
      alert: alertmsg,
      error: errormsg,
      fetch,
      bots,
    });
  });
  // convert sources
  app.post('/convert', async (req, res) => {
    if (req.body.markdown) {
      let html_content = converter.makeHtml(req.body.content);
      return res.json({ content: html_content });
    }
    if (req.body.custom_webhook) {
      request(req.body.custom_webhook, {
        method: 'POST',
        headers: {
          Authorization: req.body.auth,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type: 'TEST',
          userID: 'TEST',
          botID: 'TEST',
          timeStamp: Date.now(),
        }),
      })
        .then(() => {
          res.json({ message: "We've sent a successful test 'POST' request" });
        })
        .catch(() => {
          res.json({
            message:
              "Error occurred, Couldn't find the webserver, make sure it's in url format",
          });
        });
    }
    if (req.body.webhook) {
      if (is_url(req.body.webhook)) {
        let webhook = new URL(req.body.webhook).pathname.toString().split('/');
        let webhookClient;
        if (webhook[3] && webhook[4])
          webhookClient = new WebhookClient(
            webhook[3].toString(),
            webhook[4].toString(),
          );
        if (webhookClient) {
          webhookClient
            .send(
              `⬆️ \`USERNAME\` voted for: <@USERNAME> (\`USERNAME\`)\n<${domain}/bots/USERNAME/vote>`,
              {
                username: 'InfinityBotList (TEST)',
                avatarURL: 'https://i.imgur.com/Z1jey6q.png',
              },
            )
            .catch(() => {});
          return res.json({ message: "We've sent a successful test request" });
        } else {
          return res.json({ message: 'Error occurred!' });
        }
      } else {
        return res.json({ message: 'Error occurred!' });
      }
    }
  });

  /** HANDLE WEBHOOKS AND CUSTOM WEBHOOKS */
  app.post('/api/v4/webhooks', async (req, res) => {
    /** CUSTOM WEBHOOKS */
    if (req.body.custom_webhook) {
      request(req.body.custom_webhook, {
        method: 'POST',
        headers: {
          Authorization: req.body.auth,
          'Content-Type': 'application/json',
        },

        body: JSON.stringify({
          type: 'TEST',
          userID: 'TEST',
          userName: 'TEST',
          botID: 'TEST',
          count: 'TEST',
          timeStamp: Date.now(),
        }),
      })
        .then(() => {
          res.json({
            message:
              'Okay, We have sent a successful request to the URL Provided!',
          });
        })
        .catch(() => {
          res.json({
            message:
              'Hmm, We were unable to test that Request. Please check the URL and try again',
          });
        });
    } else if (req.body.webhook) {
      /** DISCORD WEBHOOKS */
      if (is_url(req.body.webhook)) {
        let webhook = new URL(req.body.webhook).pathname.toString().split('/');

        let webhookClient;

        if (webhook[3] && webhook[4])
          webhookClient = new WebhookClient(
            webhook[3].toString(),
            webhook[4].toString(),
          );

        if (webhookClient) {
          webhookClient
            .send(
              `\`USERNAME\` has voted for: (\`USERNAME\`)\n${domain}/bots/USERNAME/vote`,
              {
                username: 'Infinity Bot List | TEST Request',
                avatarURL: client.user.displayAvatarURL({ dynamic: true }),
              },
            )
            .catch(() => {});

          return res.json({
            message:
              'Okay, We have sent a successful test request to the provided Discord Webhook',
          });
        } else {
          res.json({
            message:
              'Hmm, We were unable to send a request to that Discord Webhook. Please check the URL and Try Again',
          });
        }
      } else {
        res.json({
          message:
            'Hmm, We were unable to send a request to that Discord Webhook. Please check the URL and Try Again',
        });
      }
    }
  });

  //status handle
  app.use(function (req, res) {
    res.status(404);
    renderPage(res, req, '/status/404.ejs');
  });

  //Forbidden handle
  app.use(function (req, res) {
    res.status(403);
    renderPage(res, req, '/status/banned.ejs');
  });

  // Error Handle
  app.use(async function (error, req, res, next) {
    res.status(500);

    renderPage(res, req, '/status/500.ejs');

    let ErrorLog = new MessageEmbed()
      .setTitle('**__Internale Server Error:__**')
      .setColor('#fc0d0d')
      .setThumbnail(client.user.displayAvatarURL())
      .setDescription(`Error Log: ${error}`)
      .addField('Req Path:', `${req.path}`, true)
      .addField(
        'Triggered By:',
        `${req.isAuthenticated() ? req.user.username : 'User Not Logged In'}`,
        true,
      )
      .setTimestamp()
      .setFooter('© Copyright 2021 - 2022 - InfinityBotList');

    let LogChan = await client.guilds.cache
      .get('915000865537007686')
      .channels.cache.get('915000866648494096');

    LogChan.send(ErrorLog).catch((err) => {
      console.log(
        `Unable to Log a Internal Error but you can still find it Below`,
      );
    });

    console.log(error);
  });

  //start app
  app.listen(config.port, null, null, () =>
    console.log(`Bot List is active at port: ${config.port}.`),
  );
};
