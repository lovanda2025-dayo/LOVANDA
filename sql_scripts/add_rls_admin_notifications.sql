-- Quick fix: Add RLS to existing admin_notifications table
-- Run this in Supabase SQL Editor

-- Enable RLS
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Block all access to regular users (only service role/admin actions can access)
CREATE POLICY "admin_notifications_block_users"
ON admin_notifications
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
