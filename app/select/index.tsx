import React, { useEffect, useState } from 'react';
import {
  View,
  Alert,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AppHeader } from '@/components/AppHeader';
import { Text, Button, Switch, Chip, Card, useTheme } from 'react-native-paper';
import { router } from 'expo-router';
import {
  getQuestionIdsByFilter,
  countQuestionsByFilter,
} from '@/src/utils/db/index';
import { SelectableChip } from '@/components/SelectableChip';
// 選択状態を管理する共通フック
import { useSelectionSet } from '@/hooks/useSelectionSet';
// 先ほどエクスポートした型をインポート
import type { SelectableChipProps } from '@/components/SelectableChip';

import { MaterialCommunityIcons } from '@expo/vector-icons';
import { CATEGORIES, Category } from '@/constants/Categories';

// 選択可能な難易度のリスト
const LEVELS = ['初級', '中級', '上級'] as const;
type Level = (typeof LEVELS)[number];

// カテゴリ一覧は共通定数から読み込む

const PROGRESS = ['正解', '不正解', '未学習'] as const;
type Progress = (typeof PROGRESS)[number];

// レベル選択用の Chip を表示するコンポーネント
// "Omit" は指定したプロパティを取り除くユーティリティ型です
const LevelChip: React.FC<Omit<SelectableChipProps, 'selectedColorToken'>> = (
  p,
) => <SelectableChip {...p} selectedColorToken="levelChipSelected" />;

const CategoryChip: React.FC<
  Omit<SelectableChipProps, 'selectedColorToken'>
> = (p) => <SelectableChip {...p} selectedColorToken="categoryChipSelected" />;

const ProgressChip: React.FC<
  Omit<SelectableChipProps, 'selectedColorToken'>
> = (p) => <SelectableChip {...p} selectedColorToken="progressChipSelected" />;

