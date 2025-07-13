// src/utils/uuid.ts
// UUID 文字列を生成するヘルパー関数
// 外部ライブラリを使わずに簡易的な UUID v4 を作ります
export function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.floor(Math.random() * 16);
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
