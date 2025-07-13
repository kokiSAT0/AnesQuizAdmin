// src/utils/logger/index.ts
// アプリ全体で使用するログユーティリティ

// 各レベルの出力関数をまとめた型定義
export type LoggerInterface = {
  info: (message: string, data?: unknown) => void;
  warn: (message: string, data?: unknown) => void;
  error: (message: string, data?: unknown) => void;
  debug: (message: string, data?: unknown) => void;
};

// 既定では console オブジェクトを利用する
let currentLogger: LoggerInterface = console;

// ログ出力先を切り替えるための関数
export function setLoggerOutput(logger: LoggerInterface): void {
  currentLogger = logger;
}

// それぞれのレベルで出力する関数
export function logInfo(message: string, data?: unknown): void {
  currentLogger.info(message, data);
}

export function logWarn(message: string, data?: unknown): void {
  currentLogger.warn(message, data);
}

export function logError(message: string, err?: unknown): void {
  currentLogger.error(message, err);
}

export function logDebug(message: string, data?: unknown): void {
  currentLogger.debug(message, data);
}
