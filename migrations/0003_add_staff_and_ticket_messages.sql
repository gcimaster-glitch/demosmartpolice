-- Add staff management table
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  real_name TEXT NOT NULL,
  business_name TEXT,
  display_name_type TEXT DEFAULT 'real' CHECK(display_name_type IN ('real', 'business')),
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CrisisManager', 'Consultant', 'Legal', 'Admin', 'Support')),
  position TEXT,
  phone TEXT,
  photo_url TEXT,
  profile TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'inactive')),
  approval_status TEXT DEFAULT 'pending' CHECK(approval_status IN ('pending', 'approved', 'rejected')),
  joined_date DATE DEFAULT CURRENT_DATE,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for staff
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);
CREATE INDEX IF NOT EXISTS idx_staff_status ON staff(status);
CREATE INDEX IF NOT EXISTS idx_staff_approval_status ON staff(approval_status);

-- Assignee columns already exist in clients table (main_assignee_id, sub_assignee_id)
-- Just create indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_clients_main_assignee ON clients(main_assignee_id);
CREATE INDEX IF NOT EXISTS idx_clients_sub_assignee ON clients(sub_assignee_id);

-- Add ticket messages table for message threads
CREATE TABLE IF NOT EXISTS ticket_messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id INTEGER NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  sender_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('client', 'staff')),
  message TEXT NOT NULL,
  is_internal BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add index for ticket messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);

-- Insert initial staff data
INSERT OR IGNORE INTO staff (id, name, real_name, business_name, display_name_type, email, role, position, phone, profile, status, approval_status, joined_date)
VALUES 
  (1, '高橋 公義', '高橋 公義', 'T.K.コンサルティング', 'real', 'takahashi@smartpolice.jp', 'CrisisManager', '専属危機管理官', '090-1234-5678', '元警視庁公安部出身。サイバーセキュリティと物理セキュリティの両方に精通し、数々の企業危機を解決に導いてきたエキスパート。', 'active', 'approved', '2020-04-01'),
  (2, '佐藤 誠', '佐藤 誠', '佐藤コンサル', 'business', 'sato@smartpolice.jp', 'Consultant', 'シニアコンサルタント', '090-8765-4321', '大手コンサルティングファームにて10年以上の経験を積んだ後、スマートポリスに参加。特に内部統制とコンプライアンス分野を専門とする。', 'active', 'approved', '2021-08-15'),
  (3, '鈴木 一郎', '鈴木 一郎', '鈴木リーガルオフィス', 'real', 'suzuki@smartpolice.jp', 'Legal', '顧問弁護士', '080-1122-3344', '企業法務を専門とする弁護士。契約書のレビューから訴訟対応まで、法的な側面から企業を強力にバックアップする。', 'active', 'approved', '2022-01-10');

-- Update existing clients with staff assignments (if any exist)
UPDATE clients SET main_assignee_id = 1 WHERE id = 1;
UPDATE clients SET main_assignee_id = 2, sub_assignee_id = 1 WHERE id = 2;
