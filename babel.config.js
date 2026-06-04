module.exports = function (api) {
  api.cache(true);
  return {
    presets: [['babel-preset-expo', { 'react-compiler': false }]],
    plugins: [
      ['@babel/plugin-proposal-decorators', { legacy: true }],
      ['@babel/plugin-proposal-class-properties', { loose: true }],
      'react-native-worklets/plugin',
    ],
  };
};