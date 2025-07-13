/**
 * SQL プレースホルダーを生成する共通関数
 * @param count プレースホルダーの個数
 * @returns "?, ?, ..." 形式の文字列
 */
export function buildPlaceholders(count: number): string {
  // Array(count).fill('?') で ['?', '?', ...] を作り join(', ') で連結します
  return Array.from({ length: count }, () => '?').join(', ');
}
