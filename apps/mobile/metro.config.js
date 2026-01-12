const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);

const packagesPath = path.resolve(__dirname, '../../packages'); // ajuste conforme sua estrutura

module.exports = {
  ...defaultConfig,
  watchFolders: [
    ...(defaultConfig.watchFolders || []),
    packagesPath,
  ],
  resolver: {
    ...defaultConfig.resolver,
    extraNodeModules: {
      ...(defaultConfig.resolver.extraNodeModules || {}),
      '@': path.resolve(__dirname, '../../../../packages'), // ajuste o path relativo
      // adicione outros aliases se precisar
    },
  },
};