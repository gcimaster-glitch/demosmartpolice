# Gemini Studio更新統合プラン

## 📊 現状分析

### Gemini Studioの新ファイル
- モック認証に戻っている (AuthContext.tsx)
- apiClient.tsが存在しない
- 多数の新しいコンポーネント追加
- UI/UXの改善あり

### 現在の統合済みファイル (保護必須)
1. `client/src/AuthContext.tsx` - 実際のAPI認証実装
2. `client/src/Login.tsx` - API統合済みログイン
3. `client/src/services/apiClient.ts` - 完全なAPIクライアント
4. `client/.env.local` - 環境変数 (VITE_API_BASE_URL=/api)
5. `client/vite.config.ts` - Proxy + allowedHosts設定
6. `client/src/components/pages/AnnouncementsIntegrated.tsx` - API統合済みお知らせ

## 🎯 統合戦略

### フェーズ1: 安全な基盤ファイルの更新
1. 新しいコンポーネントをコピー (認証以外)
2. types.ts更新
3. ClientDataContext.tsx更新 (モックデータのまま)

### フェーズ2: 統合ファイルの保護
1. AuthContext.tsx - API統合版を維持
2. Login.tsx - API統合版を維持
3. apiClient.ts - 現在の実装を維持
4. vite.config.ts - 設定を維持
5. .env.local - 設定を維持

### フェーズ3: 新規ページのAPI統合 (段階的)
1. Dashboard
2. Messages/Tickets
3. Client Management
4. その他ページ

## 🛡️ リスク管理

### 高リスク: 絶対に上書きしない
- services/apiClient.ts
- AuthContext.tsx (統合版)
- Login.tsx (統合版)
- vite.config.ts
- .env.local

### 中リスク: 慎重に統合
- App.tsx (ルーティング変更の可能性)
- components/pages/* (新機能追加)

### 低リスク: 安全にコピー可能
- 新しいコンポーネント
- types.ts
- ClientDataContext.tsx
