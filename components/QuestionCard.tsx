// components/QuestionCard.tsx
// 問題表示用カードコンポーネント。カテゴリ表示と共通スタイルをまとめる

import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Text, useTheme } from 'react-native-paper';
import { AntDesign } from '@expo/vector-icons';

import { ResponsiveText } from '@/components/ResponsiveText';
import { createQuestionTextStyle } from '@/components/TextStyles';
import type { Question } from '@/types/question';

// 親から渡すプロパティの型定義
export type QuestionCardProps = {
  question: Question;
  /** 外枠の線色を画面側で指定 */
  borderColor: string;
  onToggleFavorite: () => void;
  onToggleUsed: () => void;
};

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  borderColor,
  onToggleFavorite,
  onToggleUsed,
}) => {
  const theme = useTheme();
  const tStyles = createQuestionTextStyle(theme);

  const styles = createStyles(theme);

  return (
    <View style={[styles.card, { borderColor }]}>
      {/* ─ カテゴリ表示エリア ─ */}
      <View style={styles.categoryRow}>
        {question.categories.map((cat) => (
          <View key={cat} style={styles.categoryChip}>
            <Text style={styles.categoryText}>{cat}</Text>
          </View>
        ))}
      </View>

      {/* 問題文表示 */}
      <ResponsiveText text={question.question} style={tStyles.question} />

      {/* 使用中フラグ切替ボタン */}
      <Pressable onPress={onToggleUsed} style={styles.usedBtn}>
        {question.is_used ? (
          <AntDesign
            name="checkcircle"
            size={24}
            color={theme.colors.onBackground}
          />
        ) : (
          <AntDesign
            name="closecircleo"
            size={24}
            color={theme.colors.onBackground}
          />
        )}
      </Pressable>

      {/* お気に入り切替ボタン */}
      <Pressable onPress={onToggleFavorite} style={styles.favoriteBtn}>
        {question.is_favorite ? (
          <AntDesign name="star" size={24} color={theme.colors.onBackground} />
        ) : (
          <AntDesign name="staro" size={24} color={theme.colors.onBackground} />
        )}
      </Pressable>
    </View>
  );
};

// スタイルはテーマから色を受け取って生成します
const createStyles = (theme: ReturnType<typeof useTheme>) =>
  StyleSheet.create({
    card: {
      margin: 16,
      padding: 24,
      borderWidth: 1,
      borderRadius: 16,
      minHeight: 140,
      justifyContent: 'center',
    },
    categoryRow: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      position: 'absolute',
      top: 8,
      left: 8,
      right: 48,
    },
    categoryChip: {
      backgroundColor: theme.colors.categoryChip,
      paddingHorizontal: 8,
      paddingVertical: 4,
      borderRadius: 12,
      marginRight: 4,
      marginBottom: 4,
    },
    categoryText: {
      fontSize: 12,
      color: theme.colors.onSurfaceVariant,
    },
    favoriteBtn: {
      position: 'absolute',
      top: 12,
      right: 12,
    },
    usedBtn: {
      position: 'absolute',
      top: 12,
      right: 48,
    },
  });
