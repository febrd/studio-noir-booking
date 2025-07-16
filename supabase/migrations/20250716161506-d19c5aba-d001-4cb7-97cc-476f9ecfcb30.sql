
-- Add password column back to users table
ALTER TABLE public.users ADD COLUMN password TEXT;

-- Make password required for new users
ALTER TABLE public.users ALTER COLUMN password SET NOT NULL;

-- Update existing users to have a default hashed password
-- This is a temporary measure, users will need to reset their passwords
UPDATE public.users SET password = crypt('password123', gen_salt('bf')) WHERE password IS NULL;

-- Create function to hash passwords
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN crypt(password, gen_salt('bf'));
END;
$$ LANGUAGE plpgsql;

-- Create function to verify passwords
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN hash = crypt(password, hash);
END;
$$ LANGUAGE plpgsql;

-- Fix the RLS infinite recursion by creating a security definer function
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS TEXT
LANGUAGE plpgsql
STABLE SECURITY DEFINER
AS $$
BEGIN
  -- For new users registering, allow the operation
  IF auth.uid() IS NULL THEN
    RETURN 'pelanggan';
  END IF;
  
  -- Get the role from auth.jwt()
  RETURN COALESCE(auth.jwt() ->> 'user_role', 'pelanggan');
END;
$$;

-- Update RLS policies to use the security definer function
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile and admins can update any" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert new user profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users except owner" ON public.users;

-- Create new RLS policies using the security definer function
CREATE POLICY "Users can view own profile and admins can view all" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    get_current_user_role() IN ('owner', 'admin', 'keuangan')
  );

CREATE POLICY "Users can update own profile and admins can update any" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    get_current_user_role() IN ('owner', 'admin')
  );

CREATE POLICY "Anyone can insert new user profile" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete users except owner" ON public.users
  FOR DELETE USING (
    role != 'owner' AND 
    get_current_user_role() IN ('owner', 'admin')
  );

-- Insert sample users with hashed passwords
INSERT INTO public.users (id, email, name, role, password) VALUES
  (gen_random_uuid(), 'owner@studionoir.com', 'Owner Studio Noir', 'owner', hash_password('password123')),
  (gen_random_uuid(), 'admin@studionoir.com', 'Admin Studio Noir', 'admin', hash_password('password123')),
  (gen_random_uuid(), 'keuangan@studionoir.com', 'Staff Keuangan', 'keuangan', hash_password('password123')),
  (gen_random_uuid(), 'pelanggan@studionoir.com', 'Pelanggan Demo', 'pelanggan', hash_password('password123'))
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
