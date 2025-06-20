// ログ出力をまとめるユーティリティ
// message: 表示するメッセージ
// data: 追加情報
export function logInfo(message: string, data?: unknown): void {
  console.info(message, data);
}

// エラー用のログ
export function logError(message: string, err: unknown): void {
  console.error(message, err);
}
