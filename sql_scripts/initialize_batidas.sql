-- Initialize daily_batidas for existing users based on their plan
-- Run this in Supabase SQL Editor to set batidas for existing users

UPDATE profiles
SET daily_batidas = CASE 
    WHEN plan_type ILIKE 'premium' THEN 30
    WHEN plan_type ILIKE 'vip' THEN 20
    ELSE 10  -- sanzala or NULL
END
WHERE daily_batidas IS NULL OR daily_batidas = 0;

-- Also ensure extra_batidas is at least 0
UPDATE profiles
SET extra_batidas = 0
WHERE extra_batidas IS NULL;

-- Verify the update
SELECT id, first_name, plan_type, daily_batidas, extra_batidas
FROM profiles
LIMIT 10;
