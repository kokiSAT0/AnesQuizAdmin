import { useDebugStore } from '@/src/store/debug';

// 元々の console を保存します
// eslint-disable-next-line no-console
const orig = {
  log: console.log,
  info: console.info,
  warn: console.warn,
  error: console.error,
};

// console の各メソッドをラップしてストアへ保存する
(['log', 'info', 'warn', 'error'] as const).forEach((level) => {
  // eslint-disable-next-line no-console
  console[level] = (...args: unknown[]) => {
    const msg = args
      .map((a) => {
        if (typeof a === 'string') return a;
        try {
          return JSON.stringify(a);
        } catch {
          return String(a);
        }
      })
      .join(' ');
    if (useDebugStore.getState().enabled) {
      useDebugStore.getState().addLog(level, msg);
    }
    // eslint-disable-next-line no-console
    orig[level](...args);
  };
});
