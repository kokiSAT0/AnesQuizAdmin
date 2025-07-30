import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from 'react-native-paper';
// パッケージが未インストール環境でもビルドエラーにしない
// eslint-disable-next-line import/no-unresolved
import { AdMobBanner } from 'expo-ads-admob';

import { AD_BANNER_UNIT_ID, AD_BANNER_HEIGHT } from '@/constants/Ads';

// 広告表示コンポーネントの Props (現状はなし)
export type AdBannerProps = {};

/**
 * 画面下部に表示する AdMob バナーコンポーネント
 */
export const AdBanner: React.FC<AdBannerProps> = () => {
  const theme = useTheme();

  return (
    <View
      style={[styles.container, { backgroundColor: theme.colors.background }]}
    >
      <AdMobBanner
        bannerSize="smartBanner"
        adUnitID={AD_BANNER_UNIT_ID}
        // エラー時はログ出力のみ
        onDidFailToReceiveAdWithError={(err) => {
          console.log('AdMob error', err);
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: AD_BANNER_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

