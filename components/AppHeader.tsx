// components/AppHeader.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
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
};

export const AppHeader: React.FC<Props> = ({
  title,
  onBack,
  rightIcon,
  onRightPress,
}) => {
  const { top } = useSafeAreaInsets();
  const theme = useTheme();

  return (
    <View
      style={[
        styles.container,
        { paddingTop: top, backgroundColor: theme.colors.background },
      ]}
    >
      {onBack ? (
        <IconButton icon="arrow-left" onPress={onBack} />
      ) : (
        /* アイコン分のダミーで中央寄せを保つ */
        <View style={{ width: 48 }} />
      )}

      <Text variant="titleLarge" style={styles.title}>
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
    height: 56, // SafeArea 分は paddingTop で追加
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingHorizontal: 16,
    zIndex: 10,
  },
  title: {
    flex: 1,
    textAlign: 'center',
  },
});
