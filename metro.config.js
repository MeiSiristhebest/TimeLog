const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require("nativewind/metro");
const { resolve } = require("metro-resolver");

const config = getDefaultConfig(__dirname);
const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  const rewrittenModuleName =
    moduleName === "event-target-shim/index" || moduleName === "event-target-shim/index.js"
      ? "event-target-shim"
      : moduleName;

  if (originalResolveRequest) {
    return originalResolveRequest(context, rewrittenModuleName, platform);
  }

  return resolve(context, rewrittenModuleName, platform);
};

module.exports = withNativeWind(config, { input: "./global.css" });
