-- Create likes table
create table likes (
  id uuid default gen_random_uuid() primary key,
  from_user_id uuid references auth.users not null,
  to_user_id uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  unique(from_user_id, to_user_id)
);

-- Create matches table
create table matches (
  id uuid default gen_random_uuid() primary key,
  user_a uuid references auth.users not null,
  user_b uuid references auth.users not null,
  created_at timestamp with time zone default now(),
  unique(user_a, user_b)
);

-- Create messages table
create table messages (
  id uuid default gen_random_uuid() primary key,
  match_id uuid references matches(id) on delete cascade not null,
  sender_id uuid references auth.users not null,
  content text not null,
  is_read boolean default false,
  created_at timestamp with time zone default now()
);

-- Enable RLS
alter table likes enable row level security;
alter table matches enable row level security;
alter table messages enable row level security;

-- Policies for likes
create policy "Users can view their own likes." on likes
  for select using (auth.uid() = from_user_id or auth.uid() = to_user_id);

create policy "Users can create their own likes." on likes
  for insert with check (auth.uid() = from_user_id);

create policy "Users can delete their own likes." on likes
  for delete using (auth.uid() = from_user_id);

-- Policies for matches
create policy "Users can view their own matches." on matches
  for select using (auth.uid() = user_a or auth.uid() = user_b);

-- Policies for messages
create policy "Users can view messages in their matches." on messages
  for select using (
    exists (
      select 1 from matches 
      where id = messages.match_id 
      and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

create policy "Users can send messages in their matches." on messages
  for insert with check (
    auth.uid() = sender_id and
    exists (
      select 1 from matches 
      where id = match_id 
      and (user_a = auth.uid() or user_b = auth.uid())
    )
  );

-- Function to handle auto-match on mutual like
create or replace function handle_mutual_like()
returns trigger as $$
begin
  if exists (
    select 1 from likes 
    where from_user_id = NEW.to_user_id 
    and to_user_id = NEW.from_user_id
  ) then
    insert into matches (user_a, user_b)
    values (
      least(NEW.from_user_id, NEW.to_user_id),
      greatest(NEW.from_user_id, NEW.to_user_id)
    )
    on conflict do nothing;
  end if;
  return NEW;
end;
$$ language plpgsql;

-- Trigger for auto-match
create trigger on_like_mutual
  after insert on likes
  for each row execute function handle_mutual_like();

-- Robust RPC to confirm match on reply
create or replace function confirm_match_on_reply(target_user_id uuid)
returns table(is_match boolean, match_id uuid) as $$
declare
  current_user_id uuid;
  existing_match_id uuid;
  new_match_id uuid;
begin
  current_user_id := auth.uid();
  
  -- 1. Ensure we like the target user
  insert into likes (from_user_id, to_user_id)
  values (current_user_id, target_user_id)
  on conflict do nothing;

  -- 2. Check if match already exists
  select id into existing_match_id
  from matches
  where (user_a = current_user_id and user_b = target_user_id)
     or (user_a = target_user_id and user_b = current_user_id);
     
  if existing_match_id is not null then
    return query select true, existing_match_id;
    return;
  end if;

  -- 3. Check if target user liked us OR sent a pre-match message
  -- This handles the "Old Message" case where they messaged but maybe didn't generate a like record
  if exists (
    select 1 from likes where from_user_id = target_user_id and to_user_id = current_user_id
  ) or exists (
    select 1 from pre_match_messages where from_user_id = target_user_id and to_user_id = current_user_id
  ) then
    -- Create the match manually bypassing RLS/Triggers if needed
    insert into matches (user_a, user_b)
    values (
      least(current_user_id, target_user_id),
      greatest(current_user_id, target_user_id)
    )
    on conflict (user_a, user_b) do update set created_at = now() -- dummy update to get ID
    returning id into new_match_id;
    
    return query select true, new_match_id;
  else
    return query select false, null::uuid;
  end if;
end;
$$ language plpgsql security definer;
