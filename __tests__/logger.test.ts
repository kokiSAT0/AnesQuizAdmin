import {
  setLoggerOutput,
  logInfo,
  logWarn,
  logError,
  logDebug,
} from '../src/utils/logger';

describe('logger', () => {
  beforeEach(() => {
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    jest.spyOn(console, 'debug').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    setLoggerOutput(console);
  });

  test('console 出力時に各関数が呼ばれる', () => {
    setLoggerOutput(console);
    logInfo('info');
    logWarn('warn');
    logError('error');
    logDebug('debug');
    expect(console.info).toHaveBeenCalledWith('info', undefined);
    expect(console.warn).toHaveBeenCalledWith('warn', undefined);
    expect(console.error).toHaveBeenCalledWith('error', undefined);
    expect(console.debug).toHaveBeenCalledWith('debug', undefined);
  });

  test('別のロガーに切り替えた場合、console が呼ばれない', () => {
    const dummy = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };
    setLoggerOutput(dummy);
    logInfo('info');
    logWarn('warn');
    logError('error');
    logDebug('debug');
    expect(console.info).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
    expect(console.error).not.toHaveBeenCalled();
    expect(console.debug).not.toHaveBeenCalled();
    expect(dummy.info).toHaveBeenCalled();
    expect(dummy.warn).toHaveBeenCalled();
    expect(dummy.error).toHaveBeenCalled();
    expect(dummy.debug).toHaveBeenCalled();
  });
});
