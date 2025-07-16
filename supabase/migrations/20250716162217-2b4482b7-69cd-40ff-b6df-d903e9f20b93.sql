
-- Create password hashing functions using pgcrypto extension
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash password using bcrypt
CREATE OR REPLACE FUNCTION hash_password(password TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password, gen_salt('bf'));
$$;

-- Function to verify password
CREATE OR REPLACE FUNCTION verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT hash = crypt(password, hash);
$$;

-- Function to authenticate user
CREATE OR REPLACE FUNCTION authenticate_user(user_email TEXT, user_password TEXT)
RETURNS TABLE(
  id UUID,
  email TEXT,
  name TEXT,
  role user_role,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT u.id, u.email, u.name, u.role, u.created_at, u.updated_at
  FROM public.users u
  WHERE u.email = user_email
    AND verify_password(user_password, u.password);
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION authenticate_user(TEXT, TEXT) TO anon;

-- Grant execute permission for password functions
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION verify_password(TEXT, TEXT) TO anon;

-- Update sample users with properly hashed passwords
UPDATE public.users SET password = hash_password('password123') 
WHERE email IN (
  'owner@studionoir.com',
  'admin@studionoir.com', 
  'keuangan@studionoir.com',
  'pelanggan@studionoir.com'
);

-- Insert sample users if they don't exist
INSERT INTO public.users (email, name, role, password) VALUES
  ('owner@studionoir.com', 'Owner Studio Noir', 'owner', hash_password('password123')),
  ('admin@studionoir.com', 'Admin Studio Noir', 'admin', hash_password('password123')),
  ('keuangan@studionoir.com', 'Staff Keuangan', 'keuangan', hash_password('password123')),
  ('pelanggan@studionoir.com', 'Pelanggan Demo', 'pelanggan', hash_password('password123'))
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
