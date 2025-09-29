// craco.config.js
const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: (webpackConfig) => {
      // Remove existing fallback if it exists
      webpackConfig.resolve.fallback = {
        ...webpackConfig.resolve.fallback,
        "http": false,
        "https": false,
        "querystring": require.resolve("querystring-es3"),
        "url": require.resolve("url/"),
        "crypto": false,
        "stream": false,
        "path": false,
        "fs": false,
        "zlib": false,
        "net": false,
        "tls": false,
        "child_process": false
      };
      
      return webpackConfig;
    }
  }
};