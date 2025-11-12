-- Drop old staff table if exists (from 0001 migration)
DROP TABLE IF EXISTS staff;

-- Add staff management table with new structure
CREATE TABLE staff (
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
  user_id INTEGER REFERENCES users(id),
  staff_id INTEGER REFERENCES staff(id),
  message TEXT NOT NULL,
  is_from_client BOOLEAN DEFAULT 1,
  is_read BOOLEAN DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Add index for ticket messages
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_created_at ON ticket_messages(created_at);
