-- DIAGNOSTIC: Check Plan Types vs Batidas
-- Run this to see what's actually stored in the DB

SELECT 
    id, 
    first_name, 
    plan_type, 
    daily_batidas 
FROM profiles 
WHERE plan_type ILIKE 'vip' OR plan_type ILIKE 'premium';

-- Also check distinct plan types to see if there are any typos or unexpected values
SELECT DISTINCT plan_type FROM profiles;
