import { FirebaseGame, FirebaseGamePlayer, GAME_CONFIG } from './';
import { NonDeterministicRandom } from './random';

// Firebase Realtime Database用ユーティリティ関数

/**
 * ゲームIDを生成
 */
export function generateGameId(): string {
  return NonDeterministicRandom.generateGameId();
}

/**
 * プレイヤーIDを生成（匿名認証用）
 */
export function generatePlayerId(): string {
  return NonDeterministicRandom.generatePlayerId();
}

/**
 * ゲームの勝利条件をチェック
 */
export function checkGameVictory(game: FirebaseGame): {
  isGameOver: boolean;
  winner?: 'boss' | 'subordinate';
  reason?: string;
} {
  const players = Object.values(game.players);
  const boss = players.find((p) => p.role === 'boss');
  const subordinates = players.filter((p) => p.role === 'subordinate');

  // 上司のライフが0
  if (boss && boss.life <= 0) {
    return {
      isGameOver: true,
      winner: 'subordinate',
      reason: 'boss_defeated',
    };
  }

  // 部下3人以上のライフが0
  const deadSubordinates = subordinates.filter((p) => p.life <= 0);
  if (deadSubordinates.length >= 3) {
    return {
      isGameOver: true,
      winner: 'boss',
      reason: 'subordinates_defeated',
    };
  }

  // 5ターン経過
  if (game.turnCount >= GAME_CONFIG.MAX_TURNS) {
    return {
      isGameOver: true,
      winner: 'subordinate',
      reason: 'turn_limit',
    };
  }

  return { isGameOver: false };
}

/**
 * 次のプレイヤーのインデックスを取得（部下のみ）
 */
export function getNextSubordinateIndex(currentIndex: number, players: Record<string, FirebaseGamePlayer>): number {
  const playerArray = Object.values(players);
  const subordinates = playerArray.filter((p) => p.role === 'subordinate');

  if (subordinates.length === 0) return -1;

  const currentSubordinateIndex = subordinates.findIndex((_, index) => index === currentIndex);
  const nextIndex = (currentSubordinateIndex + 1) % subordinates.length;

  return nextIndex;
}

/**
 * Firebase用辞表提出可能かチェック
 */
export function canSubmitResignationFirebase(playerId: string, players: Record<string, FirebaseGamePlayer>): boolean {
  const player = players[playerId];
  if (!player || player.role !== 'subordinate' || player.life <= 0) {
    return false;
  }

  const aliveSubordinates = Object.values(players).filter((p) => p.role === 'subordinate' && p.life > 0);

  return aliveSubordinates.length <= 3;
}

/**
 * Firebase パスヘルパー
 */
export const FirebasePaths = {
  // ルーム関連
  rooms: () => 'rooms',
  room: (roomId: string) => `rooms/${roomId}`,
  roomPlayers: (roomId: string) => `rooms/${roomId}/players`,
  roomPlayer: (roomId: string, playerId: string) => `rooms/${roomId}/players/${playerId}`,

  // ゲーム関連
  games: () => 'games',
  game: (gameId: string) => `games/${gameId}`,
  gamePlayers: (gameId: string) => `games/${gameId}/players`,
  gamePlayer: (gameId: string, playerId: string) => `games/${gameId}/players/${playerId}`,
  gameState: (gameId: string) => `games/${gameId}/gameState`,

  // プレイヤー手札
  playerHands: (gameId: string) => `games/${gameId}/playerHands`,
  playerHand: (gameId: string, playerId: string) => `games/${gameId}/playerHands/${playerId}`,

  // プレゼンス
  presence: (playerId: string) => `presence/${playerId}`,

  // 履歴
  gameHistory: (gameId: string) => `gameHistory/${gameId}`,
} as const;

/**
 * Firebase エラーハンドリング
 */
interface ErrorLike {
  code?: unknown;
  message?: unknown;
}

function isErrorLike(error: unknown): error is ErrorLike {
  return error !== null && typeof error === 'object';
}

export function handleFirebaseError(error: unknown): {
  code: string;
  message: string;
} {
  if (isErrorLike(error) && error.code !== undefined) {
    const code = typeof error.code === 'string' ? error.code : 'UNKNOWN_ERROR';
    const message = typeof error.message === 'string' ? error.message : undefined;
    switch (code) {
      case 'PERMISSION_DENIED':
        return {
          code: 'PERMISSION_DENIED',
          message: 'アクセス権限がありません',
        };
      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR',
          message: 'ネットワークエラーが発生しました',
        };
      default:
        return {
          code: code,
          message: message || '不明なエラーが発生しました',
        };
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'エラーが発生しました',
  };
}

/**
 * タイムスタンプユーティリティ
 */
export const TimestampUtils = {
  now: () => Date.now(),
  fromDate: (date: Date) => date.getTime(),
  toDate: (timestamp: number) => new Date(timestamp),
  isExpired: (timestamp: number, expiryMs: number) => Date.now() - timestamp > expiryMs,
} as const;
