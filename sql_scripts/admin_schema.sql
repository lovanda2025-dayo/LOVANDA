-- Admin Panel Schema

-- 1. Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    pin TEXT NOT NULL CHECK (length(pin) = 6 AND pin ~ '^\d{6}$'),
    role TEXT DEFAULT 'admin',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Insert test admin user
-- Password stored in plain text as requested
INSERT INTO admin_users (username, password, pin, role)
VALUES (
    'lovandaAdmin',
    'minhaSenhaSegura',
    '123456',
    'admin'
);

-- 3. Enable RLS
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- 4. Create policy for admins to view themselves
CREATE POLICY "Admins can view themselves"
ON admin_users
FOR SELECT
USING (role = 'admin');
