# カードゲーム アーキテクチャ仕様書

## 概要

4-5人対戦のターン制オンラインカードゲームを、Next.js（フロントエンド）とSocket.io（バックエンド）を使用して実装する。

## 技術スタック

### フロントエンド

- **Next.js 14** (App Router)
- **TypeScript**
- **Tailwind CSS** (スタイリング)
- **Socket.io-client** (リアルタイム通信)
- **Zustand** (状態管理)

### バックエンド

- **Node.js**
- **TypeScript**
- **Socket.io** (リアルタイム通信)
- **Express.js** (HTTP API)
- **Redis** (セッション管理・ゲーム状態保存)

### 開発・デプロイ

- **Monorepo構造** (Turborepo)
- **Docker** (コンテナ化)
- **ESLint + Prettier** (コード品質)

## プロジェクト構造

```
joshi_dokusai/
├── apps/
│   ├── frontend/          # Next.js アプリケーション
│   └── backend/           # Socket.io サーバー
├── packages/
│   ├── shared/            # 共通型定義・ユーティリティ
│   └── ui/                # 共通UIコンポーネント
├── docs/                  # ドキュメント
├── docker-compose.yml     # 開発環境
├── turbo.json            # Turborepo設定
└── package.json          # ルートpackage.json
```

## アーキテクチャ概要

### 1. クライアント・サーバー通信

- **Socket.io**を使用したリアルタイム双方向通信
- **イベント駆動アーキテクチャ**
- **型安全な通信**（共通型定義を使用）

### 2. ゲーム状態管理

- **サーバーサイド**：権威的なゲーム状態管理
- **クライアントサイド**：UI状態とサーバー状態の同期
- **Redis**：ゲームルーム・セッション管理

### 3. セキュリティ

- **サーバーサイドバリデーション**：全てのゲームアクション
- **レート制限**：不正な操作の防止
- **セッション管理**：プレイヤー認証

## 主要コンポーネント

### バックエンド

#### 1. Game Engine

```typescript
class GameEngine {
  // ゲームロジックの中核
  // カードの配布、ターン管理、勝利条件判定
}
```

#### 2. Room Manager

```typescript
class RoomManager {
  // ゲームルームの作成・管理
  // プレイヤーの参加・退出処理
}
```

#### 3. Socket Event Handlers

```typescript
// プレイヤーアクションの処理
// ゲーム状態の同期
```

### フロントエンド

#### 1. Game State Management (Zustand)

```typescript
interface GameStore {
  gameState: GameState;
  playerHand: Card[];
  currentPlayer: string;
  // アクション
}
```

#### 2. Socket Connection Manager

```typescript
class SocketManager {
  // Socket.io接続管理
  // イベントリスナー登録
  // 再接続処理
}
```

#### 3. UI Components

- **GameBoard**: メインゲーム画面
- **PlayerHand**: プレイヤーの手札
- **GameLobby**: ゲーム待機室
- **GameHistory**: ゲーム履歴

## データフロー

### 1. ゲーム開始フロー

```
Client → [join-room] → Server
Server → [room-joined] → Client
Server → [game-started] → All Clients
```

### 2. ターンアクションフロー

```
Client → [play-card] → Server
Server → Validate Action
Server → Update Game State
Server → [game-updated] → All Clients
```

### 3. ゲーム終了フロー

```
Server → Check Win Condition
Server → [game-ended] → All Clients
Server → Save Game Result
```

## Socket.io イベント定義

### クライアント → サーバー

- `join-room`: ルーム参加
- `leave-room`: ルーム退出
- `play-card`: カードプレイ
- `pass-turn`: ターンパス

### サーバー → クライアント

- `room-joined`: ルーム参加完了
- `player-joined`: 他プレイヤー参加
- `player-left`: プレイヤー退出
- `game-started`: ゲーム開始
- `game-updated`: ゲーム状態更新
- `game-ended`: ゲーム終了
- `error`: エラー通知

## 状態管理戦略

### サーバーサイド状態

```typescript
interface GameState {
  id: string;
  players: Player[];
  currentPlayerIndex: number;
  deck: Card[];
  discardPile: Card[];
  phase: GamePhase;
  turnCount: number;
}
```

### クライアントサイド状態

```typescript
interface ClientGameState {
  gameState: GameState;
  myPlayerId: string;
  myHand: Card[];
  isMyTurn: boolean;
  selectedCard?: Card;
}
```

## エラーハンドリング

### 1. 接続エラー

- 自動再接続機能
- 接続状態の表示
- オフライン時の適切な処理

### 2. ゲームエラー

- 不正なアクションの検証
- エラーメッセージの表示
- ゲーム状態の復旧

### 3. サーバーエラー

- ログ記録
- エラー通知
- グレースフルシャットダウン

## パフォーマンス考慮事項

### 1. 状態同期の最適化

- 差分更新のみ送信
- 必要な情報のみクライアントに送信
- バッチ処理による通信量削減

### 2. メモリ管理

- 終了したゲームの状態クリーンアップ
- Redis TTL設定
- 接続プールの管理

### 3. スケーラビリティ

- 水平スケーリング対応
- ロードバランサー対応
- Redis Cluster対応

## 開発フェーズ

### Phase 1: 基盤構築

- プロジェクト構造セットアップ
- 共通型定義作成
- 基本的なSocket.io通信

### Phase 2: コア機能実装

- ゲームエンジン実装
- ルーム管理機能
- 基本UI作成

### Phase 3: 機能拡張

- エラーハンドリング強化
- パフォーマンス最適化
- テスト実装

### Phase 4: 本番対応

- セキュリティ強化
- モニタリング実装
- デプロイ環境構築
