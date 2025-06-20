import { getDB } from './connection';
import { getOrCreateUserId } from './user';
/* ------------------------------------------------------------------ */
/* カテゴリごとの正答率を計算                                         */
/* ------------------------------------------------------------------ */
export interface CategoryStat {
  category: string;
  attempts: number;
  correct: number;
  accuracy: number;
}

export async function getCategoryStats(): Promise<CategoryStat[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();

  // 学習ログをすべて取得
  const logs = await db.getAllAsync<{
    learning_date: string;
    answers_json: string;
  }>(
    'SELECT learning_date, answers_json FROM LearningDailyLogs WHERE user_id = ?;',
    [userId],
  );

  // 質問ID -> カテゴリ一覧 のマップを事前取得
  const qRows = await db.getAllAsync<{ id: string; category_json: string }>(
    'SELECT id, category_json FROM Questions;',
  );
  const categoryMap: Record<string, string[]> = {};
  for (const row of qRows) {
    categoryMap[row.id] = JSON.parse(row.category_json);
  }

  const stats: Record<string, { attempts: number; correct: number }> = {};

  for (const log of logs) {
    const answers = JSON.parse(log.answers_json) as Record<
      string,
      { attempts: number; correct: number }
    >;
    for (const [qid, data] of Object.entries(answers)) {
      const cats = categoryMap[qid];
      if (!cats) continue;
      for (const c of cats) {
        if (!stats[c]) stats[c] = { attempts: 0, correct: 0 };
        stats[c].attempts += data.attempts;
        stats[c].correct += data.correct;
      }
    }
  }

  return Object.entries(stats).map(([category, { attempts, correct }]) => ({
    category,
    attempts,
    correct,
    accuracy: attempts > 0 ? correct / attempts : 0,
  }));
}

/* ------------------------------------------------------------------ */
/* 連続学習日数（ストリーク）を計算                                   */
/* ------------------------------------------------------------------ */
export async function getLearningStreak(): Promise<number> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<{ learning_date: string }>(
    'SELECT learning_date FROM LearningDailyLogs WHERE user_id = ? ORDER BY learning_date DESC;',
    [userId],
  );
  const dates = new Set(rows.map((r) => r.learning_date));

  let streak = 0;
  let current = new Date();

  while (true) {
    const yyyy = current.toISOString().slice(0, 10);
    if (dates.has(yyyy)) {
      streak += 1;
      current.setDate(current.getDate() - 1);
    } else {
      break;
    }
  }

  return streak;
}

/* ------------------------------------------------------------------ */
/* 獲得済みバッジ一覧を取得                                           */
/* ------------------------------------------------------------------ */
export interface BadgeInfo {
  id: string;
  name: string;
  description: string;
  earned: boolean;
  earned_at?: string;
}

export async function getAllBadgesWithStatus(): Promise<BadgeInfo[]> {
  const db = await getDB();
  const userId = await getOrCreateUserId();
  const rows = await db.getAllAsync<{
    id: string;
    name: string;
    description: string;
    earned_at: string | null;
  }>(
    `SELECT b.id, b.name, b.description, ub.earned_at
       FROM Badges b
  LEFT JOIN UserBadges ub ON b.id = ub.badge_id AND ub.user_id = ?
      ORDER BY b.id;`,
    [userId],
  );
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    description: r.description,
    earned: !!r.earned_at,
    earned_at: r.earned_at ?? undefined,
  }));
}
