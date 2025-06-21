import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { useTheme } from 'react-native-paper';

export type LearningCalendarProps = {
  /** 日付文字列 YYYY-MM-DD をキーにした解答数 */
  logs: Record<string, number>;
};

/**
 * 直近35日分を表示する学習量カレンダー
 * GitHub の草表示を真似て1週7日×5週で表示します
 */
export function LearningCalendar({ logs }: LearningCalendarProps) {
  const { colors } = useTheme();
  const { width } = useWindowDimensions();

  // 画面幅からマス目サイズを計算（左右余白 32px を引く）
  const margin = 2;
  const cell = Math.floor((width - 32 - margin * 14) / 7);

  // 表示期間開始日（35日前）を求める
  const start = new Date();
  start.setDate(start.getDate() - 34);

  const squares: { key: string; count: number }[] = [];
  for (let i = 0; i < 35; i++) {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    const key = d.toISOString().slice(0, 10);
    squares.push({ key, count: logs[key] ?? 0 });
  }

  return (
    <View style={styles.container}>
      {squares.map(({ key, count }) => {
        const ratio = Math.min(count, 100) / 100;
        const opacity = 0.2 + 0.8 * ratio;
        return (
          <View
            key={key}
            style={[
              styles.cell,
              {
                width: cell,
                height: cell,
                margin,
                backgroundColor: colors.primary,
                opacity,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignSelf: 'center',
    marginBottom: 8,
  },
  cell: {
    borderRadius: 4,
  },
});
