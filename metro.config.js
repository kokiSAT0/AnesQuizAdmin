const { getDefaultConfig } = require('expo/metro-config');

// Expo のデフォルト設定をそのまま利用
// getDefaultConfig: Expo が提供する Metro バンドラの標準設定を返す関数
module.exports = getDefaultConfig(__dirname);
