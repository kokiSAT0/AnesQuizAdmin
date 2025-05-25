// components/AppHeader.tsx
import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import { IconButton, Text, useTheme } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

type Props = {
  title: string;
  /** 戻るボタンを表示する場合のハンドラ。不要なら undefined */
  onBack?: () => void;
  /** 右端アイコン名（MaterialCommunityIcons のキー）。不要なら undefined */
  rightIcon?: string;
  /** 右端アイコンのハンドラ */
  onRightPress?: () => void;
  /** 画面ごとに背景色など上書きしたい場合 */
  additionalStyles?: ViewStyle;
};

export const AppHeader: React.FC<Props> = ({
  title,
  onBack,
  rightIcon,
  onRightPress,
  additionalStyles,
}) => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: theme.colors.background },
        additionalStyles,
      ]}
    >
      {onBack ? (
        <IconButton icon="arrow-left" onPress={onBack} />
      ) : (
        /* アイコン分のダミーで中央寄せを保つ */
        <View style={{ width: 48 }} />
      )}

      <Text
        variant="titleLarge"
        numberOfLines={1}
        adjustsFontSizeToFit
        style={styles.title}
      >
        {title}
      </Text>

      {rightIcon ? (
        <IconButton icon={rightIcon} onPress={onRightPress} />
      ) : (
        <View style={{ width: 48 }} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    /* ❶ “固定高さ” をやめて可変に */
    minHeight: 56,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    zIndex: 10,
    /* ❷ 子要素を縦方向中央に配置 */
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    textAlign: 'center',
    lineHeight: 24,
  },
});
