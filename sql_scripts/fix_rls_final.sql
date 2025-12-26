-- CLEAN SLATE: Remove ALL old policies and create only simple, non-recursive ones
-- Run this COMPLETE script in Supabase SQL Editor

-- ============================================
-- 1. DISABLE RLS TEMPORARILY
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE dislikes DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE archived_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE pre_match_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL POLICIES (OLD AND NEW)
-- ============================================

-- Profiles - drop ALL policies including the problematic admin ones
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Admins can update any profile" ON profiles;
DROP POLICY IF EXISTS "profiles_select_authenticated" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
DROP POLICY IF EXISTS "profiles_update_own" ON profiles;

-- Likes
DROP POLICY IF EXISTS "Users can view their own likes." ON likes;
DROP POLICY IF EXISTS "Users can create their own likes." ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes." ON likes;
DROP POLICY IF EXISTS "likes_select_own" ON likes;
DROP POLICY IF EXISTS "likes_insert_own" ON likes;
DROP POLICY IF EXISTS "likes_delete_own" ON likes;

-- Dislikes
DROP POLICY IF EXISTS "Users can view their own dislikes." ON dislikes;
DROP POLICY IF EXISTS "Users can create their own dislikes." ON dislikes;
DROP POLICY IF EXISTS "Users can delete their own dislikes." ON dislikes;
DROP POLICY IF EXISTS "dislikes_select_own" ON dislikes;
DROP POLICY IF EXISTS "dislikes_insert_own" ON dislikes;

-- Matches
DROP POLICY IF EXISTS "Users can view their own matches." ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;
DROP POLICY IF EXISTS "matches_select_own" ON matches;
DROP POLICY IF EXISTS "matches_insert_authenticated" ON matches;

-- Archived profiles
DROP POLICY IF EXISTS "Users can view their own archives." ON archived_profiles;
DROP POLICY IF EXISTS "Users can manage their archives." ON archived_profiles;
DROP POLICY IF EXISTS "archived_select_own" ON archived_profiles;
DROP POLICY IF EXISTS "archived_insert_own" ON archived_profiles;

-- Pre-match messages
DROP POLICY IF EXISTS "Users can view messages they sent or received." ON pre_match_messages;
DROP POLICY IF EXISTS "Users can send 1 pre-match message." ON pre_match_messages;
DROP POLICY IF EXISTS "prematch_select_own" ON pre_match_messages;
DROP POLICY IF EXISTS "prematch_insert_own" ON pre_match_messages;

-- Anonymous comments
DROP POLICY IF EXISTS "Users can see comments on their own profile." ON anonymous_comments;
DROP POLICY IF EXISTS "Anyone authenticated can comment anonymously." ON anonymous_comments;
DROP POLICY IF EXISTS "anon_comments_select_received" ON anonymous_comments;
DROP POLICY IF EXISTS "anon_comments_insert_authenticated" ON anonymous_comments;

-- ============================================
-- 3. CREATE ONLY SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- PROFILES: Everyone can read all profiles, users can only modify their own
CREATE POLICY "profiles_read_all"
ON profiles FOR SELECT
USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
USING (auth.uid() = id);

-- LIKES: Users can view and manage their own likes
CREATE POLICY "likes_read_own"
ON likes FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "likes_create_own"
ON likes FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "likes_delete_own"
ON likes FOR DELETE
USING (auth.uid() = from_user_id);

-- DISLIKES: Users can view and create their own dislikes
CREATE POLICY "dislikes_read_own"
ON dislikes FOR SELECT
USING (auth.uid() = from_user_id);

CREATE POLICY "dislikes_create_own"
ON dislikes FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- MATCHES: Users can view their own matches, anyone can create (via RPC)
CREATE POLICY "matches_read_own"
ON matches FOR SELECT
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "matches_create_any"
ON matches FOR INSERT
WITH CHECK (true);

-- ARCHIVED PROFILES: Users can view and manage their own archives
CREATE POLICY "archived_read_own"
ON archived_profiles FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "archived_create_own"
ON archived_profiles FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- PRE-MATCH MESSAGES: Users can view and send their own messages
CREATE POLICY "prematch_read_own"
ON pre_match_messages FOR SELECT
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "prematch_create_own"
ON pre_match_messages FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- ANONYMOUS COMMENTS: Users can view comments on their profile and create comments
CREATE POLICY "comments_read_received"
ON anonymous_comments FOR SELECT
USING (auth.uid() = to_user_id);

CREATE POLICY "comments_create_any"
ON anonymous_comments FOR INSERT
WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- 4. RE-ENABLE RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_match_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments ENABLE ROW LEVEL SECURITY;

-- Done! Clean, simple, non-recursive policies.
