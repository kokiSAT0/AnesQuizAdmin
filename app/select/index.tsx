import React, { useState, useEffect } from 'react';
import { View, Alert, TouchableOpacity, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  Text,
  Button,
  Switch,
  Chip,
  Card,
  useTheme,
  IconButton,
} from 'react-native-paper';
import { router } from 'expo-router';
import { getQuestionIdsByFilter, countQuestionsByFilter } from '@/src/utils/db';
import { SelectableChip } from '@/components/SelectableChip';

import { MaterialCommunityIcons } from '@expo/vector-icons';

// 選択可能な難易度のリスト
const LEVELS = ['初級', '中級', '上級'] as const;
type Level = (typeof LEVELS)[number];

// ───────── カテゴリ一覧 ─────────
const CATEGORIES = [
  'ICU管理',
  '区域麻酔',
  '医療安全・ヒューマンファクター',
  '呼吸管理',
  '循環管理',
  '気道管理',
  '特殊患者',
  '緊急対応',
  '術中モニタリング',
  '術前評価・麻酔計画',
  '術後・疼痛管理',
  '輸液・輸血',
  '麻酔合併症',
  '麻酔薬',
  '麻酔関連機器',
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
      // eslint-disable-next-line no-console
      if (__DEV__) console.error('ID 取得失敗', e);
      Alert.alert('データ取得エラー', '問題一覧を読み込めませんでした。');
    }
  };

  const insets = useSafeAreaInsets();

  return (
    <View style={{ flex: 1, backgroundColor: theme.colors.background }}>
      {/* ───────── 固定ヘッダー ───────── */}
      <View
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          flexDirection: 'row',
          alignItems: 'center',
          paddingTop: insets.top,
          height: 56 + insets.top,
          paddingHorizontal: 8,
          backgroundColor: theme.colors.background,
          borderBottomWidth: 1,
          borderBottomColor: '#ddd',
          zIndex: 10,
        }}
      >
        <IconButton icon="arrow-left" onPress={() => router.back()} />
        <Text
          variant="titleLarge"
          style={{ flex: 1, textAlign: 'center', marginRight: 48 }}
        >
          クイズ選択画面
        </Text>
        {/* ←―― 右上の歯車アイコン ――― */}
        <IconButton icon="cog" onPress={() => router.push('/settings')} />
      </View>

      {/* ───────── スクロール領域 ───────── */}

      <ScrollView
        contentContainerStyle={{
          paddingTop: 56 + insets.top + 16, // ヘッダー高さ分 + 余白
          paddingBottom: 72 + insets.bottom, // フッター高さ分 + 余白
          paddingHorizontal: 16,
        }}
      >
        {/* ───────── ランダム出題のアイコンボタン ───────── */}
        <TouchableOpacity
          onPress={() => setRandom(!random)}
          activeOpacity={0.8}
          style={{
            flexDirection: 'row-reverse',
            alignItems: 'center',
            marginVertical: 8,
          }}
        >
          <Text style={{ fontSize: 16 }}>
            ランダム出題：{random ? 'ON' : 'OFF'}
          </Text>
          <View
            style={{
              backgroundColor: random
                ? theme.colors.primaryContainer
                : 'transparent',
              borderRadius: 20,
              elevation: random ? 4 : 0,
              marginLeft: 8,
            }}
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
        </TouchableOpacity>
        {/* ───────── レベル選択 ───────── */}
        <Card
          style={{ marginBottom: 16, backgroundColor: theme.colors.levelCard }}
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
          style={{
            marginBottom: 16,
            backgroundColor: theme.colors.categoryCard,
          }}
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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
        {/* ───────── カテゴリ選択 ───────── */}
        <Card
          style={{
            marginBottom: 16,
            backgroundColor: theme.colors.progressCard,
          }}
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
            <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
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

        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginVertical: 8,
          }}
        >
          <Text style={{ marginRight: 8, fontSize: 16 }}>
            お気に入りのみ出題する
          </Text>
          <Switch value={favoriteOnly} onValueChange={setFavoriteOnly} />
        </View>
        {/* 選択条件に合致する問題数を表示 */}
        <Text style={{ marginVertical: 8, fontSize: 16 }}>
          該当問題数: {matchCount} 件
        </Text>

        {/*  */}
        {/*<View*/}
        {/*  style={{*/}
        {/*    flexDirection: 'row',*/}
        {/*    alignItems: 'center',*/}
        {/*    marginVertical: 8,*/}
        {/*  }}*/}
        {/*>*/}
        {/*  <Text style={{ marginRight: 8, fontSize: 16 }}>ランダムに出題する</Text>*/}
        {/*  <Switch value={random} onValueChange={setRandom} />*/}
        {/*</View>*/}
        {/*  */}
      </ScrollView>

      {/* ───────── 固定フッター ───────── */}
      <View
        style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          paddingBottom: insets.bottom,
          paddingTop: 8,
          backgroundColor: theme.colors.background,
          borderTopWidth: 1,
          borderTopColor: '#ddd',
          alignItems: 'center',
        }}
      >
        <Button mode="contained" onPress={startQuiz} style={{ width: '90%' }}>
          クイズ開始
        </Button>
      </View>
    </View>
  );
}
