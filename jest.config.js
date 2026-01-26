module.exports = {
  preset: 'jest-expo',
  setupFilesAfterEnv: ['<rootDir>/jest-setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?)|expo(nent)?|@expo(nent)?/.*|@expo-google-fonts/.*|react-navigation|@react-navigation/.*|@unimodules/.*|unimodules|sentry-expo|native-base|react-native-svg|drizzle-orm|nativewind|react-native-css-interop)',
  ],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    'react-native-css-interop/jsx-runtime': '<rootDir>/test-utils/css-interop-mock.js',
    'react-native-css-interop': '<rootDir>/test-utils/css-interop-module-mock.js',
    '\\.(wav|mp3|m4a)$': '<rootDir>/test-utils/audio-mock.js',
  },
  // Override babel to use standard React JSX instead of nativewind's custom runtime
  transform: {
    '^.+\\.(js|jsx|ts|tsx)$': [
      'babel-jest',
      {
        presets: [['babel-preset-expo', { jsxRuntime: 'automatic' }]],
      },
    ],
  },
};
