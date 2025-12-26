-- Add Plan Type and Counters to Profiles Table

-- 1. Add plan_type column with default 'sanzala'
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS plan_type TEXT DEFAULT 'sanzala' CHECK (plan_type IN ('sanzala', 'vip', 'premium'));

-- 2. Add Counter Columns
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS daily_batidas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_stories INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_comments INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS daily_swipes INTEGER DEFAULT 0;

-- 3. Add Last Reset Date (for daily logic)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS last_reset_date TIMESTAMPTZ DEFAULT NOW();

-- 4. Create Index for faster plan lookups (optional but good)
CREATE INDEX IF NOT EXISTS idx_profiles_plan_type ON public.profiles(plan_type);

-- 5. Grant permissions if needed
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;
