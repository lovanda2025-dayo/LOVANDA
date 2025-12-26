-- Add plan date columns to profiles table

ALTER TABLE profiles 
ADD COLUMN IF NOT EXISTS plan_start_date DATE,
ADD COLUMN IF NOT EXISTS plan_end_date DATE;

-- Add comment for documentation
COMMENT ON COLUMN profiles.plan_start_date IS 'Start date for premium/vip plans';
COMMENT ON COLUMN profiles.plan_end_date IS 'End date for premium/vip plans';
