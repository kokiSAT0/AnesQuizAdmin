export const CATEGORIES = [
  '麻酔薬',
  '気道管理',
  '循環管理',
  '呼吸管理',
  '区域麻酔',
  '術中モニタリング',
  '術後・疼痛管理',
  '緊急対応',
  '麻酔合併症',
  '特殊患者',
  '麻酔関連機器',
  '術前評価・麻酔計画',
  '輸液・輸血',
  'ICU管理',
  'ICU 管理',
  '医療安全・ヒューマンファクター',
] as const;

export type Category = (typeof CATEGORIES)[number];
