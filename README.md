# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.

| ライブラリ / ツール          | 推奨バージョン (2025年)            | 備考                                   |
| ---------------------------- | ---------------------------------- | -------------------------------------- |
| Zustand                      | **5.0.4 以上**（v5 系）            | RN 0.79 対応の安定版                   |
| gluestack-ui                 | **v2（安定版）**                   | NativeWind v4.1 対応                   |
| Firebase (JS SDK)            | **11.x 系列**（例: 11.7.1）        | Expo Go で Firestore 利用可            |
| Jest                         | **29.7.x**（最新安定版）           | 安定版（v30 は大規模アップデート予定） |
| React Native Testing Library | **13.2.0**（v13 系 最新安定）      | React 18/19 & RN 0.78+ 対応            |
| GitHub Actions               | **最新安定**（公式 Actions v3 系） | バージョン番号は固定でなく最新版を推奨 |
| ESLint                       | **9.x 系列**（例: 9.26.0）         | Node 18+ 対応                          |
| Prettier                     | **3.x 系列**（例: 3.5.x）          | Prettier 3 + eslint-plugin-prettier 5  |
| husky                        | **9.x 系列**（例: 9.1.7）          | Git フックの最新安定版                 |
| lint-staged                  | **15.5.x**（最新安定版）           | Node 18+ 対応（v16 直近リリース予定）  |
| TypeScript                   | **5.8.x**（例: 5.8.3）             | Expo 推奨バージョン                    |
| @react-navigation/native     | **7.x 系列**（例: 7.1.9）          | React Navigation 7（最新）             |
| @react-navigation/stack      | **7.x 系列**（例: 7.3.1）          | React Navigation 7 対応版              |
