
-- Fix all infinite recursion issues in RLS policies

-- First, ensure our get_current_user_role function is properly defined
DROP FUNCTION IF EXISTS public.get_current_user_role();

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
DECLARE
  user_role TEXT;
BEGIN
  -- For unauthenticated users, return default role
  IF auth.uid() IS NULL THEN
    RETURN 'pelanggan';
  END IF;
  
  -- Try to get role from JWT claims first (if available)
  BEGIN
    IF auth.jwt() IS NOT NULL AND auth.jwt() ->> 'user_role' IS NOT NULL THEN
      RETURN auth.jwt() ->> 'user_role';
    END IF;
  EXCEPTION
    WHEN OTHERS THEN
      -- Continue to database lookup if JWT parsing fails
      NULL;
  END;
  
  -- Fallback: directly query users table with security definer privileges
  -- This bypasses RLS and prevents recursion
  BEGIN
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_current_user_role() TO anon;

-- Drop all existing problematic policies
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile and admins can update any" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert new user profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users except owner" ON public.users;

-- Recreate users table policies without recursion
CREATE POLICY "Users can view own profile and admins can view all" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Users can update own profile and admins can update any" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    public.get_current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Anyone can insert new user profile" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete users except owner" ON public.users
  FOR DELETE USING (
    role != 'owner' AND 
    public.get_current_user_role() IN ('owner', 'admin')
  );

-- Fix bookings policies
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;

CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

-- Fix booking_additional_services policies
DROP POLICY IF EXISTS "Users can manage their booking services" ON public.booking_additional_services;

CREATE POLICY "Users can manage their booking services" ON public.booking_additional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid()
    ) OR 
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

-- Fix booking_sessions policies
DROP POLICY IF EXISTS "Users can manage their booking sessions" ON public.booking_sessions;

CREATE POLICY "Users can manage their booking sessions" ON public.booking_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid()
    ) OR 
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

-- Fix transactions policies
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;

CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND user_id = auth.uid()
    ) OR 
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

-- Fix other admin-only policies to use the function
DROP POLICY IF EXISTS "Admins can manage payment providers" ON public.payment_providers;
DROP POLICY IF EXISTS "Admins can manage studio packages" ON public.studio_packages;
DROP POLICY IF EXISTS "Admins can manage additional services" ON public.additional_services;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can view transaction logs" ON public.transaction_logs;
DROP POLICY IF EXISTS "Admins can create transaction logs" ON public.transaction_logs;

CREATE POLICY "Admins can manage payment providers" ON public.payment_providers
  FOR ALL USING (
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Admins can manage studio packages" ON public.studio_packages
  FOR ALL USING (
    public.get_current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Admins can manage additional services" ON public.additional_services
  FOR ALL USING (
    public.get_current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Admins can view transaction logs" ON public.transaction_logs
  FOR SELECT USING (
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Admins can create transaction logs" ON public.transaction_logs
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );
