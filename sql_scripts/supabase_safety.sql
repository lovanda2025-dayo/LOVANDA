-- 1. Create blocks table
CREATE TABLE IF NOT EXISTS blocks (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    blocker_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    blocked_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
    UNIQUE(blocker_id, blocked_id)
);

-- 2. Create reports table
CREATE TABLE IF NOT EXISTS reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    reporter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reported_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reason TEXT NOT NULL,
    details TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- 3. Enable RLS
ALTER TABLE blocks ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 4. Policies for blocks
CREATE POLICY "Users can view their own blocks." ON blocks
    FOR SELECT USING (auth.uid() = blocker_id);

CREATE POLICY "Users can create their own blocks." ON blocks
    FOR INSERT WITH CHECK (auth.uid() = blocker_id);

CREATE POLICY "Users can delete their own blocks." ON blocks
    FOR DELETE USING (auth.uid() = blocker_id);

-- 5. Policies for reports
CREATE POLICY "Users can create their own reports." ON reports
    FOR INSERT WITH CHECK (auth.uid() = reporter_id);

CREATE POLICY "Users can view their own sent reports." ON reports
    FOR SELECT USING (auth.uid() = reporter_id);

-- 6. Add "is_blocked" logic to existing queries (optional but good practice)
-- Normally, we would filter matches and messages based on the blocks table.
-- For now, we will handle the "unmatch" logic by deleting the match when blocking.
