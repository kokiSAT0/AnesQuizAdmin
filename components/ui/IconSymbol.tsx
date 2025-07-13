// Android と Web では MaterialIcons を使うためのフォールバック

import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { SymbolWeight, SymbolViewProps } from 'expo-symbols';
import { ComponentProps } from 'react';
import { OpaqueColorValue, type StyleProp, type TextStyle } from 'react-native';

type IconMapping = Record<
  SymbolViewProps['name'],
  ComponentProps<typeof MaterialIcons>['name']
>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols と Material Icons の対応表をここに追加します。
 * - Material Icons 一覧: [Icons Directory](https://icons.expo.fyi)
 * - SF Symbols 一覧: [SF Symbols](https://developer.apple.com/sf-symbols/) アプリ
 */
const MAPPING = {
  'house.fill': 'home',
  'paperplane.fill': 'send',
  'chevron.left.forwardslash.chevron.right': 'code',
  'chevron.right': 'chevron-right',
} as IconMapping;

/**
 * iOS ではネイティブの SF Symbols、Android と Web では Material Icons を使うアイコンコンポーネントです。
 * これによりプラットフォーム間で見た目をそろえつつ、リソースを効率的に利用できます。
 * アイコン名は SF Symbols を基準としており、Material Icons への対応付けが必要です。
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  return (
    <MaterialIcons
      color={color}
      size={size}
      name={MAPPING[name]}
      style={style}
    />
  );
}
