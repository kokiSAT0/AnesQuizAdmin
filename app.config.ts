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
    eas: {
      ...appJson.expo.extra?.eas,
    },
  },
});
