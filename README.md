# Smart Police Portal (スマートポリス企業ポータル)

企業向け危機管理・セキュリティサービスのフルスタックWebアプリケーション

## 🚀 プロジェクト概要

**Smart Police Portal**は、企業のセキュリティと危機管理をサポートする統合プラットフォームです。Cloudflare PagesとHonoを使用した、モダンでスケーラブルなフルスタックアプリケーションです。

### 主な機能

#### ✅ 実装済み機能
- **認証システム**: JWT + Cookie による安全な認証
- **ダッシュボード**: クライアントと管理者用の統計・情報表示
- **メッセージチケット**: 相談・サポートチケットシステム
- **クライアント管理**: 企業情報の管理と編集
- **お知らせ管理**: 重要な通知の配信
- **プラン管理**: フリー、スタンダード、プレミアム、エンタープライズ

#### 🚧 今後実装予定
- **Stripe決済連携**: クレジットカード決済の統合
- **SendGridメール連携**: 通知メール、ステップメールの自動送信
- **Gemini AI**: AIチャット機能とMAP連動
- **サービス管理**: 追加サービスの申込機能
- **セミナー・イベント管理**: オンライン/オフラインイベントの管理
- **資料室**: セキュリティ関連資料のダウンロード
- **請求書管理**: 自動請求書発行システム
- **アフィリエイトプログラム**: 紹介報酬システム

## 🏗️ 技術スタック

### フロントエンド
- **React 19.2**: UIライブラリ
- **React Router DOM**: クライアントサイドルーティング
- **TypeScript**: 型安全な開発
- **Tailwind CSS**: ユーティリティファーストCSSフレームワーク
- **Recharts**: データ可視化
- **Vite**: 高速ビルドツール

### バックエンド
- **Hono**: 軽量高速Webフレームワーク
- **Cloudflare Workers**: エッジコンピューティング
- **Cloudflare D1**: SQLiteベースの分散データベース
- **JWT (jose)**: 認証トークン
- **bcryptjs**: パスワードハッシュ化
- **Zod**: バリデーションライブラリ

### デプロイメント
- **Cloudflare Pages**: 静的サイトホスティング
- **PM2**: プロセス管理（開発環境）
- **Wrangler**: Cloudflare開発ツール

## 📁 プロジェクト構造

```
webapp/
├── src/                      # バックエンドソースコード
│   ├── index.tsx            # メインエントリーポイント
│   ├── routes/              # APIルート
│   │   ├── auth.ts          # 認証API
│   │   ├── dashboard.ts     # ダッシュボードAPI
│   │   ├── tickets.ts       # チケットAPI
│   │   ├── clients.ts       # クライアント管理API
│   │   └── announcements.ts # お知らせAPI
│   ├── middleware/          # ミドルウェア
│   │   └── auth.ts          # 認証ミドルウェア
│   ├── lib/                 # ユーティリティ
│   │   ├── auth.ts          # 認証ヘルパー
│   │   └── db.ts            # データベースヘルパー
│   └── types/               # TypeScript型定義
│       └── index.ts
├── client/                  # フロントエンドReactアプリ
│   ├── src/
│   │   ├── components/      # Reactコンポーネント
│   │   ├── pages/           # ページコンポーネント
│   │   ├── services/        # APIクライアント
│   │   └── types.ts         # 型定義
│   ├── dist/                # ビルド出力
│   └── package.json
├── migrations/              # データベースマイグレーション
│   ├── 0001_initial_schema.sql
│   └── seed.sql
├── public/                  # 静的ファイル
├── dist/                    # サーバービルド出力
├── wrangler.jsonc           # Cloudflare設定
├── package.json
├── tsconfig.json
└── README.md
```

## 🛠️ セットアップ

### 前提条件
- Node.js 18以上
- npm または yarn
- Wrangler CLI (Cloudflare)

### インストール

```bash
# リポジトリのクローン
git clone <repository-url>
cd webapp

# 依存関係のインストール（ルートとクライアント両方）
npm install
cd client && npm install && cd ..
```

### 環境変数の設定

`.dev.vars` ファイルを編集:

```env
JWT_SECRET=your-super-secret-jwt-key
GEMINI_API_KEY=your-gemini-api-key
STRIPE_SECRET_KEY=your-stripe-secret-key
SENDGRID_API_KEY=your-sendgrid-api-key
SENDGRID_FROM_EMAIL=noreply@smartpolis.jp
```

### データベースのセットアップ

```bash
# ローカルD1データベースの初期化
npm run db:migrate:local

# テストデータの投入（オプション）
npm run db:seed
```

## 🚀 開発

### ローカル開発サーバーの起動

```bash
# プロジェクトのビルド
npm run build

# PM2でサーバー起動
pm2 start ecosystem.config.cjs

# または、直接起動
npm run dev
```

サーバーは `http://localhost:3000` で起動します。

### 開発用コマンド

```bash
# クライアントのビルド
npm run build:client

# サーバーのビルド
npm run build:server

# 全体のビルド
npm run build

# データベースリセット
npm run db:reset

# ポートのクリーンアップ
npm run clean-port

# ヘルスチェック
npm run test
```

## 📊 データモデル

### 主要なテーブル

