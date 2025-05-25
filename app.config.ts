// app.config.ts
import { ExpoConfig, ConfigContext } from '@expo/config';
import appJson from './app.json';
import 'dotenv/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  // --- app.json をベースに ---
  ...appJson.expo,
  ...config,

  // --- Android 固有設定を追加 ---
  android: {
    ...(appJson.expo.android || {}), // 既存があれば保持
    ...(config.android || {}),
    package: 'com.anesquiz.mobile', // ← 決めたパッケージ名
    // optional: バージョンコードを固定したい場合
    // versionCode: 1,
  },

  // --- extra は前回までのマージを維持 ---
  extra: {
    ...appJson.expo.extra,
    ...config.extra,
    // EASビルドでは `EXPO_PUBLIC_` プレフィックスが付いた環境変数になるため
    // そちらが存在すれば優先し、無ければ通常の名前を参照する
    FIREBASE_API_KEY:
      process.env.EXPO_PUBLIC_FIREBASE_API_KEY ?? process.env.FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN ??
      process.env.FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID ??
      process.env.FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET ??
      process.env.FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ??
      process.env.FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID:
      process.env.EXPO_PUBLIC_FIREBASE_APP_ID ?? process.env.FIREBASE_APP_ID,
    eas: {
      ...appJson.expo.extra?.eas,
    },
  },
});
