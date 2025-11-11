-- ============================================
-- Smart Police Portal - Database Schema
-- ============================================

-- Users Table (for authentication)
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CLIENTADMIN', 'CLIENT', 'SUPERADMIN', 'ADMIN', 'STAFF', 'AFFILIATE')),
  client_id INTEGER,
  staff_id INTEGER,
  affiliate_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_login DATETIME,
  is_active INTEGER DEFAULT 1,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE,
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Plans Table
CREATE TABLE IF NOT EXISTS plans (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  catchphrase TEXT NOT NULL,
  description TEXT NOT NULL,
  features TEXT NOT NULL, -- JSON array
  initial_fee REAL NOT NULL,
  initial_fee_discount_rate REAL DEFAULT 0,
  monthly_fee REAL NOT NULL,
  monthly_fee_discount_rate REAL DEFAULT 0,
  permissions TEXT NOT NULL, -- JSON array
  has_dedicated_manager INTEGER DEFAULT 0,
  contract_period TEXT NOT NULL,
  is_public INTEGER DEFAULT 1,
  initial_tickets INTEGER DEFAULT 0,
  monthly_tickets INTEGER DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Clients Table (企業情報)
CREATE TABLE IF NOT EXISTS clients (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  company_name TEXT NOT NULL,
  company_name_kana TEXT,
  contact_person TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  prefecture TEXT NOT NULL,
  city TEXT NOT NULL,
  address1 TEXT NOT NULL,
  address2 TEXT,
  corporate_number TEXT,
  website TEXT,
  establishment_date TEXT,
  capital TEXT,
  business_description TEXT,
  employee_count TEXT,
  plan_id TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'suspended')) DEFAULT 'active',
  main_assignee_id INTEGER,
  sub_assignee_id INTEGER,
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  remaining_tickets INTEGER DEFAULT 0,
  affiliate_id TEXT,
  payment_method TEXT CHECK(payment_method IN ('credit_card', 'bank_transfer')),
  billing_name TEXT,
  billing_phone TEXT,
  billing_postal_code TEXT,
  billing_prefecture TEXT,
  billing_city TEXT,
  billing_address1 TEXT,
  billing_address2 TEXT,
  card_last4 TEXT,
  card_brand TEXT,
  card_expiry TEXT,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (plan_id) REFERENCES plans(id),
  FOREIGN KEY (main_assignee_id) REFERENCES staff(id),
  FOREIGN KEY (sub_assignee_id) REFERENCES staff(id),
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id)
);

-- Client Users Table (クライアント企業のユーザー)
CREATE TABLE IF NOT EXISTS client_users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  position TEXT NOT NULL,
  department TEXT,
  phone TEXT NOT NULL,
  family_name_kana TEXT,
  given_name_kana TEXT,
  is_primary_contact INTEGER DEFAULT 0,
  role TEXT NOT NULL CHECK(role IN ('CLIENTADMIN', 'CLIENT')),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Staff Table (スタッフ情報)