- **users**: ユーザー認証情報
- **clients**: クライアント企業情報
- **plans**: サービスプラン (フリー、スタンダード、プレミアム等)
- **message_tickets**: サポートチケット
- **messages**: チケット内のメッセージ
- **announcements**: お知らせ
- **staff**: スタッフ情報
- **services**: サービス一覧
- **seminars**: セミナー情報
- **events**: イベント情報
- **invoices**: 請求書
- **audit_logs**: 監査ログ

## 🔐 認証とセキュリティ

- **JWT認証**: トークンベースの認証
- **HttpOnly Cookie**: XSS攻撃からの保護
- **bcrypt**: パスワードのハッシュ化
- **ロールベースアクセス制御**: SUPERADMIN, ADMIN, STAFF, CLIENTADMIN, CLIENT, AFFILIATE
- **バリデーション**: Zodによる入力検証

## 🌐 API エンドポイント

### 認証
- `POST /api/auth/login` - ログイン
- `POST /api/auth/register` - 新規登録
- `POST /api/auth/logout` - ログアウト
- `GET /api/auth/me` - 現在のユーザー情報

### ダッシュボード
- `GET /api/dashboard` - クライアントダッシュボード
- `GET /api/dashboard/admin` - 管理者ダッシュボード

### チケット
- `GET /api/tickets` - チケット一覧
- `GET /api/tickets/:id` - チケット詳細
- `POST /api/tickets` - チケット作成
- `POST /api/tickets/:id/messages` - メッセージ追加
- `PUT /api/tickets/:id/status` - ステータス更新（管理者）
- `PUT /api/tickets/:id/assign` - 担当者割当（管理者）

### クライアント
- `GET /api/clients` - クライアント一覧（管理者）
- `GET /api/clients/:id` - クライアント詳細
- `PUT /api/clients/:id` - クライアント情報更新
- `PUT /api/clients/:id/status` - ステータス更新（管理者）

### お知らせ
- `GET /api/announcements` - お知らせ一覧
- `GET /api/announcements/:id` - お知らせ詳細
- `POST /api/announcements` - お知らせ作成（管理者）
- `PUT /api/announcements/:id` - お知らせ更新（管理者）
- `DELETE /api/announcements/:id` - お知らせ削除（管理者）

## 🚀 デプロイ

### Cloudflare Pagesへのデプロイ

```bash
# プロダクションビルド
npm run build

# D1データベースの作成
npm run db:create

# プロダクションデータベースのマイグレーション
npm run db:migrate:prod

# デプロイ
npm run deploy
```

### 環境変数の設定（Cloudflare）

```bash
# Cloudflare Secretsの設定
npx wrangler pages secret put JWT_SECRET --project-name smartpolis-portal
npx wrangler pages secret put GEMINI_API_KEY --project-name smartpolis-portal
npx wrangler pages secret put STRIPE_SECRET_KEY --project-name smartpolis-portal
npx wrangler pages secret put SENDGRID_API_KEY --project-name smartpolis-portal
npx wrangler pages secret put SENDGRID_FROM_EMAIL --project-name smartpolis-portal
```

## 🧪 テスト

### APIのテスト

```bash
# ヘルスチェック
curl http://localhost:3000/api/health

# ログインテスト
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"superadmin@smartpolis.jp","password":"admin123"}'
```

## 📝 デモアカウント

### 管理者アカウント
- **Email**: superadmin@smartpolis.jp
- **Password**: admin123
- **Role**: SUPERADMIN

### クライアントアカウント
- **Email**: yamada@abc-shoji.co.jp
- **Password**: client123
- **Role**: CLIENTADMIN
- **Company**: ABC商事株式会社

## 🔄 今後の開発計画

### フェーズ1（現在）✅
- 基本的な認証システム
- ダッシュボード
- メッセージチケット
- クライアント管理
- お知らせ機能

### フェーズ2（次のステップ）🚧
- Stripe決済統合
- SendGridメール通知
- Gemini AIチャット
- サービス申込機能
- セミナー・イベント管理

### フェーズ3（将来）📋
- 請求書自動発行
- レポート生成
- アフィリエイトプログラム
- モバイルアプリ
- 高度な分析機能

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

## 📄 ライセンス

Proprietary - All Rights Reserved

## 📞 サポート

- **Email**: support@smartpolis.jp
- **Website**: https://smartpolis.jp

## 🎯 現在の状態

### ✅ 完成した機能
- プロジェクト構造とビルド設定
- データベーススキーマと初期データ
- JWT認証システム（登録・ログイン）
- ダッシュボードAPI
- メッセージチケットAPI
- クライアント管理API
- お知らせAPI

### 📊 統計
- **APIエンドポイント**: 20+
- **データベーステーブル**: 25+
- **Reactコンポーネント**: 60+
- **コード行数**: 13,000+

### 🌐 アクセスURL

#### ローカル開発
- **Frontend & API**: http://localhost:3000
- **API Health**: http://localhost:3000/api/health

#### 現在のサンドボックス
- **Public URL**: https://3000-i7zs4em7vwxc0cn6ht6gq-2e77fc33.sandbox.novita.ai
- **API Health**: https://3000-i7zs4em7vwxc0cn6ht6gq-2e77fc33.sandbox.novita.ai/api/health

---

Built with ❤️ using Cloudflare Workers, Hono, and React
