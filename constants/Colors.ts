/**
 * ここではアプリで使用する色を定義します。ライトモードとダークモードで値を分けています。
 * スタイルの付け方には他にも [Tamagui](https://tamagui.dev/) や
 * [unistyles](https://reactnativeunistyles.vercel.app) などの方法があります。
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#11181C',
    background: '#fff',
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
  },
};
