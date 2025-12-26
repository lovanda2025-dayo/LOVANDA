-- Check if RLS policies were applied correctly
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('profiles', 'likes', 'dislikes', 'matches', 'archived_profiles', 'pre_match_messages', 'anonymous_comments')
ORDER BY tablename, policyname;
