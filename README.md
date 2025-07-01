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
│   └── frontend/          # Next.js フロントエンド
├── packages/
│   ├── shared/            # 共通型定義・ユーティリティ
│   └── ui/                # 共通UIコンポーネント
├── functions/             # Firebase Cloud Functions
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

4. Firebase設定

```bash
# Firebase CLIにログイン
firebase login

# Firebase初期化（既に完了済み）
# firebase init
```

5. 開発サーバーを起動

```bash
npm run dev
```

これで以下のサーバーが起動します：

- フロントエンド: http://localhost:3000
- Firebase Emulator: http://localhost:4000 (必要に応じて)

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

### フロントエンド (.env.local)

| 変数名                                     | 説明                         | デフォルト値                                        |
| ------------------------------------------ | ---------------------------- | --------------------------------------------------- |
| `NEXT_PUBLIC_FIREBASE_API_KEY`             | Firebase API Key             | Firebase Consoleから取得                            |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`         | Firebase Auth Domain         | `your-project.firebaseapp.com`                      |
| `NEXT_PUBLIC_FIREBASE_DATABASE_URL`        | Realtime Database URL        | `https://your-project-default-rtdb.firebaseio.com/` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID`          | Firebase Project ID          | Firebase Consoleから取得                            |
| `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`      | Firebase Storage Bucket      | `your-project.appspot.com`                          |
| `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID` | Firebase Messaging Sender ID | Firebase Consoleから取得                            |
| `NEXT_PUBLIC_FIREBASE_APP_ID`              | Firebase App ID              | Firebase Consoleから取得                            |
| `NEXT_PUBLIC_GAME_NAME`                    | ゲーム名                     | `上司独裁`                                          |
| `NEXT_PUBLIC_MAX_PLAYERS`                  | 最大プレイヤー数             | `5`                                                 |

## 🎯 技術スタック

### フロントエンド

- **Next.js 15** - React フレームワーク
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **Firebase SDK** - リアルタイム通信・認証
- **Zustand** - 状態管理

### バックエンド

- **Firebase Realtime Database** - リアルタイムデータベース
- **Firebase Cloud Functions** - サーバーレス関数
- **Firebase Authentication** - 認証システム
- **Firebase Hosting** - 静的サイトホスティング
- **TypeScript** - 型安全性

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
