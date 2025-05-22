const { getDefaultConfig } = require('expo/metro-config');
const config = getDefaultConfig(__dirname);

// --- Firebase などが持つ .cjs ファイルを解決できるようにする ---
if (!config.resolver.sourceExts.includes('cjs')) {
  config.resolver.sourceExts.push('cjs');
}

module.exports = config;
