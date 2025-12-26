-- Create dislikes table
create table dislikes (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  unique(from_user_id, to_user_id)
);

-- Create archived_profiles table
create table archived_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  profile_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  unique(user_id, profile_id)
);

-- Create pre_match_messages table
create table pre_match_messages (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now(),
  unique(from_user_id, to_user_id) -- Only 1 pre-match message per recipient
);

-- Create anonymous_comments table
create table anonymous_comments (
  id uuid default gen_random_uuid() primary key,
  to_user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now()
  -- No user_id reference here in the public view to ensure anonymity, 
  -- but we could store it for moderation and use RLS to hide it.
);

-- Add hidden sender_id for moderation (protected by RLS)
alter table anonymous_comments add column from_user_id uuid references auth.users;

-- Enable RLS
alter table dislikes enable row level security;
alter table archived_profiles enable row level security;
alter table pre_match_messages enable row level security;
alter table anonymous_comments enable row level security;

-- Policies for dislikes
create policy "Users can view their own dislikes." on dislikes
  for select using (auth.uid() = from_user_id);
create policy "Users can create their own dislikes." on dislikes
  for insert with check (auth.uid() = from_user_id);

create policy "Users can delete their own dislikes." on dislikes
  for delete using (auth.uid() = from_user_id);

-- Policies for archived_profiles
create policy "Users can view their own archives." on archived_profiles
  for select using (auth.uid() = user_id);
create policy "Users can manage their archives." on archived_profiles
  for all using (auth.uid() = user_id);

-- Policies for pre_match_messages
create policy "Users can view messages they sent or received." on pre_match_messages
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);
create policy "Users can send 1 pre-match message." on pre_match_messages
  for insert with check (auth.uid() = from_user_id);

-- Policies for anonymous_comments
create policy "Users can see comments on their own profile." on anonymous_comments
  for select using (auth.uid() = to_user_id);
create policy "Anyone authenticated can comment anonymously." on anonymous_comments
  for insert with check (auth.role() = 'authenticated');
