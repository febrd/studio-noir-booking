
-- Remove password column from users table since Supabase Auth handles this
ALTER TABLE public.users DROP COLUMN IF EXISTS password;

-- Update sample users without password column
DELETE FROM public.users WHERE email IN ('owner@studionoir.com', 'admin@studionoir.com', 'keuangan@studionoir.com');

-- Create auth users first (these will be created through the auth system)
-- We'll handle this programmatically after the migration

-- Update RLS policies to be more straightforward
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
DROP POLICY IF EXISTS "Admins can update users" ON public.users;
DROP POLICY IF EXISTS "Admins can insert users" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users (except owner)" ON public.users;
DROP POLICY IF EXISTS "Users can view their own data" ON public.users;

-- Create simpler RLS policies
CREATE POLICY "Users can view own profile and admins can view all" ON public.users
  FOR SELECT USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('owner', 'admin', 'keuangan')
    )
  );

CREATE POLICY "Users can update own profile and admins can update any" ON public.users
  FOR UPDATE USING (
    auth.uid() = id OR 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Anyone can insert new user profile" ON public.users
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can delete users except owner" ON public.users
  FOR DELETE USING (
    role != 'owner' AND 
    EXISTS (
      SELECT 1 FROM public.users u 
      WHERE u.id = auth.uid() 
      AND u.role IN ('owner', 'admin')
    )
  );
