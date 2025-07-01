# Firebase実装ガイド

## 概要

Socket.ioからFirebase Realtime Databaseへの移行実装ガイド。
段階的な移行アプローチで安全に実装を進める。

## 実装フェーズ

### Phase 1: 基本認証とルーム管理
**目標**: Firebase認証とルーム作成・参加機能

#### 1.1 Firebase認証実装
```typescript
// apps/frontend/src/lib/auth.ts
import { auth } from './firebase';
import { signInAnonymously } from 'firebase/auth';

export async function signInAnonymous() {
  try {
    const result = await signInAnonymously(auth);
    return result.user;
  } catch (error) {
    console.error('認証エラー:', error);
    throw error;
  }
}
```

#### 1.2 ルーム管理コンポーネント
```typescript
// apps/frontend/src/components/RoomManager.tsx
import { database } from '@/lib/firebase';
import { ref, push, onValue, off } from 'firebase/database';
import { FirebaseRoom, generateRoomId } from '@joshi-dokusai/shared';

export function useRooms() {
  const [rooms, setRooms] = useState<FirebaseRoom[]>([]);
  
  useEffect(() => {
    const roomsRef = ref(database, 'rooms');
    const unsubscribe = onValue(roomsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const roomList = Object.values(data) as FirebaseRoom[];
        setRooms(roomList.filter(room => room.status === 'waiting'));
      }
    });
    
    return () => off(roomsRef, 'value', unsubscribe);
  }, []);
  
  return { rooms };
}
```

### Phase 2: ゲーム状態管理
**目標**: ゲーム開始とリアルタイム状態同期

#### 2.1 ゲーム状態フック
```typescript
// apps/frontend/src/hooks/useGameState.ts
import { database } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { FirebaseGame } from '@joshi-dokusai/shared';

export function useGameState(gameId: string) {
  const [game, setGame] = useState<FirebaseGame | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    if (!gameId) return;
    
    const gameRef = ref(database, `games/${gameId}`);
    const unsubscribe = onValue(gameRef, (snapshot) => {
      const data = snapshot.val();
      setGame(data);
      setLoading(false);
    });
    
    return () => off(gameRef, 'value', unsubscribe);
  }, [gameId]);
  
  return { game, loading };
}
```

#### 2.2 プレイヤー手札管理
```typescript
// apps/frontend/src/hooks/usePlayerHand.ts
import { database, auth } from '@/lib/firebase';
import { ref, onValue, off } from 'firebase/database';
import { FirebasePlayerHand } from '@joshi-dokusai/shared';

export function usePlayerHand(gameId: string) {
  const [hand, setHand] = useState<FirebasePlayerHand | null>(null);
  
  useEffect(() => {
    if (!gameId || !auth.currentUser) return;
    
    const handRef = ref(database, `playerHands/${gameId}/${auth.currentUser.uid}`);
    const unsubscribe = onValue(handRef, (snapshot) => {
      const data = snapshot.val();
      setHand(data);
    });
    
    return () => off(handRef, 'value', unsubscribe);
  }, [gameId]);
  
  return { hand };
}
```

### Phase 3: Cloud Functions実装
**目標**: ゲームロジックの検証とセキュリティ

#### 3.1 ゲーム開始Function
```typescript
// functions/src/game-functions.ts
import { onCall } from 'firebase-functions/v2/https';
import { getDatabase } from 'firebase-admin/database';
import { generateGameId, GAME_CONFIG } from '@joshi-dokusai/shared';

export const startGame = onCall(async (request) => {
  const { roomId } = request.data;
  const uid = request.auth?.uid;
  
  if (!uid) {
    throw new Error('認証が必要です');
  }
  
  const db = getDatabase();
  const roomRef = db.ref(`rooms/${roomId}`);
  const roomSnapshot = await roomRef.once('value');
  const room = roomSnapshot.val();
  
  if (!room || room.createdBy !== uid) {
    throw new Error('ルームが見つからないか、権限がありません');
  }
  
  // ゲーム初期化
  const gameId = generateGameId();
  const players = Object.values(room.players);
  
  // 役割分担（最初のプレイヤーが上司）
  const gameData = {
    id: gameId,
    roomId,
    createdAt: Date.now(),
    status: 'playing',
    phase: 'dictatorship',
    currentPlayerIndex: 1, // 部下から開始
    turnCount: 1,
    maxTurns: GAME_CONFIG.MAX_TURNS,
    players: {},
    gameState: {
      deckCount: GAME_CONFIG.TOTAL_WORK_CARDS,
      discardPile: [],
      dictatorshipEffects: {
        nullificationsUsed: {
          boss4Players: 0,
          boss3Players: 0
        }
      }
    },
    turnHistory: [],
    lastUpdated: Date.now()
  };
  
  // プレイヤー情報設定
  players.forEach((player, index) => {
    const role = index === 0 ? 'boss' : 'subordinate';
    const maxLife = role === 'boss' ? GAME_CONFIG.BOSS_INITIAL_LIFE : GAME_CONFIG.SUBORDINATE_INITIAL_LIFE;
    
    gameData.players[player.id] = {
      id: player.id,
      name: player.name,
      role,
      life: maxLife,
      maxLife,
      handCount: role === 'boss' ? GAME_CONFIG.BOSS_INITIAL_HAND_SIZE : GAME_CONFIG.SUBORDINATE_INITIAL_HAND_SIZE,
      isConnected: true,
      lastAction: Date.now()
    };
  });
  
  // データベース更新
  await db.ref(`games/${gameId}`).set(gameData);
  await db.ref(`rooms/${roomId}/gameId`).set(gameId);
  await db.ref(`rooms/${roomId}/status`).set('playing');
  
  return { gameId };
});
```

