import { FirebaseRoom, FirebaseGame, FirebaseGamePlayer, GAME_CONFIG } from './';

// Firebase Realtime Database用ユーティリティ関数

/**
 * ルームIDを生成
 */
export function generateRoomId(): string {
  return `room_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ゲームIDを生成
 */
export function generateGameId(): string {
  return `game_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * プレイヤーIDを生成（匿名認証用）
 */
export function generatePlayerId(): string {
  return `player_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
}

/**
 * ルームが満員かチェック
 */
export function isRoomFull(room: FirebaseRoom): boolean {
  return room.currentPlayers >= room.maxPlayers;
}

/**
 * ルームの全プレイヤーが準備完了かチェック
 */
export function areAllPlayersReady(room: FirebaseRoom): boolean {
  const players = Object.values(room.players);
  return players.length >= GAME_CONFIG.MIN_PLAYERS && 
         players.every(player => player.isReady);
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
  const boss = players.find(p => p.role === 'boss');
  const subordinates = players.filter(p => p.role === 'subordinate');
  
  // 上司のライフが0
  if (boss && boss.life <= 0) {
    return {
      isGameOver: true,
      winner: 'subordinate',
      reason: 'boss_defeated'
    };
  }
  
  // 部下3人以上のライフが0
  const deadSubordinates = subordinates.filter(p => p.life <= 0);
  if (deadSubordinates.length >= 3) {
    return {
      isGameOver: true,
      winner: 'boss',
      reason: 'subordinates_defeated'
    };
  }
  
  // 5ターン経過
  if (game.turnCount >= GAME_CONFIG.MAX_TURNS) {
    return {
      isGameOver: true,
      winner: 'subordinate',
      reason: 'turn_limit'
    };
  }
  
  return { isGameOver: false };
}

/**
 * 次のプレイヤーのインデックスを取得（部下のみ）
 */
export function getNextSubordinateIndex(
  currentIndex: number, 
  players: Record<string, FirebaseGamePlayer>
): number {
  const playerArray = Object.values(players);
  const subordinates = playerArray.filter(p => p.role === 'subordinate');
  
  if (subordinates.length === 0) return -1;
  
  const currentSubordinateIndex = subordinates.findIndex((_, index) => index === currentIndex);
  const nextIndex = (currentSubordinateIndex + 1) % subordinates.length;
  
  return nextIndex;
}

/**
 * 辞表提出可能かチェック
 */
export function canSubmitResignation(
  playerId: string,
  players: Record<string, FirebaseGamePlayer>
): boolean {
  const player = players[playerId];
  if (!player || player.role !== 'subordinate' || player.life <= 0) {
    return false;
  }
  
  const aliveSubordinates = Object.values(players)
    .filter(p => p.role === 'subordinate' && p.life > 0);
  
  return aliveSubordinates.length <= 3;
}

/**
 * 独裁カード無効化可能回数を取得
 */
export function getNullificationLimit(playerCount: number): number {
  return playerCount === 5 
    ? GAME_CONFIG.NULLIFICATION_LIMIT_4_PLAYERS 
    : GAME_CONFIG.NULLIFICATION_LIMIT_3_PLAYERS;
}

/**
 * ノー残業デーかチェック
 */
export function isNoOvertimeDay(turnCount: number): boolean {
  return turnCount === GAME_CONFIG.NO_OVERTIME_TURN;
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
  playerHands: (gameId: string) => `playerHands/${gameId}`,
  playerHand: (gameId: string, playerId: string) => `playerHands/${gameId}/${playerId}`,
  
  // プレゼンス
  presence: (playerId: string) => `presence/${playerId}`,
  
  // 履歴
  gameHistory: (gameId: string) => `gameHistory/${gameId}`,
} as const;

/**
 * Firebase エラーハンドリング
 */
export function handleFirebaseError(error: any): {
  code: string;
  message: string;
} {
  if (error?.code) {
    switch (error.code) {
      case 'PERMISSION_DENIED':
        return {
          code: 'PERMISSION_DENIED',
          message: 'アクセス権限がありません'
        };
      case 'NETWORK_ERROR':
        return {
          code: 'NETWORK_ERROR', 
          message: 'ネットワークエラーが発生しました'
        };
      default:
        return {
          code: error.code,
          message: error.message || '不明なエラーが発生しました'
        };
    }
  }
  
  return {
    code: 'UNKNOWN_ERROR',
    message: 'エラーが発生しました'
  };
}

/**
 * タイムスタンプユーティリティ
 */
export const TimestampUtils = {
  now: () => Date.now(),
  fromDate: (date: Date) => date.getTime(),
  toDate: (timestamp: number) => new Date(timestamp),
  isExpired: (timestamp: number, expiryMs: number) => 
    Date.now() - timestamp > expiryMs,
} as const;
