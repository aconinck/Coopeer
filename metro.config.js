const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Redirect react-native-maps to a no-op stub on web
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (platform === 'web' && moduleName === 'react-native-maps') {
    return {
      filePath: __dirname + '/src/components/map/PlatformMap.web.tsx',
      type: 'sourceFile',
    };
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
