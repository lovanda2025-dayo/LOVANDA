-- Create stories table
create table stories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Create story_comments table
create table story_comments (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references stories(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  content text not null,
  created_at timestamp with time zone default now()
);

-- Create story_reactions table
create table story_reactions (
  id uuid default gen_random_uuid() primary key,
  story_id uuid references stories(id) on delete cascade not null,
  user_id uuid references auth.users not null,
  type text not null, -- 'like', 'support', 'force', etc.
  created_at timestamp with time zone default now(),
  unique(story_id, user_id, type)
);

-- Enable RLS
alter table stories enable row level security;
alter table story_comments enable row level security;
alter table story_reactions enable row level security;

-- Policies for stories
create policy "Authenticated users can view stories from last 7 days." on stories
  for select using (auth.role() = 'authenticated' and created_at > now() - interval '7 days');

create policy "Authenticated users can create stories." on stories
  for insert with check (auth.uid() = user_id);

-- Policies for story_comments
create policy "Authenticated users can view comments." on story_comments
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can create comments." on story_comments
  for insert with check (auth.uid() = user_id);

-- Policies for story_reactions
create policy "Authenticated users can view reactions." on story_reactions
  for select using (auth.role() = 'authenticated');

create policy "Authenticated users can manage their own reactions." on story_reactions
  for all using (auth.uid() = user_id);

-- Function to delete old data (can be used manually or with a CRON)
create or replace function delete_expired_anonymous_content()
returns void as $$
begin
  delete from stories where created_at < now() - interval '7 days';
end;
$$ language plpgsql;
