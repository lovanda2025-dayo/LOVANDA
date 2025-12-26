-- Helper function to get User ID by Email (Admin only)
-- Access user's email from auth.users

CREATE OR REPLACE FUNCTION public.get_user_id_by_email(user_email TEXT)
RETURNS TABLE (id UUID)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id
  FROM auth.users u
  WHERE u.email = user_email;
END;
$$;

-- Allow admin usage (service role)
REVOKE EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) FROM public;
GRANT EXECUTE ON FUNCTION public.get_user_id_by_email(TEXT) TO service_role;
