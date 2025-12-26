-- Create table for storing User PINs (Private Auth)
CREATE TABLE IF NOT EXISTS public.user_private_auth (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    pin VARCHAR(6) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT user_private_auth_user_id_key UNIQUE (user_id)
);

-- Create table for logging PIN login attempts
CREATE TABLE IF NOT EXISTS public.pin_login_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    success BOOLEAN NOT NULL,
    ip_address VARCHAR,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_private_auth ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pin_login_logs ENABLE ROW LEVEL SECURITY;

-- -----------------------------------------------------------------------------
-- RLS POLICIES
-- -----------------------------------------------------------------------------
-- STRICT: No public access. Only Postgres service role (backend) can access.

-- user_private_auth policies
CREATE POLICY "No public read access to user_private_auth" ON public.user_private_auth
    FOR SELECT TO public USING (false);

CREATE POLICY "No public insert access to user_private_auth" ON public.user_private_auth
    FOR INSERT TO public WITH CHECK (false);

CREATE POLICY "No public update access to user_private_auth" ON public.user_private_auth
    FOR UPDATE TO public USING (false);

CREATE POLICY "No public delete access to user_private_auth" ON public.user_private_auth
    FOR DELETE TO public USING (false);

-- pin_login_logs policies
CREATE POLICY "No public read access to pin_login_logs" ON public.pin_login_logs
    FOR SELECT TO public USING (false);

CREATE POLICY "No public insert access to pin_login_logs" ON public.pin_login_logs
    FOR INSERT TO public WITH CHECK (false);
