const React = require('react');
const reactModule = React.default ?? React;
const createElement = reactModule.createElement;

// Mock for react-native-css-interop module
module.exports = {
  cssInterop: function (component) {
    return component;
  },
  remapProps: function (component) {
    return component;
  },
  createInteropElement: function (type, props) {
    const children = Array.prototype.slice.call(arguments, 2);
    return createElement.apply(null, [type, props, ...children]);
  },
  StyleSheet: {
    create: function (styles) {
      return styles;
    },
  },
};
