import { calcSM2 } from '../src/utils/sm2/index';

describe('SM2 アルゴリズム', () => {
  test('初回正解で間隔1日', () => {
    const result = calcSM2(
      { repetition: 0, interval_days: 1, ease_factor: 2.5 },
      4,
    );
    expect(result.repetition).toBe(1);
    expect(result.interval_days).toBe(1);
  });

  test('2回連続正解で間隔6日', () => {
    const first = calcSM2(
      { repetition: 0, interval_days: 1, ease_factor: 2.5 },
      4,
    );
    const second = calcSM2(first, 4);
    expect(second.repetition).toBe(2);
    expect(second.interval_days).toBe(6);
  });
});
