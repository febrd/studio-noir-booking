
-- Create pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Function to hash password using bcrypt
CREATE OR REPLACE FUNCTION public.hash_password(password TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT crypt(password, gen_salt('bf'));
$$;

-- Function to verify password
CREATE OR REPLACE FUNCTION public.verify_password(password TEXT, hash TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT hash = crypt(password, hash);
$$;

-- Grant execute permissions for password functions
GRANT EXECUTE ON FUNCTION public.hash_password(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.verify_password(TEXT, TEXT) TO authenticated;

-- Update existing sample users with properly hashed passwords
UPDATE public.users SET password = hash_password('password123') 
WHERE email IN (
  'owner@studionoir.com',
  'admin@studionoir.com', 
  'keuangan@studionoir.com',
  'pelanggan@studionoir.com'
);

-- Insert sample users if they don't exist (with proper password hashing)
INSERT INTO public.users (email, name, role, password) VALUES
  ('owner@studionoir.com', 'Owner Studio Noir', 'owner', hash_password('password123')),
  ('admin@studionoir.com', 'Admin Studio Noir', 'admin', hash_password('password123')),
  ('keuangan@studionoir.com', 'Staff Keuangan', 'keuangan', hash_password('password123')),
  ('pelanggan@studionoir.com', 'Pelanggan Demo', 'pelanggan', hash_password('password123'))
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
