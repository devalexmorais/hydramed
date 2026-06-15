const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

config.resolver.alias = {
  '@': path.resolve(__dirname, 'src'),
};

config.transformer.minifierConfig = {
  compress: {
    drop_console: false,
  },
};

module.exports = config;