CREATE TABLE IF NOT EXISTS staff (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  real_name TEXT NOT NULL,
  business_name TEXT NOT NULL,
  display_name_type TEXT NOT NULL CHECK(display_name_type IN ('real', 'business')),
  email TEXT NOT NULL,
  role TEXT NOT NULL CHECK(role IN ('CrisisManager', 'Consultant', 'Legal', 'Accounting', 'Admin')),
  position TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_url TEXT,
  profile TEXT,
  status TEXT NOT NULL CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  approval_status TEXT NOT NULL CHECK(approval_status IN ('approved', 'pending')) DEFAULT 'pending',
  assigned_clients INTEGER DEFAULT 0,
  joined_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  date_of_birth TEXT,
  gender TEXT CHECK(gender IN ('男性', '女性', 'その他')),
  postal_code TEXT,
  prefecture TEXT,
  city TEXT,
  address1 TEXT,
  address2 TEXT,
  emergency_contact_name TEXT,
  emergency_contact_relationship TEXT,
  emergency_contact_phone TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Staff Skills Table
CREATE TABLE IF NOT EXISTS staff_skills (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  skill_name TEXT NOT NULL,
  skill_level INTEGER NOT NULL CHECK(skill_level >= 1 AND skill_level <= 5),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Staff Qualifications Table
CREATE TABLE IF NOT EXISTS staff_qualifications (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  qualification_name TEXT NOT NULL,
  acquisition_date TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Staff Career History Table
CREATE TABLE IF NOT EXISTS staff_career_history (
  id TEXT PRIMARY KEY,
  staff_id INTEGER NOT NULL,
  company_name TEXT NOT NULL,
  position TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  description TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (staff_id) REFERENCES staff(id) ON DELETE CASCADE
);

-- Message Tickets Table (相談チケット)
CREATE TABLE IF NOT EXISTS message_tickets (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  ticket_id TEXT UNIQUE NOT NULL,
  client_id INTEGER NOT NULL,
  subject TEXT NOT NULL,
  category TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('高', '中', '低')) DEFAULT '中',
  status TEXT NOT NULL CHECK(status IN ('受付中', '対応中', '完了')) DEFAULT '受付中',
  assignee_id INTEGER,
  created_by_user_id INTEGER NOT NULL,
  last_update DATETIME DEFAULT CURRENT_TIMESTAMP,
  expiration_date DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (assignee_id) REFERENCES staff(id),
  FOREIGN KEY (created_by_user_id) REFERENCES users(id)
);

-- Messages Table (チケット内のメッセージ)
CREATE TABLE IF NOT EXISTS messages (
  id TEXT PRIMARY KEY,
  ticket_id INTEGER NOT NULL,
  sender_user_id INTEGER NOT NULL,
  sender_type TEXT NOT NULL CHECK(sender_type IN ('user', 'support', 'admin', 'system')),
  text TEXT NOT NULL,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  read_by TEXT DEFAULT '[]', -- JSON array of user IDs
  has_attachment INTEGER DEFAULT 0,
  FOREIGN KEY (ticket_id) REFERENCES message_tickets(id) ON DELETE CASCADE,
  FOREIGN KEY (sender_user_id) REFERENCES users(id)
);

-- Announcements Table (お知らせ)
CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  category TEXT NOT NULL CHECK(category IN ('メンテナンス', 'サービス情報', 'セキュリティ', 'その他')),
  priority TEXT NOT NULL CHECK(priority IN ('緊急', '重要', '一般')) DEFAULT '一般',
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('published', 'draft')) DEFAULT 'draft',
  published_at DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Services Table (サービス一覧)
CREATE TABLE IF NOT EXISTS services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('emergency', 'security', 'training', 'consulting')),
  description TEXT NOT NULL,
  long_description TEXT NOT NULL,
  price REAL NOT NULL,
  price_type TEXT NOT NULL CHECK(price_type IN ('monthly', 'one-time', 'per-use')),
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  main_image_url TEXT,
  sub_image_urls TEXT, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service Applications Table (サービス申込)
CREATE TABLE IF NOT EXISTS service_applications (
  id TEXT PRIMARY KEY,
  service_id TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  notes TEXT,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  processed_date DATETIME,
  processed_by_user_id INTEGER,
  FOREIGN KEY (service_id) REFERENCES services(id),
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (processed_by_user_id) REFERENCES users(id)
);

-- Seminars Table (セミナー)
CREATE TABLE IF NOT EXISTS seminars (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('セキュリティ', 'マネジメント', '法務', 'その他')),
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('募集中', '開催済み', '中止')) DEFAULT '募集中',
  main_image_url TEXT,
  sub_image_urls TEXT, -- JSON array
  pdf_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Seminar Applications Table
