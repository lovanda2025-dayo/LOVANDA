-- Function to safely and completely delete a user account and all its data
-- This must be run in the Supabase SQL Editor
create or replace function delete_user_account()
returns void
language plpgsql
security definer -- Elevates privileges to delete from all schemas
set search_path = public, auth
as $$
declare
    target_user_id uuid;
begin
    -- Get the ID of the calling user
    target_user_id := auth.uid();

    if target_user_id is null then
        raise exception 'Não autenticado. Não é possível eliminar conta.';
    end if;

    -- 1. Delete Story related data
    delete from story_reactions where user_id = target_user_id;
    delete from story_comments where user_id = target_user_id;
    delete from stories where user_id = target_user_id;

    -- 2. Delete Discover related data
    delete from anonymous_comments where from_user_id = target_user_id or to_user_id = target_user_id;
    delete from pre_match_messages where from_user_id = target_user_id or to_user_id = target_user_id;
    delete from archived_profiles where user_id = target_user_id or profile_id = target_user_id;
    delete from dislikes where from_user_id = target_user_id or to_user_id = target_user_id;

    -- 3. Delete Chat related data
    -- Messages are deleted via cascade when match is deleted
    delete from matches where user_a = target_user_id or user_b = target_user_id;
    delete from likes where from_user_id = target_user_id or to_user_id = target_user_id;

    -- 4. Delete the public profile
    delete from profiles where id = target_user_id;

    -- 5. Delete from auth.users (This is only possible with SECURITY DEFINER)
    delete from auth.users where id = target_user_id;
end;
$$;