export default function SelectScreen() {
  const theme = useTheme();
  // 各種選択肢は useSelectionSet フックで共通管理します
  const levelSet = useSelectionSet<Level>([...LEVELS]);
  const categorySet = useSelectionSet<Category>([...CATEGORIES]);
  const progressSet = useSelectionSet<Progress>([...PROGRESS]);

  const [random, setRandom] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);

  // 選択条件の変更時に該当件数を再計算します
  useEffect(() => {
    (async () => {
      const count = await countQuestionsByFilter(
        levelSet.selected,
        categorySet.selected,
        favoriteOnly,
        progressSet.selected,
      );
      setMatchCount(count);
    })();
  }, [
    levelSet.selected,
    categorySet.selected,
    favoriteOnly,
    progressSet.selected,
  ]);

  const toggleLevel = (level: Level) => {
    levelSet.toggle(level);
  };

  const selectAllLevels = () => {
    levelSet.selectAll(LEVELS);
  };

  const clearLevels = () => {
    levelSet.clear();
  };

  const toggleCategory = (category: Category) => {
    categorySet.toggle(category);
  };

  const selectAllCategories = () => {
    categorySet.selectAll(CATEGORIES);
  };

  const clearCategories = () => {
    categorySet.clear();
  };

  //学習達成度
  const toggleProgress = (status: Progress) => {
    progressSet.toggle(status);
  };

  const selectAllProgress = () => {
    progressSet.selectAll(PROGRESS);
  };

  const clearProgress = () => {
    progressSet.clear();
  };

  const startQuiz = async () => {
    try {
      const ids = await getQuestionIdsByFilter(
        levelSet.selected,
        categorySet.selected,
        favoriteOnly,
        progressSet.selected,
      );
      if (ids.length === 0) {
        Alert.alert('該当する問題がありません');
        return;
      }
      if (random) {
        ids.sort(() => Math.random() - 0.5);
      }
      router.push({ pathname: '/quiz', params: { ids: ids.join(',') } });
    } catch (e) {
      Alert.alert('データ取得エラー', '問題一覧を読み込めませんでした。');
    }
  };

  const insets = useSafeAreaInsets();

  const FOOTER_HEIGHT = 64;

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AppHeader
        title="クイズ選択画面"
        onBack={() => router.replace('/')}
        // rightIcon="cog"
        // onRightPress={() => router.push('/settings')}
      />

      {/* ───────── スクロール領域 ───────── */}
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: FOOTER_HEIGHT + insets.bottom }, // フッター余白を加算
        ]}
      >
        {/* ───────── ランダム出題のアイコンボタン ───────── */}
        <TouchableOpacity
          onPress={() => setRandom(!random)}
          activeOpacity={0.8}
          style={styles.randomRow}
        >
          <View
            style={[
              styles.randomIconWrapper,
              {
                backgroundColor: random
                  ? theme.colors.primaryContainer
                  : 'transparent',
                elevation: random ? 4 : 0,
              },
            ]}
          >
            <MaterialCommunityIcons
              name="shuffle-variant"
              size={28}
              color={
                random ? theme.colors.primary : theme.colors.onSurfaceVariant
              }
              style={styles.iconPadding}
            />
          </View>
          <Text style={styles.label}>
            ランダム出題：{random ? 'ON' : 'OFF'}
          </Text>
        </TouchableOpacity>
        {/* ───────── レベル選択 ───────── */}
        <Card
          style={[styles.card, { backgroundColor: theme.colors.levelCard }]}
        >
          <Card.Title
            title="レベル"
            right={() => (
              <View style={styles.row}>
                {/* "compact" を付けて小さいボタンにしています */}
                <Button compact onPress={selectAllLevels}>
                  すべて選択
                </Button>
                <Button compact onPress={clearLevels}>
                  選択解除
                </Button>
              </View>
            )}
          />
          <Card.Content>
            <View style={styles.chipRow}>
              {LEVELS.map((lv) => (
                <LevelChip
                  key={lv}
                  label={lv}
                  selected={levelSet.selected.includes(lv)}
                  onToggle={() => toggleLevel(lv)}
                />
              ))}
            </View>
          </Card.Content>
        </Card>
        {/* ───────── カテゴリ選択 ───────── */}
        <Card
          style={[styles.card, { backgroundColor: theme.colors.categoryCard }]}
        >
          <Card.Title
            title="カテゴリ"
            right={() => (
              <View style={styles.row}>
                <Button compact onPress={selectAllCategories}>
                  すべて選択
                </Button>
                <Button compact onPress={clearCategories}>
                  選択解除
                </Button>
              </View>
            )}
          />
          <Card.Content>
            <View style={styles.chipRow}>
              {CATEGORIES.map((cat) => (
                <CategoryChip
                  key={cat}
                  label={cat}
                  selected={categorySet.selected.includes(cat)}
                  onToggle={() => toggleCategory(cat)}
                />
              ))}
            </View>
          </Card.Content>
        </Card>
        {/* ───────── 学習達成度選択 ───────── */}
        <Card
          style={[styles.card, { backgroundColor: theme.colors.progressCard }]}
        >
          <Card.Title
            title="学習達成度"
            right={() => (
              <View style={styles.row}>
                <Button compact onPress={selectAllProgress}>
                  すべて選択
                </Button>
                <Button compact onPress={clearProgress}>
                  選択解除
                </Button>
              </View>
            )}
          />
          <Card.Content>
            <View style={styles.chipRow}>
              {PROGRESS.map((p) => (
                <ProgressChip
                  key={p}
                  label={p}
                  selected={progressSet.selected.includes(p)}
                  onToggle={() => toggleProgress(p)}
                />
              ))}
            </View>
          </Card.Content>
        </Card>

        <View style={styles.filterRow}>
          <Text style={[styles.label, styles.labelMarginRight]}>
            お気に入りのみ出題する
          </Text>
          <Switch value={favoriteOnly} onValueChange={setFavoriteOnly} />
        </View>
        {/* 選択条件に合致する問題数を表示 */}
        <Text style={[styles.label, styles.matchCount]}>
          該当問題数: {matchCount} 件
        </Text>
      </ScrollView>

      {/* ───────── 固定フッター ───────── */}
      <View
        style={[
          styles.footer,
          {
            paddingBottom: insets.bottom,
            backgroundColor: theme.colors.background,
          },
        ]}
      >
        <Button mode="contained" onPress={startQuiz} style={styles.startBtn}>
          クイズ開始
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },

  scrollContent: {
    paddingBottom: 72, // フッター分
    paddingHorizontal: 16,
  },

  randomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  randomIconWrapper: {
    borderRadius: 20,
    marginLeft: 8,
  },
  // アイコン周囲の余白
  iconPadding: {
    padding: 6,
  },
  label: { fontSize: 16 },

  labelMarginRight: { marginRight: 8 },

  card: {
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },

  // 横並びレイアウト
  row: {
    flexDirection: 'row',
  },

  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },

  matchCount: { marginVertical: 8 },

  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#ddd',
    alignItems: 'center',
  },
  startBtn: { width: '90%' },
});
