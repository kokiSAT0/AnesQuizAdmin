const { getDefaultConfig } = require('expo/metro-config');

// デフォルト設定を取得
const config = getDefaultConfig(__dirname);

// SQLite ファイル(.db)もアセットとして扱えるように拡張
config.resolver.assetExts.push('db');

module.exports = config;
