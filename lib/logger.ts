/**
 * 本番環境では console を抑制するロギングユーティリティ
 * 
 * 開発時のデバッグログを本番環境では出力しないようにすることで、
 * パフォーマンス向上とセキュリティ強化を実現します。
 */

const isDevelopment = process.env.NODE_ENV === 'development';

export const logger = {
  /**
   * 開発環境のみで出力されるログ
   * デバッグ情報や進捗状況の確認に使用
   */
  log: (...args: unknown[]) => {
    if (isDevelopment) console.log(...args);
  },
  
  /**
   * 開発環境のみで出力される警告
   * 非推奨の使用や潜在的な問題の通知に使用
   */
  warn: (...args: unknown[]) => {
    if (isDevelopment) console.warn(...args);
  },
  
  /**
   * 本番環境でも出力されるエラーログ
   * システムエラーやユーザーに影響する問題の記録に使用
   */
  error: (...args: unknown[]) => {
    console.error(...args);
  },
  
  /**
   * 開発環境のみで出力される詳細ログ
   * より詳細なデバッグ情報に使用
   */
  debug: (...args: unknown[]) => {
    if (isDevelopment) console.debug(...args);
  },
} as const;

