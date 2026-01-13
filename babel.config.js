module.exports = function (api) {
  api.cache(true);
  let plugins = [];
  plugins.push(['inline-import', { extensions: ['.sql'] }]);
  plugins.push('react-native-worklets/plugin');
  return {
    presets: [['babel-preset-expo', { jsxImportSource: 'nativewind' }], 'nativewind/babel'],
    plugins,
  };
};
