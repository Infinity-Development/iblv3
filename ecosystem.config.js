module.exports = {
  apps: [
    {
      name: 'InfinityBotList',
      script: 'index.js',
      instances: 1,
      exec_mode: 'cluster',
    },
  ],
};
