// Simple mock for react-native-css-interop/jsx-runtime
// Uses inline functions to avoid require() hoisting issues with jest
module.exports = {
  jsx: function (type, props, key) {
    const React = require('react');
    return React.createElement(type, Object.assign({}, props, { key: key }));
  },
  jsxs: function (type, props, key) {
    const React = require('react');
    return React.createElement(type, Object.assign({}, props, { key: key }));
  },
  Fragment: 'Fragment',
};
