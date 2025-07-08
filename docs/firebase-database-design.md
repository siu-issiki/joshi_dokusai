# Firebase Realtime Database 設計仕様書

## 概要

「上司独裁」カードゲーム用のFirebase Realtime Database構造設計。
リアルタイム性を重視し、効率的なデータ同期とセキュリティを実現する。

## データベース構造

### 全体構造

```
joshi-dokusai-game/
├── rooms/                    # ゲームルーム管理
├── games/                    # アクティブなゲーム状態
├── players/                  # プレイヤー情報
├── presence/                 # オンライン状態管理
└── gameHistory/              # 完了したゲーム履歴
```

## 詳細設計

### 1. rooms/ - ルーム管理

```json
{
  "rooms": {
    "{roomId}": {
      "id": "room_abc123",
      "name": "テストルーム",
      "createdBy": "user_123",
      "createdAt": 1704067200000,
      "maxPlayers": 5,
      "currentPlayers": 3,
      "isPrivate": false,
      "password": null,
      "status": "waiting",
      "gameId": null,
      "players": {
        "user_123": {
          "id": "user_123",
          "name": "プレイヤー1",
          "isReady": true,
          "joinedAt": 1704067200000,
          "role": null
        }
      }
    }
  }
}
```

**フィールド説明：**

- `status`: "waiting" | "playing" | "finished"
- `gameId`: ゲーム開始時に生成されるゲームID
- `players`: ルーム内のプレイヤー一覧

### 2. games/ - ゲーム状態

```json
{
  "games": {
    "{gameId}": {
      "id": "game_xyz789",
      "roomId": "room_abc123",
      "createdAt": 1704067200000,
      "status": "playing",
      "phase": "subordinate_turn",
      "currentPlayerIndex": 1,
      "turnCount": 2,
      "maxTurns": 5,
      "
      "players": {
        "user_123": {
          "id": "user_123",
          "name": "上司",
          "role": "boss",
          "life": 5,
          "maxLife": 7,
          "handCount": 4,
          "isConnected": true,
          "lastAction": 1704067300000
        },
        "user_456": {
          "id": "user_456",
          "name": "部下A",
          "role": "subordinate",
          "life": 2,
          "maxLife": 4,
          "handCount": 3,
          "isConnected": true,
          "lastAction": 1704067250000
        }
      },
      "gameState": {
        "deckCount": 35,
        "discardPile": [
          {
            "id": "card_001",
            "type": "work",
            "category": "attack",
            "name": "攻撃",
            "playedBy": "user_456",
            "playedAt": 1704067250000
          }
        ],
        "presidentCard": {
          "card": {
            "id": "card_007",
            "type": "work",
            "category": "president",
            "name": "社長"
          },
          "owner": "boss",
          "turnsRemaining": 1,
          "placedAt": 1704067200000
        },
        "dictatorshipEffects": {
          "currentCard": {
            "id": "dict_001",
            "name": "朝まで飲み会",
            "target": "all",
            "isNullified": false
          },
          "nullificationsUsed": {
            "boss4Players": 0,
            "boss3Players": 1
          }
        }
      },
      "turnHistory": [
        {
          "turnNumber": 1,
          "phase": "dictatorship",
          "action": {
            "type": "dictatorship_card",
            "cardId": "dict_001",
            "timestamp": 1704067200000
          }
        }
      ],
      "lastUpdated": 1704067300000
    }
  }
}
```

### 3. players/ - プレイヤー個人情報

```json
{
  "players": {
    "{userId}": {
      "id": "user_123",
      "displayName": "プレイヤー1",
      "createdAt": 1704067200000,
      "stats": {
        "gamesPlayed": 15,
        "gamesWon": 8,
        "winRate": 0.533,
        "favoriteRole": "boss"
      },
      "currentGame": {
        "gameId": "game_xyz789",
        "roomId": "room_abc123",
        "role": "boss"
      }
    }
  }
}
```

### 4. playerHands/ - プレイヤー手札（プライベート）

```json
{
  "playerHands": {
    "{gameId}": {
      "{userId}": {
        "cards": [
          {
            "id": "card_101",
            "type": "work",
            "category": "attack",
            "name": "攻撃",
            "description": "部下：自身-1ライフで上司に1ダメージ"
          },
          {
            "id": "card_102",
            "type": "work",
            "category": "defense",
            "name": "防御",
            "description": "ダメージを1軽減"
          }
        ],
        "lastUpdated": 1704067300000
      }
    }
  }
}
```

### 5. presence/ - オンライン状態

```json
{
  "presence": {
    "{userId}": {
      "online": true,
      "lastSeen": 1704067300000,
      "currentRoom": "room_abc123",
      "currentGame": "game_xyz789"
    }
  }
}
```

### 6. gameHistory/ - ゲーム履歴

```json
{
  "gameHistory": {
    "{gameId}": {
      "id": "game_xyz789",
      "startedAt": 1704067200000,
      "endedAt": 1704067800000,
      "duration": 600000,
      "winner": "subordinate",
      "players": [
        {
          "id": "user_123",
          "name": "上司",
          "role": "boss",
          "finalLife": 0
        }
      ],
      "finalState": {
        "turnCount": 4,
        "endReason": "boss_defeated"
      }
    }
  }
}
```

## セキュリティルール設計

### 基本方針

1. **認証必須**: 全てのデータアクセスに認証が必要
2. **プレイヤー制限**: 自分が参加しているゲーム/ルームのみアクセス可能
3. **手札保護**: 自分の手札のみ読み取り可能
4. **ゲーム整合性**: Cloud Functionsによる検証

### ルール例

```json
{
  "rules": {
    "rooms": {
      ".read": "auth != null",
      "$roomId": {
        ".write": "auth != null && (data.child('createdBy').val() == auth.uid || data.child('players').child(auth.uid).exists())"
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
        "$userId": {
          ".read": "auth != null && auth.uid == $userId",
          ".write": false
        }
      }
    }
  }
}
```

## データフロー

### 1. ルーム作成・参加

```
1. Client → rooms/{roomId} 作成
2. Other Clients → rooms/ 監視
3. Client → rooms/{roomId}/players/{userId} 追加
4. All Clients → リアルタイム更新受信
```

### 2. ゲーム開始

```
1. Room Owner → Cloud Function: startGame
2. Function → games/{gameId} 作成
3. Function → playerHands/{gameId}/{userId} 作成
4. Function → rooms/{roomId}/gameId 更新
5. All Clients → ゲーム画面に遷移
```

### 3. ターン進行

```
1. Client → Cloud Function: playCard
2. Function → ゲーム状態検証
3. Function → games/{gameId} 更新
4. Function → playerHands/ 更新
5. All Clients → リアルタイム更新受信
```

## パフォーマンス考慮事項

### 1. データ分割

- 手札は別ノードで管理（プライバシー保護）
- 履歴は別ノードで管理（パフォーマンス向上）

### 2. インデックス設計

- rooms: status, createdAt
- games: status, createdAt
- gameHistory: endedAt, winner

### 3. リアルタイム監視

- 必要な部分のみ監視
- 不要になったら監視解除

## 実装優先度

### Phase 1: 基本機能

- rooms/ 構造
- games/ 基本構造
- playerHands/ 構造

### Phase 2: 拡張機能

- presence/ 監視
- gameHistory/ 保存
- 統計情報

### Phase 3: 最適化

- セキュリティルール強化
- パフォーマンス最適化
- エラーハンドリング強化
