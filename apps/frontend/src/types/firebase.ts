// Firebase関連の型定義

export interface FirebaseRoomPlayer {
  id: string;
  name: string;
  isReady: boolean;
  joinedAt: number;
}

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
  players: Record<string, FirebaseRoomPlayer>;
}

export interface FirebaseGamePlayer {
  id: string;
  name: string;
  role: 'boss' | 'subordinate';
  life: number;
  isAlive: boolean;
  joinedAt: number;
}

export interface FirebaseGame {
  id: string;
  roomId: string;
  status: 'waiting' | 'playing' | 'finished';
  createdAt: number;
  startedAt?: number;
  finishedAt?: number;
  currentPlayerIndex: number;
  turnCount: number;
  phase: 'dictatorship' | 'subordinate' | 'boss' | 'end';
  winner?: 'boss' | 'subordinate';
  players: Record<string, FirebaseGamePlayer>;
  dictatorshipCard?: {
    id: string;
    name: string;
    description: string;
    target: 'boss' | 'subordinate' | 'all';
  };
  field: {
    presidentCard?: {
      id: string;
      name: string;
      description: string;
      playedBy: string;
      turnsRemaining: number;
    };
  };
  deck: {
    remaining: number;
    discarded: string[];
  };
  gameLog: Array<{
    timestamp: number;
    playerId: string;
    action: string;
    details: Record<string, unknown>;
  }>;
}

export interface FirebasePlayerHand {
  gameId: string;
  playerId: string;
  cards: Array<{
    id: string;
    type: 'work' | 'dictatorship';
    category: 'attack' | 'defense' | 'recovery' | 'president' | 'dictatorship';
    name: string;
    description: string;
    isVisible: boolean;
  }>;
}

// Firebase Realtime Databaseのパス管理
export class FirebasePaths {
  // ルーム関連
  static rooms(): string {
    return 'rooms';
  }

  static room(roomId: string): string {
    return `rooms/${roomId}`;
  }

  static roomPlayer(roomId: string, playerId: string): string {
    return `rooms/${roomId}/players/${playerId}`;
  }

  // ゲーム関連
  static games(): string {
    return 'games';
  }

  static game(gameId: string): string {
    return `games/${gameId}`;
  }

  static gamePlayer(gameId: string, playerId: string): string {
    return `games/${gameId}/players/${playerId}`;
  }

  // プレイヤー手札
  static playerHands(gameId: string): string {
    return `playerHands/${gameId}`;
  }

  static playerHand(gameId: string, playerId: string): string {
    return `playerHands/${gameId}/${playerId}`;
  }

  // プレゼンス
  static presence(userId: string): string {
    return `presence/${userId}`;
  }

  // ゲーム履歴
  static gameHistory(): string {
    return 'gameHistory';
  }

  static gameHistoryEntry(gameId: string): string {
    return `gameHistory/${gameId}`;
  }
}

// ユーティリティ関数
export function generateId(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

export function generateRoomId(): string {
  return 'room_' + generateId();
}

export function isRoomFull(room: FirebaseRoom): boolean {
  return room.currentPlayers >= room.maxPlayers;
}

export function areAllPlayersReady(room: FirebaseRoom): boolean {
  const players = Object.values(room.players);
  return players.length >= 4 && players.every((player) => player.isReady);
}
