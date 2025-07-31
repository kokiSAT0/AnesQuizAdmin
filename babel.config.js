module.exports = function (api) {
  api.cache(true);

  return {
    presets: ['babel-preset-expo'],

    plugins: [
      [
        'module-resolver',
        {
          root: ['./'],
          // ルートパスのエイリアスを設定することで、
          // import 文で絶対パスを利用できるようにする
          alias: {
            '@': './',
          },
        },
      ],
      // Reanimated の Babel プラグインを最後に追加
      'react-native-reanimated/plugin',
    ],
  };
};
