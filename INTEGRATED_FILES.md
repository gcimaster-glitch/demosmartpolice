# API統合済み重要ファイル

## バックエンドとの統合が完了しているファイル

### 認証関連
- `client/src/AuthContext.tsx` - 認証コンテキスト(API統合済み)
- `client/src/Login.tsx` - ログインページ(API統合済み)
- `client/src/services/apiClient.ts` - APIクライアント(完全実装)

### 環境設定
- `client/.env.local` - 環境変数(API_BASE_URL=/api)
- `client/vite.config.ts` - Vite設定(proxy, allowedHosts)

### API統合済みページ
- `client/src/components/pages/AnnouncementsIntegrated.tsx` - お知らせページ(API統合済み)

### バックエンド全体
- `src/` - 全てのバックエンドコード
- `migrations/` - データベースマイグレーション
- `wrangler.jsonc` - Cloudflare設定
- `.dev.vars` - 環境変数
- `ecosystem.config.cjs` - PM2設定

## デモアカウント
- 管理者: superadmin@smartpolis.jp / admin123
- クライアント: yamada@abc-shoji.co.jp / client123

## バックアップURL
https://page.gensparksite.com/project_backups/smartpolis-portal-before-gemini-update.tar.gz
