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
  ios: {
    ...(appJson.expo.ios ?? {}),
    bundleIdentifier: 'com.anesquiz.mobile', // ⾃由に決定（Apple Dev 上でも登録）
    supportsTablet: true,
    // 広告トラッキング許可ダイアログの文言を追加
    infoPlist: {
      ...(appJson.expo.ios?.infoPlist ?? {}),
      NSUserTrackingUsageDescription: '広告配信のために端末識別子を利用します',
      // 将来的に音声録音機能を追加する場合は以下も定義する
      // NSMicrophoneUsageDescription: "マイクを使用して音声を録音します"
    },
  },
  // --- extra は前回までのマージを維持 ---
  extra: {
    ...appJson.expo.extra,
    ...config.extra,
    // EASビルドでは `EXPO_PUBLIC_` プレフィックスが付いた環境変数になるため
    // そちらが存在すれば優先し、無ければ通常の名前を参照する
    eas: {
      projectId: '293e5640-3337-4f93-9118-f307f1755da2',
      ...appJson.expo.extra?.eas,
    },
  },
});
