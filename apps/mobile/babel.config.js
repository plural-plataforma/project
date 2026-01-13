module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      [
        'expo-router/babel',
        {
          root: './src',
        },
      ],
      [
        'module-resolver',
        {
          root: ['./src'],
          alias: {
            '@src': './src',
          },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
