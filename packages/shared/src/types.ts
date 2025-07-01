// ゲーム基本型定義

export interface Player {
  id: string;
  name: string;
  isReady: boolean;
  handCount: number; // 他プレイヤーには手札の枚数のみ公開
  isConnected: boolean;
  life: number;
  role: 'boss' | 'subordinate';
}

export interface Card {
  id: string;
  type: 'work' | 'dictatorship';
  category: 'attack' | 'defense' | 'recovery' | 'president' | 'dictatorship';
  name: string;
  description: string;
  isVisible: boolean; // 公開カードかどうか
}

export interface WorkCard extends Card {
  type: 'work';
  category: 'attack' | 'defense' | 'recovery' | 'president';
}

export interface DictatorshipCard extends Card {
  type: 'dictatorship';
  category: 'dictatorship';
  target: 'boss' | 'subordinate' | 'all';
}

export interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  phase: 'waiting' | 'playing' | 'ended';
  turnCount: number;
  lastAction?: GameAction;
  discardPile: Card[];
  deckCount: number;
  presidentCard?: {
    card: Card;
    owner: 'boss' | 'subordinate';
    turnsRemaining: number;
  };
  dictatorshipEffectNullifications: {
    boss4Players: number; // 部下4人時の無効化回数
    boss3Players: number; // 部下3人時の無効化回数
  };
}

export interface GameAction {
  type:
    | 'play-card'
    | 'draw-card'
    | 'pass-turn'
    | 'resign'
    | 'nullify-dictatorship';
  playerId: string;
  timestamp: number;
  cardId?: string;
  targetPlayerId?: string;
  diceResult?: number;
}

export interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number; // 4 or 5
  isGameStarted: boolean;
  isPrivate: boolean;
  createdBy: string;
  createdAt: number;
}

// Socket.ioイベント型定義
export interface ServerToClientEvents {
  // ルーム関連
  'room-created': (data: { room: Room; playerId: string }) => void;
  'room-joined': (data: {
    room: Room;
    players: Player[];
    playerId: string;
  }) => void;
  'room-left': () => void;
  'rooms-list': (data: { rooms: Room[] }) => void;
  'player-joined': (data: { player: Player; room: Room }) => void;
  'player-left': (data: { playerId: string; room: Room }) => void;

  // ゲーム状態
  'game-started': (data: { gameState: GameState; myHand: Card[] }) => void;
  'game-state-updated': (data: {
    gameState: GameState;
    myHand?: Card[];
    lastAction: GameAction;
  }) => void;
  'game-ended': (data: {
    winner: 'boss' | 'subordinate';
    finalScores: { playerId: string; score: number }[];
    gameState: GameState;
  }) => void;
  'player-ready-updated': (data: {
    playerId: string;
    isReady: boolean;
    allPlayersReady: boolean;
  }) => void;

  // アクション結果
  'action-result': (data: {
    success: boolean;
    action: GameAction;
    message?: string;
    newCards?: Card[];
  }) => void;
  'turn-changed': (data: {
    currentPlayerId: string;
    previousPlayerId: string;
    turnCount: number;
  }) => void;

  // エラー・通知
  error: (data: { code: string; message: string; details?: any }) => void;
  notification: (data: {
    type: 'info' | 'warning' | 'success';
    message: string;
    duration?: number;
  }) => void;
  'player-disconnected': (data: {
    playerId: string;
    playerName: string;
  }) => void;
  'player-reconnected': (data: {
    playerId: string;
    playerName: string;
  }) => void;

  // テスト用
  pong: (data: { timestamp: number }) => void;
}

export interface ClientToServerEvents {
  // ルーム関連
  'create-room': (data: {
    roomName: string;
    maxPlayers: number;
    isPrivate: boolean;
    password?: string;
  }) => void;
  'join-room': (data: {
    roomId: string;
    playerName: string;
    password?: string;
  }) => void;
  'leave-room': () => void;
  'get-rooms': () => void;

