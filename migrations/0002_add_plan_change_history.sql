-- Migration: Add plan change history table
-- Created: 2025-11-11

-- プラン変更履歴テーブル
CREATE TABLE IF NOT EXISTS plan_change_history (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  old_plan_id TEXT NOT NULL,
  new_plan_id TEXT NOT NULL,
  changed_by_user_id TEXT NOT NULL,
  change_reason TEXT,
  change_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id),
  FOREIGN KEY (old_plan_id) REFERENCES plans(id),
  FOREIGN KEY (new_plan_id) REFERENCES plans(id),
  FOREIGN KEY (changed_by_user_id) REFERENCES users(id)
);

-- インデックス作成
CREATE INDEX IF NOT EXISTS idx_plan_change_client ON plan_change_history(client_id);
CREATE INDEX IF NOT EXISTS idx_plan_change_date ON plan_change_history(change_date DESC);
