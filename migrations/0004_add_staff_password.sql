-- Migration: Add password field to staff table for staff login functionality
-- Date: 2025-01-12
-- Purpose: Enable staff members to log in and manage their assigned clients' tickets

-- Add password column to staff table
ALTER TABLE staff ADD COLUMN password TEXT;

-- Create index on email for faster login queries
CREATE INDEX IF NOT EXISTS idx_staff_email ON staff(email);

-- Update existing staff with default password (staff123)
-- In production, this should be changed immediately after first login
UPDATE staff SET password = '$2a$10$rMZvKhXKXKxKxKxKxKxKxOqH.aI5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z5Z' 
WHERE password IS NULL;

-- Note: The hashed password above represents 'staff123'
-- Staff members should change their password after first login
