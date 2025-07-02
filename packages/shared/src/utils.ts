import {
  Player,
  GameState,
  GAME_CONFIG,
  VICTORY_CONDITIONS,
  FirebaseRoom,
} from './';

// ゲームユーティリティ関数

/**
 * プレイヤーの役割を判定
 */
export function getPlayerRole(playerIndex: number): 'boss' | 'subordinate' {
  return playerIndex === 0 ? 'boss' : 'subordinate';
}

/**
 * 生存している部下の数を取得
 */
export function getAliveSubordinatesCount(players: Player[]): number {
  return players.filter(
    (player) => player.role === 'subordinate' && player.life > 0
  ).length;
}

/**
 * 上司の勝利条件をチェック
 */
export function checkBossVictory(players: Player[]): boolean {
  const aliveSubordinates = getAliveSubordinatesCount(players);
  return (
    aliveSubordinates <=
    players.length - VICTORY_CONDITIONS.BOSS_WIN_SUBORDINATES_DOWN
  );
}

/**
 * 部下の勝利条件をチェック
 */
export function checkSubordinateVictory(gameState: GameState): boolean {
  const boss = gameState.players.find((p) => p.role === 'boss');
  if (!boss) return false;

  // 上司のライフが0
  if (boss.life <= VICTORY_CONDITIONS.SUBORDINATE_WIN_BOSS_LIFE) {
    return true;
  }

  // 5ターン経過
  if (gameState.turnCount >= VICTORY_CONDITIONS.SUBORDINATE_WIN_TURNS) {
    return true;
  }

  return false;
}

/**
 * ゲーム終了条件をチェック
 */
export function checkGameEnd(gameState: GameState): {
  isEnded: boolean;
  winner?: 'boss' | 'subordinate';
} {
  if (checkBossVictory(gameState.players)) {
    return { isEnded: true, winner: 'boss' };
  }

  if (checkSubordinateVictory(gameState)) {
    return { isEnded: true, winner: 'subordinate' };
  }

  return { isEnded: false };
}

/**
 * 次のプレイヤーのインデックスを取得
 */
export function getNextPlayerIndex(
  currentIndex: number,
  players: Player[]
): number {
  let nextIndex = (currentIndex + 1) % players.length;

  // 上司（インデックス0）はスキップして部下のターンのみ
  if (nextIndex === 0) {
    nextIndex = 1;
  }

  return nextIndex;
}

/**
 * 辞表提出可能かチェック
 */
export function canSubmitResignation(
  players: Player[],
  playerId: string
): boolean {
  const player = players.find((p) => p.id === playerId);
  if (!player || player.role === 'boss' || player.life <= 0) {
    return false;
  }

  const aliveSubordinates = getAliveSubordinatesCount(players);
  return aliveSubordinates <= 3;
}

/**
 * 辞表によるダメージ計算
 */
export function calculateResignationDamage(
  currentLife: number,
  maxLife: number = GAME_CONFIG.SUBORDINATE_INITIAL_LIFE
): number {
  return maxLife - currentLife;
}

/**
 * ノー残業デーかどうかチェック
 */
export function isNoOvertimeDay(turnCount: number): boolean {
  return turnCount === GAME_CONFIG.NO_OVERTIME_TURN;
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
 * サイコロの結果が偶数かチェック
 */
export function isEvenDiceResult(diceResult: number): boolean {
  return diceResult % 2 === 0;
}

/**
 * 配列をシャッフル
 */
export function shuffleArray<T>(array: T[]): T[] {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

/**
 * サイコロを振る（1-6）
 */
export function rollDice(): number {
  return Math.floor(Math.random() * 6) + 1;
}

// Firebase関連ユーティリティ関数

/**
 * ランダムなIDを生成
 */
export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * ルームIDを生成
 */
export function generateRoomId(): string {
  return 'room_' + generateId();
}

/**
 * ルームが満員かチェック
 */
export function isRoomFull(room: FirebaseRoom): boolean {
  return room.currentPlayers >= room.maxPlayers;
}

/**
 * 全プレイヤーが準備完了かチェック
 */
export function areAllPlayersReady(room: FirebaseRoom): boolean {
  const players = Object.values(room.players);
  return players.length >= 4 && players.every((player) => player.isReady);
}