CREATE TABLE IF NOT EXISTS seminar_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  seminar_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  notes TEXT,
  application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (seminar_id) REFERENCES seminars(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Events Table (イベント)
CREATE TABLE IF NOT EXISTS events (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('交流会', '勉強会', 'その他')),
  date TEXT NOT NULL,
  location TEXT NOT NULL,
  capacity INTEGER NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('募集中', '開催済み', '中止')) DEFAULT '募集中',
  main_image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Event Applications Table
CREATE TABLE IF NOT EXISTS event_applications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_id INTEGER NOT NULL,
  client_id INTEGER NOT NULL,
  user_id INTEGER NOT NULL,
  notes TEXT,
  application_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Materials Table (資料室)
CREATE TABLE IF NOT EXISTS materials (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('サービスパンフレット', '法令資料', '社内研修資料', 'その他')),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_size TEXT NOT NULL,
  uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Invoices Table (請求書)
CREATE TABLE IF NOT EXISTS invoices (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  issue_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('paid', 'unpaid', 'overdue')) DEFAULT 'unpaid',
  items TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Ticket Consumption Log Table (チケット消費履歴)
CREATE TABLE IF NOT EXISTS ticket_consumption_logs (
  id TEXT PRIMARY KEY,
  client_id INTEGER NOT NULL,
  date TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('新規相談', '専門家招待', 'オンラインイベント参加')),
  description TEXT NOT NULL,
  ticket_cost INTEGER NOT NULL,
  related_id TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Affiliates Table (アフィリエイト)
CREATE TABLE IF NOT EXISTS affiliates (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  referral_code TEXT UNIQUE NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('active', 'inactive')) DEFAULT 'active',
  default_commission_rate REAL NOT NULL DEFAULT 0.1,
  default_commission_period TEXT NOT NULL CHECK(default_commission_period IN ('first_year', 'lifetime')) DEFAULT 'first_year',
  bank_name TEXT,
  branch_name TEXT,
  account_type TEXT CHECK(account_type IN ('普通', '当座')),
  account_number TEXT,
  account_holder_name TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Referrals Table (紹介履歴)
CREATE TABLE IF NOT EXISTS referrals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_id TEXT NOT NULL,
  client_id INTEGER NOT NULL,
  referral_type TEXT NOT NULL CHECK(referral_type IN ('link', 'code')),
  registration_date DATETIME DEFAULT CURRENT_TIMESTAMP,
  status TEXT NOT NULL CHECK(status IN ('pending', 'approved', 'rejected')) DEFAULT 'pending',
  commission_rate REAL NOT NULL,
  commission_period TEXT NOT NULL CHECK(commission_period IN ('first_year', 'lifetime')),
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE
);

-- Payouts Table (支払履歴)
CREATE TABLE IF NOT EXISTS payouts (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  affiliate_id TEXT NOT NULL,
  payout_date TEXT NOT NULL,
  amount REAL NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('paid', 'pending')) DEFAULT 'pending',
  referral_ids TEXT NOT NULL, -- JSON array
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (affiliate_id) REFERENCES affiliates(id) ON DELETE CASCADE
);

-- Audit Logs Table (監査ログ)
CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  user_id INTEGER NOT NULL,
  action TEXT NOT NULL,
  details TEXT NOT NULL,
  client_id INTEGER,
  ip_address TEXT,
  user_agent TEXT,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (client_id) REFERENCES clients(id)
);

-- Notifications Table (通知履歴)
CREATE TABLE IF NOT EXISTS notifications (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id INTEGER NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('payment', 'urgent', 'general', 'security', 'system')),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  priority TEXT NOT NULL CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
  read INTEGER DEFAULT 0,
  action_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Indexes for Performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_message_tickets_client_id ON message_tickets(client_id);
CREATE INDEX IF NOT EXISTS idx_message_tickets_status ON message_tickets(status);
CREATE INDEX IF NOT EXISTS idx_messages_ticket_id ON messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status);
CREATE INDEX IF NOT EXISTS idx_service_applications_client_id ON service_applications(client_id);
CREATE INDEX IF NOT EXISTS idx_service_applications_status ON service_applications(status);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