  // ゲーム準備
  'player-ready': (data: { isReady: boolean }) => void;
  'start-game': () => void;

  // ゲームアクション
  'play-card': (data: { cardId: string; targetPlayerId?: string }) => void;
  'draw-card': () => void;
  'pass-turn': () => void;
  resign: () => void;
  'nullify-dictatorship': () => void;

  // テスト用
  ping: () => void;
}

// Firebase Realtime Database型定義
export interface FirebaseRoom {
  id: string;
  name: string;
  createdBy: string;
  createdAt: number;
  maxPlayers: number;
  currentPlayers: number;
  isPrivate: boolean;
  password?: string;
  status: 'waiting' | 'playing' | 'finished';
  gameId?: string;
  players: Record<string, FirebaseRoomPlayer>;
}

export interface FirebaseRoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
  joinedAt: number;
  role?: 'boss' | 'subordinate';
}

export interface FirebaseGame {
  id: string;
  roomId: string;
  createdAt: number;
  status: 'playing' | 'ended';
  phase:
    | 'dictatorship'
    | 'subordinate_consultation'
    | 'subordinate_turn'
    | 'boss_turn'
    | 'turn_end';
  currentPlayerIndex: number;
  turnCount: number;
  maxTurns: number;
  players: Record<string, FirebaseGamePlayer>;
  gameState: FirebaseGameState;
  turnHistory: FirebaseTurnAction[];
  lastUpdated: number;
}

export interface FirebaseGamePlayer {
  id: string;
  name: string;
  role: 'boss' | 'subordinate';
  life: number;
  maxLife: number;
  handCount: number;
  isConnected: boolean;
  lastAction: number;
}

export interface FirebaseGameState {
  deckCount: number;
  discardPile: Card[];
  presidentCard?: {
    card: Card;
    owner: 'boss' | 'subordinate';
    turnsRemaining: number;
    placedAt: number;
  };
  dictatorshipEffects: {
    currentCard?: {
      id: string;
      name: string;
      target: 'boss' | 'subordinate' | 'all';
      isNullified: boolean;
    };
    nullificationsUsed: {
      boss4Players: number;
      boss3Players: number;
    };
  };
}

export interface FirebaseTurnAction {
  turnNumber: number;
  phase: string;
  action: {
    type: string;
    playerId?: string;
    cardId?: string;
    targetPlayerId?: string;
    timestamp: number;
  };
}

export interface FirebasePlayerHand {
  cards: Card[];
  lastUpdated: number;
}

export interface FirebasePresence {
  online: boolean;
  lastSeen: number;
  currentRoom?: string;
  currentGame?: string;
}

export interface FirebaseGameHistory {
  id: string;
  startedAt: number;
  endedAt: number;
  duration: number;
  winner: 'boss' | 'subordinate';
  players: Array<{
    id: string;
    name: string;
    role: 'boss' | 'subordinate';
    finalLife: number;
  }>;
  finalState: {
    turnCount: number;
    endReason:
      | 'boss_defeated'
      | 'subordinates_defeated'
      | 'turn_limit'
      | 'resignation';
  };
}

// エラーコード定数
export const ERROR_CODES = {
  // ルーム関連
  ROOM_NOT_FOUND: 'ROOM_NOT_FOUND',
  ROOM_FULL: 'ROOM_FULL',
  INVALID_PASSWORD: 'INVALID_PASSWORD',
  ALREADY_IN_ROOM: 'ALREADY_IN_ROOM',

  // ゲーム関連
  GAME_NOT_STARTED: 'GAME_NOT_STARTED',
  NOT_YOUR_TURN: 'NOT_YOUR_TURN',
  INVALID_CARD: 'INVALID_CARD',
  CARD_NOT_IN_HAND: 'CARD_NOT_IN_HAND',
  INVALID_ACTION: 'INVALID_ACTION',

  // 接続関連
  CONNECTION_ERROR: 'CONNECTION_ERROR',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
} as const;
