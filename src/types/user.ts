/** Users テーブルの1行を表す型
 * ユーザー情報を保持します
 */
export interface User {
  id: string;
  nickname: string;
  created_at: string;
  last_active_at: string;
}
