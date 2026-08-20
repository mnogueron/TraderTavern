require('dotenv').config({ path: require('path').resolve(__dirname, '../../.env') });

const mongodbUri =
  process.env.MONGODB_URI || 'mongodb://localhost:27017/tradertavern';

const config = {
  mongodb: {
    url: mongodbUri,
    databaseName: new URL(mongodbUri).pathname.replace(/^\//, ''),
    options: {},
  },
  migrationsDir: 'migrations',
  changelogCollectionName: 'changelog',
  migrationFileExtension: '.js',
  useFileHash: false,
  moduleSystem: 'commonjs',
};

module.exports = config;
