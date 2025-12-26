-- Create a table for public profiles
create table profiles (
  id uuid references auth.users not null primary key,
  updated_at timestamp with time zone,
  first_name text,
  last_name text,
  age integer,
  province text,
  gender text,
  relationship_goal text,
  gender_interest text,
  avatar_url text,
  photos text[], -- Array of photo URLs
  bio text, -- User bio/description
  occupation text, -- User occupation
  company_name text, -- Company name (if applicable)
  education text, -- Education level
  university_name text, -- University name (if applicable)
  height integer, -- Height in centimeters
  smoking text, -- Smoking habit
  drinking text, -- Drinking habit
  exercise text, -- Exercise frequency
  diet text, -- Dietary preference
  pets text, -- Pet preference
  children text, -- Children preference
  want_marry text, -- Want to marry
  want_children_future text, -- Want to have children in future
  want_form_family boolean, -- Want to form a family
  want_strengthen_family boolean, -- Want to strengthen family ties
  want_financial_stability boolean, -- Want financial stability
  want_buy_house boolean, -- Want to build/buy a house
  want_own_business boolean, -- Want to open own business
  want_professional_growth boolean, -- Want professional growth
  want_travel boolean, -- Want to travel
  want_enjoy_life boolean, -- Want to enjoy life
  sports text[], -- Sports interests
  hobbies text[], -- Hobbies interests
  music_dance text[], -- Music and dance interests
  lifestyle_culture text[], -- Lifestyle and culture interests
  languages text[], -- Languages spoken
  other_language text, -- Specification for other language
  religion text, -- Religion/Belief
  other_religion text, -- Specification for other religion
  political_view text, -- Political view
  other_political text -- Specification for other political view
);

-- Set up Row Level Security (RLS)
alter table profiles enable row level security;

create policy "Public profiles are viewable by everyone." on profiles
  for select using (true);

create policy "Users can insert their own profile." on profiles
  for insert with check (auth.uid() = id);

create policy "Users can update own profile." on profiles
  for update using (auth.uid() = id);

-- Set up Storage for Photos
insert into storage.buckets (id, name, public) 
values ('photos', 'photos', true);

create policy "Avatar images are publicly accessible." on storage.objects
  for select using (bucket_id = 'photos');

create policy "Anyone can upload an avatar." on storage.objects
  for insert with check (bucket_id = 'photos');

create policy "Anyone can update their own avatar." on storage.objects
  for update using (auth.uid() = owner);
