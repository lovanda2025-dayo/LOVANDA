-- EXPLICIT CORRECTION: Run statements separately to guarantee correctness

-- 1. Set PREMIUM to 30
UPDATE profiles 
SET daily_batidas = 30 
WHERE plan_type = 'premium';

-- 2. Set VIP to 20
UPDATE profiles 
SET daily_batidas = 20 
WHERE plan_type = 'vip';

-- 3. Set SANZALA/Others to 10
UPDATE profiles 
SET daily_batidas = 10 
WHERE plan_type = 'sanzala' OR plan_type IS NULL;

-- 4. Verify Final State
SELECT first_name, plan_type, daily_batidas FROM profiles;
