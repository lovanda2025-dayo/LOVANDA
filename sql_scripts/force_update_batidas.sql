-- FORCE UPDATE: Reset daily_batidas for ALL users based on their plan
-- This will overwrite any existing values to match the correct plan limits

UPDATE profiles
SET daily_batidas = CASE 
    WHEN plan_type ILIKE 'premium' THEN 30
    WHEN plan_type ILIKE 'vip' THEN 20
    ELSE 10  -- default for Sanzala or NULL
END;

-- Also verify extra_batidas are clean (no nulls)
UPDATE profiles
SET extra_batidas = 0
WHERE extra_batidas IS NULL;

-- Check the results specifically for your user (optional, just to verify)
SELECT first_name, plan_type, daily_batidas, extra_batidas 
FROM profiles 
ORDER BY updated_at DESC 
LIMIT 10;