#### 3.2 カードプレイFunction
```typescript
// functions/src/card-functions.ts
export const playCard = onCall(async (request) => {
  const { gameId, cardId, targetPlayerId } = request.data;
  const uid = request.auth?.uid;
  
  if (!uid) {
    throw new Error('認証が必要です');
  }
  
  const db = getDatabase();
  
  // ゲーム状態取得
  const gameRef = db.ref(`games/${gameId}`);
  const gameSnapshot = await gameRef.once('value');
  const game = gameSnapshot.val();
  
  if (!game || !game.players[uid]) {
    throw new Error('ゲームが見つからないか、参加していません');
  }
  
  // プレイヤー手札取得
  const handRef = db.ref(`playerHands/${gameId}/${uid}`);
  const handSnapshot = await handRef.once('value');
  const hand = handSnapshot.val();
  
  if (!hand || !hand.cards.find(card => card.id === cardId)) {
    throw new Error('指定されたカードが手札にありません');
  }
  
  // ゲームロジック検証
  const validationResult = validateCardPlay(game, uid, cardId, targetPlayerId);
  if (!validationResult.valid) {
    throw new Error(validationResult.error);
  }
  
  // カード効果適用
  const updatedGame = applyCardEffect(game, uid, cardId, targetPlayerId);
  const updatedHand = removeCardFromHand(hand, cardId);
  
  // データベース更新
  await gameRef.set(updatedGame);
  await handRef.set(updatedHand);
  
  return { success: true };
});
```

## セキュリティルール実装

### database.rules.json
```json
{
  "rules": {
    "rooms": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null && (
          !data.exists() || 
          data.child('createdBy').val() == auth.uid || 
          data.child('players').child(auth.uid).exists()
        )",
        "players": {
          "$playerId": {
            ".write": "auth != null && auth.uid == $playerId"
          }
        }
      }
    },
    "games": {
      "$gameId": {
        ".read": "auth != null && data.child('players').child(auth.uid).exists()",
        ".write": false
      }
    },
    "playerHands": {
      "$gameId": {
        "$playerId": {
          ".read": "auth != null && auth.uid == $playerId",
          ".write": false
        }
      }
    },
    "presence": {
      "$userId": {
        ".read": "auth != null",
        ".write": "auth != null && auth.uid == $userId"
      }
    }
  }
}
```

## テスト戦略

### 1. 単体テスト
```typescript
// functions/src/__tests__/game-logic.test.ts
import { validateCardPlay, applyCardEffect } from '../game-logic';

describe('ゲームロジック', () => {
  test('攻撃カードの効果適用', () => {
    const game = createMockGame();
    const result = applyCardEffect(game, 'player1', 'attack_card', 'boss');
    
    expect(result.players.boss.life).toBe(6); // 7 - 1
    expect(result.players.player1.life).toBe(3); // 4 - 1 (自傷)
  });
});
```

### 2. 統合テスト
```typescript
// apps/frontend/src/__tests__/firebase-integration.test.ts
import { render, screen, waitFor } from '@testing-library/react';
import { RoomManager } from '../components/RoomManager';

describe('Firebase統合', () => {
  test('ルーム一覧の表示', async () => {
    render(<RoomManager />);
    
    await waitFor(() => {
      expect(screen.getByText('テストルーム')).toBeInTheDocument();
    });
  });
});
```

## デプロイ手順

### 1. Functions デプロイ
```bash
cd functions
npm run build
firebase deploy --only functions
```

### 2. Database Rules デプロイ
```bash
firebase deploy --only database
```

### 3. Hosting デプロイ
```bash
cd apps/frontend
npm run build
firebase deploy --only hosting
```

## 監視とログ

### 1. Firebase Console
- Realtime Database使用量監視
- Functions実行ログ確認
- 認証ユーザー数確認

### 2. エラーハンドリング
```typescript
// apps/frontend/src/lib/error-handler.ts
export function handleFirebaseError(error: any) {
  console.error('Firebase Error:', error);
  
  // ユーザーフレンドリーなエラーメッセージ
  switch (error.code) {
    case 'permission-denied':
      return 'アクセス権限がありません';
    case 'network-request-failed':
      return 'ネットワークエラーが発生しました';
    default:
      return 'エラーが発生しました。しばらく待ってから再試行してください。';
  }
}
```

## パフォーマンス最適化

### 1. データ監視の最適化
```typescript
// 必要な部分のみ監視
const gameStateRef = ref(database, `games/${gameId}/gameState`);
// ゲーム全体ではなく、gameStateのみ監視
```

### 2. オフライン対応
```typescript
import { goOffline, goOnline } from 'firebase/database';

// ネットワーク状態に応じてオフライン制御
window.addEventListener('online', () => goOnline(database));
window.addEventListener('offline', () => goOffline(database));
```
