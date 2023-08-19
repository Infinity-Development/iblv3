//Website
exports.port = process.env.PORT || 4458;
exports.domain = 'https://infinitybots.gg';
exports.domain_short = 'https://botlist.site';
exports.api_domain = 'https://api.infinitybotlist.com';

//Bot Info
exports.token = 'BOT_TOKEN'; // Main Bot
exports.clientSecret = 'CLIENT_SECRET'; // Main Bot
exports.id = '815553000470478850'; // Main Bot
exports.prefix = 'ibl.'; // Main Bot

// Other Info
(exports.main_owner = [
  '510065483693817867', // Toxic Dev (Owner)
  '896951964234043413', // Toxics Elixir (Co-Owner)
]),
  (exports.server = 'https://infinitybotlist.com/discord');
exports.mongodb_url = process.env.MONGO;
exports.REDIS_URL = 'redis://127.0.0.1:6379/2';
exports.logo_url = 'https://i.imgur.com/ibzF3CE.png';

// Paypal
exports.client_id =
  'PAYPAL_CLIENT_ID';
exports.client_secret =
  'PAYPAL_CLIENT_SECRET';

// Weekend Vote
exports.weekend = false;

// Maintenance Mode
exports.maintenance = false;

//Libs
exports.librarys = [
  'AckCord',
  'aegis.cpp',
  'BDScript',
  'catnip',
  'detritus-client',
  'discord.js',
  'interactions.js',
  'Discord.Net',
  'discljord',
  'Discordia',
  'discordcr',
  'DSharpPlus',
  'dscord',
  'DiscordGo',
  'DisGord',
  'Discord4J',
  'Discordeno',
  'Discord Akairo',
  'discordrb',
  'Discord.jl',
  'Discord.py',
  'Discordia',
  'disco',
  'discord-rs',
  'Eris',
  'Jarvis.djs',
  'Javacord',
  'JDA',
  'RestCord',
  'Serenity',
  'Sword',
  'TypeScript',
  'Custom Library',
];

//Tags
exports.tags = [
  'Auto-Mod',
  'Anti-Raid',
  'Anti-Nuke',
  'Moderation',
  'Fall Guys',
  'Fun',
  'Social',
  'Fortnite',
  'Among Us',
  'Dashboard',
  'Utility',
  'NSFW',
  'Trivia',
  'Multipurpose',
  'Games',
  'Giveaway',
  'Security',
  'Messages',
  'Music',
  'Economy',
  'Leveling',
  'Role Play',
  'Role Management',
  'Reddit',
  'Logging',
  'Quiz',
  'Customizable Prefix',
  'Configuration',
  'Crypto',
  'Slash Commands',
  'Soundboard',
  'Streaming',
  'Media',
  'NQN',
];

//Bot Logs
exports.voteLogs = '762077981811146752';
exports.botLogs = '762077915499593738';
exports.modLogs = '911907978926493716';
exports.staff_botLogs = '870950610692878343';
exports.stafflogs = '870950610692878343';

// Guild ID's
exports.guildID = '758641373074423808';
exports.staffGuild = '870950609291972618';

// Server Config
exports.welcome = '762958420277067786';
exports.rules = '758642704782589973';
exports.mute = '798961174422487082';
exports.audit_logs = '762964127802064906';
exports.suggestions = '779304353050787870';
exports.reports = '870950610692878344';
exports.reports2 = '870950610692878344';
exports.linkedStatus = '771037723422228501';

// Role List
exports.staff_man = '872034848200597505';
exports.staff = '762371586434793472';
exports.pending_cert = '817811017210920961';
exports.certified_dev = '759468303344992266';
exports.certified_bot = '759468236999491594';
exports.staff_bot = '758652607203115018';
exports.pending = '817811440991469599';
exports.bots = '758652296459976715';
exports.developer = '758756147313246209';

// Announcements/News
exports.news = [
  {
    title: 'Slash Commands Support',
    content:
      'Slash Commands are now fully supported here at IBL. Feel free to update your bots Invite Links. We have also added a Slash Commands tag for Bots',
    publisher: 'Toxic Dev#5936',
    date: '12/11/2021',
  },
  {
    title: 'Welcome Back to our News Section',
    content:
      'We have re-enabled this News Section to help keep our Members Up-To Date with our Updates and Information',
    publisher: 'Toxic Dev#5936',
    button: 'https://blog.botlist.app',
    button_name: 'Check our Blog',
    date: '12/11/2021',
  },
];

/**
 * Staff Roles
 *
 * team = Website Mods
 * root = Owner, Co-Owner.
 * admins = Head Staff, Staff Managers.
 * sitedevelopers = Development Team
 */

exports.team = [
  '759180080328081450', // intehdark.org
  '510065483693817867', // Toxic Dev (Owner)
  '691648449967554590', // Jonah (Staff Manager)
  '405497010385321995', // Roman (Website Mod)
  '896951964234043413', // Toxics Elixir (Co-Owner)
  '563808552288780322', // Rootspring (Developer/Website Mod)
  '899722893603274793', // ZeroTwo (Developer/Website Mod)
  '567885938160697377', // Anaxes (Developer/Website Mod)
  '303278996932526084', // Rizon (Developer/Website Mod)
  '865420570103644181', // DildonLIVE (Developer)
  '837916741388599297', // Scemer JR (Website Mod)
  '728871946456137770', // Burgerking
  '564164277251080208', // Select
  '727590288209608824', // Fynn (Website Mod)
  '852929535120638003', // Tom
  '642308656217456641', // NotYourAbu (Website Mod)
];

exports.root = [
  '510065483693817867', // Toxic Dev (Owner)
  '896951964234043413', // Toxics Elixir (Co-Owner)
  '691648449967554590', // Jonah (Staff Manager)
  '728871946456137770', // Burgerking (Head Developer)
];

exports.admins = [
  '510065483693817867', // Toxic Dev (Owner)
  '896951964234043413', // Toxics Elixir (Co-Owner)
  '691648449967554590', // Jonah (Staff Manager)
  '728871946456137770', // Burgerking
];

exports.sitedevelopers = [
  '510065483693817867', // Toxic Dev (Owner)
  '567885938160697377', // Anaxes (Head Developer/Website Mod)
  '303278996932526084', // Rizon (Developer/Website Mod)
  '899722893603274793', // ZeroTwo (Developer/Website Mod)
  '563808552288780322', // Rootspring (Developer/Website Mod)
  '865420570103644181', // DildonLIVE (Head Developer)
  '728871946456137770', // Burgerking
  '759180080328081450', // inthedark.org
];

exports.metrokey = 'METRO_KEY';
