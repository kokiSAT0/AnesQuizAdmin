// src/utils/sm2.ts
// SM-2 アルゴリズムを使って次回復習日を計算するユーティリティ
// Quality は 0-5 の整数で、数値が大きいほどよく覚えていることを意味します
// 今回は仕様書に合わせて 2,4,5 の3段階のみを想定しています

export interface SM2State {
  repetition: number; // 連続正解回数
  interval_days: number; // 次回までの間隔（日数）
  ease_factor: number; // 定着係数
}

export interface SM2Result extends SM2State {
  next_review_at: string; // 次回復習日（ISO 文字列）
}

/**
 * SM-2 の計算を行います
 * @param state 現在の定着状態
 * @param quality 回答品質 (2: Hard, 4: Good, 5: Easy)
 */
export function calcSM2(state: SM2State, quality: number): SM2Result {
  let { repetition, interval_days, ease_factor } = state;

  if (quality < 3) {
    // 失敗した場合は繰り返し回数をリセット
    repetition = 0;
    interval_days = 1;
  } else {
    repetition += 1;
    if (repetition === 1) {
      interval_days = 1;
    } else if (repetition === 2) {
      interval_days = 6;
    } else {
      interval_days = Math.round(interval_days * ease_factor);
    }
    ease_factor = Math.max(1.3, ease_factor + 0.1 - (5 - quality) * 0.08);
  }

  const next = new Date();
  next.setDate(next.getDate() + interval_days);

  return {
    repetition,
    interval_days,
    ease_factor,
    next_review_at: next.toISOString(),
  };
}
