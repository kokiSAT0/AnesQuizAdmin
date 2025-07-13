// components/TextStyles.ts ファイル
import { StyleSheet, Dimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

/** 端末幅に応じて 1 段階だけ可変させる例 */
const baseSize = Dimensions.get('window').width < 350 ? 18 : 20;

export const createQuestionTextStyle = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    question: {
      fontSize: baseSize * 1.1,
      lineHeight: baseSize * 1.6,
      fontWeight: '400',
      color: theme.colors.onBackground,
      textAlign: 'center',
    },
  });
