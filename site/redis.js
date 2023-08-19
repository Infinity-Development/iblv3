// Imports
const mongoose = require('mongoose');
const redis = require('redis');
const util = require('util');
const chalk = require('chalk');

// Tokens
const tokens = require('../config');

// Create redis client
const client = redis.createClient(tokens.REDIS_URL);
console.log(
  chalk.yellowBright('[WEB STARTUP]'),
  `Web connected to Redis Server.`,
);

// Allow promises
client.hget = util.promisify(client.hget);

// create reference for .exec
const exec = mongoose.Query.prototype.exec;

// create new cache function on prototype
mongoose.Query.prototype.cache = function (options = { expire: 60 }) {
  this.useCache = true;
  this.expire = options.expire;
  this.hashKey = JSON.stringify(options.key || this.mongooseCollection.name);

  return this;
};

// override exec function to first check cache for data
mongoose.Query.prototype.exec = async function () {
  if (!this.useCache) {
    return await exec.apply(this, arguments);
  }

  const key = JSON.stringify({
    ...this.getQuery(),
    collection: this.mongooseCollection.name,
  });

  // get cached value from redis
  const cacheValue = await client.hget(this.hashKey, key);

  // if cache value is not found, fetch data from mongodb and cache it
  if (!cacheValue) {
    const result = await exec.apply(this, arguments);
    client.hset(this.hashKey, key, JSON.stringify(result));
    client.expire(this.hashKey, this.expire);
    console.log(chalk.blueBright('[REDIS]'), 'Returning data from MongoDB');
    return result;
  }

  // return found cachedValue
  const doc = JSON.parse(cacheValue);
  console.log(
    chalk.blueBright('[REDIS]'),
    'Returning data from Redis', //doc
  );
  return Array.isArray(doc)
    ? doc.map((d) => new this.model(d))
    : new this.model(doc);
};

module.exports = {
  clearHash(hashKey) {
    client.del(JSON.stringify(hashKey));
  },
};
