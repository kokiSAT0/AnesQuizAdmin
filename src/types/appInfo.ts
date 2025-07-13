/** AppInfo テーブル1行を表す型
 * アプリ初回起動時に生成するユーザーIDなどを保存します
 */
export interface AppInfo {
  user_id: string;
  created_at: string;
}
