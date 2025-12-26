-- COMPREHENSIVE FIX FOR RLS INFINITE LOOP
-- Run this in Supabase SQL Editor to fix all RLS issues

-- ============================================
-- 1. DISABLE RLS TEMPORARILY ON ALL TABLES
-- ============================================
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE likes DISABLE ROW LEVEL SECURITY;
ALTER TABLE dislikes DISABLE ROW LEVEL SECURITY;
ALTER TABLE matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE archived_profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE pre_match_messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments DISABLE ROW LEVEL SECURITY;

-- ============================================
-- 2. DROP ALL EXISTING POLICIES
-- ============================================

-- Profiles policies
DROP POLICY IF EXISTS "Profiles are viewable by everyone" ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON profiles;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Enable read access for all users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable update for users based on user_id" ON profiles;
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON profiles;
DROP POLICY IF EXISTS "Enable insert for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON profiles;
DROP POLICY IF EXISTS "Enable delete for users based on user_id" ON profiles;

-- Likes policies
DROP POLICY IF EXISTS "Users can view their own likes" ON likes;
DROP POLICY IF EXISTS "Users can insert likes" ON likes;
DROP POLICY IF EXISTS "Users can delete their own likes" ON likes;

-- Dislikes policies  
DROP POLICY IF EXISTS "Users can view their own dislikes" ON dislikes;
DROP POLICY IF EXISTS "Users can insert dislikes" ON dislikes;

-- Matches policies
DROP POLICY IF EXISTS "Users can view their own matches" ON matches;
DROP POLICY IF EXISTS "Users can insert matches" ON matches;

-- Archived profiles policies
DROP POLICY IF EXISTS "Users can view their own archived profiles" ON archived_profiles;
DROP POLICY IF EXISTS "Users can insert archived profiles" ON archived_profiles;

-- Pre-match messages policies
DROP POLICY IF EXISTS "Users can view their own pre-match messages" ON pre_match_messages;
DROP POLICY IF EXISTS "Users can insert pre-match messages" ON pre_match_messages;

-- Anonymous comments policies
DROP POLICY IF EXISTS "Users can view comments sent to them" ON anonymous_comments;
DROP POLICY IF EXISTS "Users can insert anonymous comments" ON anonymous_comments;

-- ============================================
-- 3. CREATE NEW SIMPLE, NON-RECURSIVE POLICIES
-- ============================================

-- PROFILES: Simple policies without joins
CREATE POLICY "profiles_select_authenticated"
ON profiles FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "profiles_insert_own"
ON profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own"
ON profiles FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (auth.uid() = id);

-- LIKES: Simple policies
CREATE POLICY "likes_select_own"
ON likes FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "likes_insert_own"
ON likes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

CREATE POLICY "likes_delete_own"
ON likes FOR DELETE
TO authenticated
USING (auth.uid() = from_user_id);

-- DISLIKES: Simple policies
CREATE POLICY "dislikes_select_own"
ON dislikes FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id);

CREATE POLICY "dislikes_insert_own"
ON dislikes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- MATCHES: Simple policies
CREATE POLICY "matches_select_own"
ON matches FOR SELECT
TO authenticated
USING (auth.uid() = user_a OR auth.uid() = user_b);

CREATE POLICY "matches_insert_authenticated"
ON matches FOR INSERT
TO authenticated
WITH CHECK (true);

-- ARCHIVED PROFILES: Simple policies
CREATE POLICY "archived_select_own"
ON archived_profiles FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "archived_insert_own"
ON archived_profiles FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- PRE-MATCH MESSAGES: Simple policies
CREATE POLICY "prematch_select_own"
ON pre_match_messages FOR SELECT
TO authenticated
USING (auth.uid() = from_user_id OR auth.uid() = to_user_id);

CREATE POLICY "prematch_insert_own"
ON pre_match_messages FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- ANONYMOUS COMMENTS: Simple policies
CREATE POLICY "anon_comments_select_received"
ON anonymous_comments FOR SELECT
TO authenticated
USING (auth.uid() = to_user_id);

CREATE POLICY "anon_comments_insert_authenticated"
ON anonymous_comments FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = from_user_id);

-- ============================================
-- 4. RE-ENABLE RLS ON ALL TABLES
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE dislikes ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE archived_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE pre_match_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE anonymous_comments ENABLE ROW LEVEL SECURITY;

-- Done! No more infinite loops.
