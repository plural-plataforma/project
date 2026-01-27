const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Start from Expo's default config and extend it safely
const projectRoot = __dirname;
const config = getDefaultConfig(projectRoot);

// Resolve packages folder (adjust relative path if your monorepo layout differs)
const packagesPath = path.resolve(projectRoot, '../../packages');

// Merge/extend extraNodeModules but avoid overwriting defaults
config.resolver = config.resolver || {};
config.resolver.extraNodeModules = Object.assign({}, config.resolver.extraNodeModules, {
  '@': path.resolve(projectRoot, '../../../../packages'),
});

// Ensure the watchFolders includes Expo defaults plus our packages folder
config.watchFolders = Array.isArray(config.watchFolders) ? config.watchFolders.slice() : [];
if (!config.watchFolders.includes(packagesPath)) {
  config.watchFolders.push(packagesPath);
}

module.exports = config;