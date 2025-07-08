# Socket.io イベント仕様書

## 概要

カードゲームにおけるクライアント・サーバー間のSocket.ioイベント通信の詳細仕様。

## 型定義

### 基本型

```typescript
interface Player {
  id: string;
  name: string;
  isReady: boolean;
  handCount: number; // 他プレイヤーには手札の枚数のみ公開
  isConnected: boolean;
}

interface Card {
  id: string;
  suit: "hearts" | "diamonds" | "clubs" | "spades";
  rank: number; // 1-13 (1=A, 11=J, 12=Q, 13=K)
  isVisible: boolean; // 公開カードかどうか
}

interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  phase: "waiting" | "playing" | "ended";
  turnCount: number;
  lastAction?: GameAction;
  discardPile: Card[];
  deckCount: number;
}

interface GameAction {
  type: "play-card" | "draw-card" | "pass-turn";
  playerId: string;
  timestamp: number;
  cardId?: string;
}

interface Room {
  id: string;
  name: string;
  playerCount: number;
  maxPlayers: number;
  isGameStarted: boolean;
  isPrivate: boolean;
}
```

## クライアント → サーバー イベント

### 1. ルーム関連

#### `create-room`

新しいゲームルームを作成する。

**Payload:**

```typescript
interface CreateRoomPayload {
  roomName: string;
  maxPlayers: number; // 4 or 5
  isPrivate: boolean;
  password?: string;
}
```

**Response:** `room-created` または `error`

#### `join-room`

既存のルームに参加する。

**Payload:**

```typescript
interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  password?: string;
}
```

**Response:** `room-joined` または `error`

#### `leave-room`

現在のルームから退出する。

**Payload:** なし

**Response:** `room-left`

#### `get-rooms`

利用可能なルーム一覧を取得する。

**Payload:** なし

**Response:** `rooms-list`

### 2. ゲーム準備

#### `player-ready`

ゲーム開始の準備完了を通知する。

**Payload:**

```typescript
interface PlayerReadyPayload {
  isReady: boolean;
}
```

**Response:** `player-ready-updated`

#### `start-game`

ゲームを開始する（ルーム作成者のみ）。

**Payload:** なし

**Response:** `game-started` または `error`

### 3. ゲームアクション

#### `play-card`

カードをプレイする。

**Payload:**

```typescript
interface PlayCardPayload {
  cardId: string;
  targetPlayerId?: string; // 特定プレイヤーを対象とする場合
}
```

**Response:** `action-result`

#### `draw-card`

デッキからカードを引く。

**Payload:** なし

**Response:** `action-result`

#### `pass-turn`

ターンをパスする。

**Payload:** なし

**Response:** `action-result`

## サーバー → クライアント イベント

### 1. ルーム関連

#### `room-created`

ルーム作成完了通知。

**Payload:**

```typescript
interface RoomCreatedPayload {
  room: Room;
  playerId: string;
}
```

#### `room-joined`

ルーム参加完了通知。

**Payload:**

```typescript
interface RoomJoinedPayload {
  room: Room;
  players: Player[];
  playerId: string;
}
```

#### `room-left`

ルーム退出完了通知。

**Payload:** なし

#### `rooms-list`

利用可能なルーム一覧。

**Payload:**

```typescript
interface RoomsListPayload {
  rooms: Room[];
}
```

#### `player-joined`

他のプレイヤーがルームに参加した通知。

**Payload:**

```typescript
interface PlayerJoinedPayload {
  player: Player;
  room: Room;
}
```

#### `player-left`

プレイヤーがルームから退出した通知。

**Payload:**

```typescript
interface PlayerLeftPayload {
  playerId: string;
  room: Room;
}
```

### 2. ゲーム状態

#### `game-started`

ゲーム開始通知。

**Payload:**

```typescript
interface GameStartedPayload {
  gameState: GameState;
  myHand: Card[]; // 自分の手札のみ
}
```

#### `game-state-updated`

ゲーム状態更新通知。

**Payload:**

```typescript
interface GameStateUpdatedPayload {
  gameState: GameState;
  myHand?: Card[]; // 手札に変更があった場合のみ
  lastAction: GameAction;
}
```

#### `game-ended`

ゲーム終了通知。

**Payload:**

```typescript
interface GameEndedPayload {
  winner: Player;
  finalScores: { playerId: string; score: number }[];
  gameState: GameState;
}
```

#### `player-ready-updated`

プレイヤーの準備状態更新通知。

**Payload:**

```typescript
interface PlayerReadyUpdatedPayload {
  playerId: string;
  isReady: boolean;
  allPlayersReady: boolean;
}
```

### 3. アクション結果

#### `action-result`

プレイヤーアクションの結果通知。

**Payload:**

```typescript
interface ActionResultPayload {
  success: boolean;
  action: GameAction;
  message?: string;
  newCards?: Card[]; // カードを引いた場合
}
```

#### `turn-changed`

ターン変更通知。

**Payload:**

```typescript
interface TurnChangedPayload {
  currentPlayerId: string;
  previousPlayerId: string;
  turnCount: number;
}
```

### 4. エラー・通知

#### `error`

エラー通知。

**Payload:**

```typescript
interface ErrorPayload {
  code: string;
  message: string;
  details?: any;
}
```

#### `notification`

一般的な通知。

**Payload:**

```typescript
interface NotificationPayload {
  type: "info" | "warning" | "success";
  message: string;
  duration?: number; // 表示時間（ミリ秒）
}
```

#### `player-disconnected`

プレイヤー切断通知。

**Payload:**

```typescript
interface PlayerDisconnectedPayload {
  playerId: string;
  playerName: string;
}
```

#### `player-reconnected`

プレイヤー再接続通知。

**Payload:**

```typescript
interface PlayerReconnectedPayload {
  playerId: string;
  playerName: string;
}
```

## エラーコード

### ルーム関連

- `ROOM_NOT_FOUND`: ルームが見つからない
- `ROOM_FULL`: ルームが満員
- `INVALID_PASSWORD`: パスワードが間違っている
- `ALREADY_IN_ROOM`: 既にルームに参加している

### ゲーム関連

- `GAME_NOT_STARTED`: ゲームが開始されていない
- `NOT_YOUR_TURN`: 自分のターンではない
- `INVALID_CARD`: 無効なカード
- `CARD_NOT_IN_HAND`: 手札にないカード
- `INVALID_ACTION`: 無効なアクション

### 接続関連

- `CONNECTION_ERROR`: 接続エラー
- `AUTHENTICATION_FAILED`: 認証失敗
- `RATE_LIMIT_EXCEEDED`: レート制限超過

## 通信フロー例

### ゲーム開始までの流れ

```
1. Client A → create-room
2. Server → room-created (to Client A)
3. Client B → join-room
4. Server → room-joined (to Client B)
5. Server → player-joined (to Client A)
6. Client A → player-ready
7. Server → player-ready-updated (to all)
8. Client B → player-ready
9. Server → player-ready-updated (to all)
10. Client A → start-game
11. Server → game-started (to all)
```

### カードプレイの流れ

```
1. Client A → play-card
2. Server → Validate action
3. Server → action-result (to Client A)
4. Server → game-state-updated (to all)
5. Server → turn-changed (to all)
```
