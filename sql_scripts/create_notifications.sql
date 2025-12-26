-- Admin Notifications Table with Scheduling Support
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('all', 'gender', 'province')),
    target_value TEXT,
    scheduled_time TIMESTAMPTZ,
    admin_id UUID REFERENCES admin_users(id),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sent_at TIMESTAMPTZ
);

-- Index for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_notifications_scheduled 
ON admin_notifications(scheduled_time) 
WHERE sent_at IS NULL;

CREATE INDEX IF NOT EXISTS idx_admin_notifications_created 
ON admin_notifications(created_at DESC);

-- Enable RLS for security
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Only service role (admin server actions) can access
-- Regular authenticated users cannot access this table
CREATE POLICY "Admin notifications are service-role only"
ON admin_notifications
FOR ALL
TO authenticated
USING (false)
WITH CHECK (false);
