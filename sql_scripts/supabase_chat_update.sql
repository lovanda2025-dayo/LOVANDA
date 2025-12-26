--1. Update messages table schema
ALTER TABLE messages RENAME COLUMN content TO message_text;
ALTER TABLE messages ALTER COLUMN message_text DROP NOT NULL;
ALTER TABLE messages ADD COLUMN message_image_url TEXT;
ALTER TABLE messages ADD COLUMN receiver_id UUID REFERENCES auth.users;

-- 2. Create storage bucket for chat photos if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('chat-photos', 'chat-photos', true)
ON CONFLICT (id) DO NOTHING;

-- 3. Set up Storage Policies for chat-photos
-- Drop existing policies if they exist to avoid errors during re-run
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Users can upload" ON storage.objects;

-- Allow anyone to view photos (Public)
CREATE POLICY "Public Access" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'chat-photos');

-- Allow authenticated users to upload photos
CREATE POLICY "Authenticated Users can upload" 
ON storage.objects FOR INSERT 
WITH CHECK (
  bucket_id = 'chat-photos' AND 
  auth.role() = 'authenticated'
);

-- 4. Enable Realtime for messages table
-- This is crucial for the real-time functionality
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
