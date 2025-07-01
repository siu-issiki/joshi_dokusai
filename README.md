# 上司独裁 (Boss Dictatorship)

4-5人用の非対称型対戦オンラインカードゲーム

## 🎮 ゲーム概要

「上司独裁」は上司1人 vs 部下3-4人の構造で遊ぶターン制カードゲームです。
部下陣営は協力して上司を倒すか、5ターン生き延びることを目指します。
上司は部下3人以上を倒すことで勝利となります。

## 🏗️ プロジェクト構造

```
joshi_dokusai/
├── apps/
│   ├── frontend/          # Next.js フロントエンド
│   └── backend/           # Node.js + Socket.io バックエンド
├── packages/
│   ├── shared/            # 共通型定義・ユーティリティ
│   └── ui/                # 共通UIコンポーネント
├── docs/                  # ゲームルール・仕様書
└── README.md
```

## 🚀 開発環境セットアップ

### 前提条件

- Node.js 18.0.0 以上
- npm 10.0.0 以上

### インストール

1. リポジトリをクローン
```bash
git clone https://github.com/siu-issiki/joshi_dokusai.git
cd joshi_dokusai
```

2. 依存関係をインストール
```bash
npm install
```

3. 環境変数を設定
```bash
# ルートディレクトリ
cp .env.sample .env

# フロントエンド
cp apps/frontend/.env.sample apps/frontend/.env.local
```

4. 開発サーバーを起動
```bash
npm run dev
```

これで以下のサーバーが起動します：
- フロントエンド: http://localhost:3000
- バックエンド: http://localhost:3001

## 🛠️ 利用可能なスクリプト

```bash
# 開発サーバー起動
npm run dev

# プロダクションビルド
npm run build

# リンター実行
npm run lint

# 型チェック
npm run type-check

# コードフォーマット
npm run format

# ビルド成果物削除
npm run clean
```

## 📝 環境変数

### バックエンド (.env)

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NODE_ENV` | 実行環境 | `development` |
| `PORT` | サーバーポート | `3001` |
| `FRONTEND_URL` | フロントエンドURL（CORS用） | `http://localhost:3000` |
| `REDIS_URL` | Redis接続URL | `redis://localhost:6379` |
| `LOG_LEVEL` | ログレベル | `info` |

### フロントエンド (.env.local)

| 変数名 | 説明 | デフォルト値 |
|--------|------|-------------|
| `NEXT_PUBLIC_API_URL` | バックエンドAPI URL | `http://localhost:3001` |
| `NEXT_PUBLIC_SOCKET_URL` | Socket.io サーバーURL | `http://localhost:3001` |
| `NEXT_PUBLIC_GAME_NAME` | ゲーム名 | `上司独裁` |
| `NEXT_PUBLIC_MAX_PLAYERS` | 最大プレイヤー数 | `5` |

## 🎯 技術スタック

### フロントエンド
- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Socket.io-client** - リアルタイム通信
- **Zustand** - 状態管理

### バックエンド
- **Node.js** - サーバーランタイム
- **Express.js** - Web フレームワーク
- **Socket.io** - リアルタイム通信
- **TypeScript** - 型安全性
- **Redis** - セッション管理（予定）

### 開発ツール
- **Turborepo** - モノレポ管理
- **ESLint** - コード品質
- **Prettier** - コードフォーマット

## 📚 ドキュメント

- [ゲームルール](./docs/game-rules.md)
- [アーキテクチャ仕様](./docs/architecture.md)
- [Socket.io イベント仕様](./docs/socket-events.md)

## 🤝 コントリビューション

1. フォークする
2. フィーチャーブランチを作成 (`git checkout -b feature/amazing-feature`)
3. 変更をコミット (`git commit -m 'Add some amazing feature'`)
4. ブランチにプッシュ (`git push origin feature/amazing-feature`)
5. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスの下で公開されています。
