// theme/colors.d.ts
import 'react-native-paper';
import { ColorScheme } from './tokens';

declare module 'react-native-paper' {
  // tokens.light / tokens.dark に書いたキーを ThemeColors に取り込む
  interface ThemeColors extends ColorScheme {}
}
