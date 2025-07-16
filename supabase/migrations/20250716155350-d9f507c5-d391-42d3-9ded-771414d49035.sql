-- Fix infinite recursion in users RLS policies
-- Drop existing problematic policies
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users (except owner)" ON public.users;

-- Create security definer function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT AS $$
BEGIN
  -- For new users registering, allow the operation
  IF auth.uid() IS NULL THEN
    RETURN 'pelanggan';
  END IF;
  
  -- Get the role from auth.jwt()
  RETURN COALESCE(auth.jwt() ->> 'user_role', 'pelanggan');
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- Create new RLS policies using the security definer function
CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    public.get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    public.get_current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    public.get_current_user_role() IN ('owner', 'admin') OR
    role = 'pelanggan'
  );

CREATE POLICY "Admins can delete users (except owner)" ON public.users
  FOR DELETE USING (
    role != 'owner' AND 
    public.get_current_user_role() IN ('owner', 'admin')
  );

-- Insert sample users for testing
INSERT INTO public.users (email, password, name, role) VALUES
  ('owner@studionoir.com', '$2b$10$x8K8Q2GY9KQaJNwQ7NwQ7e', 'Studio Owner', 'owner'),
  ('admin@studionoir.com', '$2b$10$x8K8Q2GY9KQaJNwQ7NwQ7e', 'Studio Admin', 'admin'),
  ('keuangan@studionoir.com', '$2b$10$x8K8Q2GY9KQaJNwQ7NwQ7e', 'Staff Keuangan', 'keuangan')
ON CONFLICT (email) DO NOTHING;