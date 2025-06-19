import React, { useState, useEffect } from 'react';
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
import { getQuestionIdsByFilter, countQuestionsByFilter } from '@/src/utils/db';
import { SelectableChip } from '@/components/SelectableChip';

import { MaterialCommunityIcons } from '@expo/vector-icons';

// 選択可能な難易度のリスト
const LEVELS = ['初級', '中級', '上級'] as const;
type Level = (typeof LEVELS)[number];

// ───────── カテゴリ一覧 ─────────
const CATEGORIES = [
  '気道管理',
  '呼吸管理',
  '循環管理',
  '緊急対応',
  '術中モニタリング',
  '輸液・輸血',
  '麻酔薬',
  '麻酔合併症',
  '特殊患者',
  '術前評価・麻酔計画',
  '術後・疼痛管理',
  '麻酔関連機器',
  '区域麻酔',
  'ICU管理',
  '医療安全・ヒューマンファクター',
  // 以下は既存のリストに無かったカテゴリー。DB 内の問題と整合させるため追加
  'モニタリング',
  '体温管理',
  '全身麻酔',
  '吸入麻酔薬',
  '筋弛緩薬',
  '術中輸液',
  '術後管理',
  '鎮痛薬',
] as const;
type Category = (typeof CATEGORIES)[number];

const PROGRESS = ['正解', '不正解', '未学習'] as const;
type Progress = (typeof PROGRESS)[number];

// レベル選択用の Chip を表示するコンポーネント

const LevelChip = (p: any) => (
  <SelectableChip {...p} selectedColorToken="levelChipSelected" />
);

const CategoryChip = (p: any) => (
  <SelectableChip {...p} selectedColorToken="categoryChipSelected" />
);

const ProgressChip = (p: any) => (
  <SelectableChip {...p} selectedColorToken="progressChipSelected" />
);

export default function SelectScreen() {
  const theme = useTheme();
  const [selected, setSelected] = useState<Level[]>([...LEVELS]);
  const [selectedCategories, setSelectedCategories] = useState<Category[]>([
    ...CATEGORIES,
  ]);
  const [selectedProgress, setSelectedProgress] = useState<Progress[]>([
    ...PROGRESS,
  ]);

  const [random, setRandom] = useState(false);
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [matchCount, setMatchCount] = useState<number>(0);

  // レベルとカテゴリのどちらも選ばれている場合のみ件数を取得
  // どちらか片方でも未選択なら 0 件になる
  useEffect(() => {
    (async () => {
      const count = await countQuestionsByFilter(
        selected,
        selectedCategories,
        favoriteOnly,
        selectedProgress,
      );
      setMatchCount(count);
    })();
  }, [selected, selectedCategories, favoriteOnly, selectedProgress]);

  const toggleLevel = (level: Level) => {
    setSelected((prev) =>
      prev.includes(level) ? prev.filter((l) => l !== level) : [...prev, level],
    );
  };

  // レベルをすべて選択する
  const selectAllLevels = () => {
    setSelected([...LEVELS]);
  };

  // レベルの選択をすべて解除する
  const clearLevels = () => {
    setSelected([]);
  };

  const toggleCategory = (category: Category) => {
    setSelectedCategories((prev) =>
      prev.includes(category)
        ? prev.filter((c) => c !== category)
        : [...prev, category],
    );
  };

  // カテゴリをすべて選択する
  const selectAllCategories = () => {
    setSelectedCategories([...CATEGORIES]);
  };

  // カテゴリの選択をすべて解除する
  const clearCategories = () => {
    setSelectedCategories([]);
  };

  //学習達成度
  const toggleProgress = (status: Progress) => {
    setSelectedProgress((prev) =>
      prev.includes(status)
        ? prev.filter((s) => s !== status)
        : [...prev, status],
    );
  };

  const selectAllProgress = () => {
    setSelectedProgress([...PROGRESS]);
  };

  const clearProgress = () => {
    setSelectedProgress([]);
  };

  const startQuiz = async () => {
    try {
      const ids = await getQuestionIdsByFilter(
        selected,
        selectedCategories,
        favoriteOnly,
        selectedProgress,
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
        rightIcon="cog"
        onRightPress={() => router.push('/settings')}
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
              style={{ padding: 6 }}
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
              <View style={{ flexDirection: 'row' }}>
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
                  selected={selected.includes(lv)}
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
              <View style={{ flexDirection: 'row' }}>
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
                  selected={selectedCategories.includes(cat)}
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
              <View style={{ flexDirection: 'row' }}>
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
                  selected={selectedProgress.includes(p)}
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
  label: { fontSize: 16 },

  labelMarginRight: { marginRight: 8 },

  card: {
    marginBottom: 16,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
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
