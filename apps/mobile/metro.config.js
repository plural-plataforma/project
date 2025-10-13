const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Adicione o alias para resolver pacotes fora da raiz
config.resolver.extraNodeModules = {
  '@': path.resolve(__dirname, '../../../../packages'), // Ajuste conforme a estrutura
};

// Inclua a pasta packages como parte do projeto
config.watchFolders = [path.resolve(__dirname, '../../packages')];

module.exports = config;