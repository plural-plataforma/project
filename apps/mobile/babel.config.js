module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'module-resolver',
        {
          cwd: 'packagejson',
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
          alias: {
            '@src': './src',
            '@packages/ui': '../../packages/ui'
          }
        }
      ]
      // Se um dia você usar animações com Reanimated, descomente a linha abaixo:
      // 'react-native-reanimated/plugin'
    ]
  };
};