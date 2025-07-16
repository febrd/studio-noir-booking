
-- Fix infinite recursion in get_current_user_role function
-- The function was causing issues by trying to query the users table
-- while RLS policies were also referencing this function

-- Drop the existing function
DROP FUNCTION IF EXISTS public.get_current_user_role();

-- Create a simpler version that uses auth.jwt() directly
-- This avoids the circular dependency with RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- For unauthenticated users, return default role
  IF auth.uid() IS NULL THEN
    RETURN 'pelanggan';
  END IF;
  
  -- Try to get role from JWT claims first
  IF auth.jwt() IS NOT NULL AND auth.jwt() ->> 'user_role' IS NOT NULL THEN
    RETURN auth.jwt() ->> 'user_role';
  END IF;
  
  -- Fallback: directly query users table without RLS
  -- Use a direct query that bypasses RLS policies
  DECLARE
    user_role TEXT;
  BEGIN
    -- This query runs with security definer privileges
    -- so it bypasses RLS and won't cause recursion
    SELECT role INTO user_role 
    FROM public.users 
    WHERE id = auth.uid() 
    LIMIT 1;
    
    RETURN COALESCE(user_role, 'pelanggan');
  EXCEPTION
    WHEN OTHERS THEN
      -- If any error occurs, return default role
      RETURN 'pelanggan';
  END;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;
