// components/TextStyles.ts ファイル
import { StyleSheet, Dimensions } from 'react-native';
// テーマ用の型を明示的に読み込む
import { useTheme, type MD3Theme } from 'react-native-paper';

/** 端末幅に応じて 1 段階だけ可変させる例 */
const baseSize = Dimensions.get('window').width < 350 ? 18 : 20;

// theme 引数は MD3Theme として受け取り、色補完を効かせる
export const createQuestionTextStyle = (theme: MD3Theme) =>
  StyleSheet.create({
    question: {
      fontSize: baseSize * 1.1,
      lineHeight: baseSize * 1.6,
      fontWeight: '400',
      color: theme.colors.onBackground,
      textAlign: 'center',
    },
  });
