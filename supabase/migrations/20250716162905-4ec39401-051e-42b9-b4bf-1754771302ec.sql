
-- Create JWT and crypto extensions
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pgjwt;

-- Create user role enum if not exists
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('owner', 'admin', 'keuangan', 'pelanggan');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- Add password column to users table if not exists
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS password TEXT;

-- Create JWT secret function (you should set this to your own secret)
CREATE OR REPLACE FUNCTION get_jwt_secret()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 'your-super-secret-jwt-key-change-this-in-production';
$$;

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

-- Function to generate JWT token
CREATE OR REPLACE FUNCTION generate_jwt_token(user_id UUID, user_email TEXT, user_role user_role)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT sign(
    json_build_object(
      'id', user_id,
      'email', user_email,
      'role', user_role,
      'exp', extract(epoch from now() + interval '24 hours')::integer
    ),
    get_jwt_secret()
  );
$$;

-- Function to verify JWT token
CREATE OR REPLACE FUNCTION verify_jwt_token(token TEXT)
RETURNS JSON
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT verify(token, get_jwt_secret());
$$;

-- Register function
CREATE OR REPLACE FUNCTION register_user(
  user_name TEXT,
  user_email TEXT,
  user_password TEXT,
  user_role user_role DEFAULT 'pelanggan'::user_role
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  new_user_id UUID;
  hashed_password TEXT;
  jwt_token TEXT;
  existing_user_count INTEGER;
BEGIN
  -- Check if email already exists
  SELECT COUNT(*) INTO existing_user_count
  FROM public.users
  WHERE email = user_email;
  
  IF existing_user_count > 0 THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email sudah terdaftar'
    );
  END IF;
  
  -- Hash password
  hashed_password := hash_password(user_password);
  
  -- Insert new user
  INSERT INTO public.users (name, email, password, role)
  VALUES (user_name, user_email, hashed_password, user_role)
  RETURNING id INTO new_user_id;
  
  -- Generate JWT token
  jwt_token := generate_jwt_token(new_user_id, user_email, user_role);
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', new_user_id,
      'name', user_name,
      'email', user_email,
      'role', user_role
    ),
    'token', jwt_token
  );
END;
$$;

-- Login function
CREATE OR REPLACE FUNCTION login_user(user_email TEXT, user_password TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
  jwt_token TEXT;
BEGIN
  -- Get user with matching email
  SELECT id, name, email, password, role
  INTO user_record
  FROM public.users
  WHERE email = user_email;
  
  -- Check if user exists and password is correct
  IF user_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email atau password salah'
    );
  END IF;
  
  IF NOT verify_password(user_password, user_record.password) THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Email atau password salah'
    );
  END IF;
  
  -- Generate JWT token
  jwt_token := generate_jwt_token(user_record.id, user_record.email, user_record.role);
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'name', user_record.name,
      'email', user_record.email,
      'role', user_record.role
    ),
    'token', jwt_token
  );
END;
$$;

-- Function to verify and get user from JWT token
CREATE OR REPLACE FUNCTION verify_user_token(token TEXT)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  payload JSON;
  user_record RECORD;
  token_exp INTEGER;
BEGIN
  -- Verify JWT token
  payload := verify_jwt_token(token);
  
  IF payload IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token tidak valid'
    );
  END IF;
  
  -- Check token expiration
  token_exp := (payload->>'exp')::integer;
  IF token_exp < extract(epoch from now())::integer THEN
    RETURN json_build_object(
      'success', false,
      'error', 'Token sudah expired'
    );
  END IF;
  
  -- Get user from database
  SELECT id, name, email, role
  INTO user_record
  FROM public.users
  WHERE id = (payload->>'id')::uuid;
  
  IF user_record.id IS NULL THEN
    RETURN json_build_object(
      'success', false,
      'error', 'User tidak ditemukan'
    );
  END IF;
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', user_record.id,
      'name', user_record.name,
      'email', user_record.email,
      'role', user_record.role
    )
  );
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION register_user(TEXT, TEXT, TEXT, user_role) TO anon;
GRANT EXECUTE ON FUNCTION login_user(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION verify_user_token(TEXT) TO anon;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION hash_password(TEXT) TO anon;

-- Create sample users with hashed passwords
INSERT INTO public.users (email, name, role, password) VALUES
  ('owner@studionoir.com', 'Owner Studio Noir', 'owner', hash_password('password123')),
  ('admin@studionoir.com', 'Admin Studio Noir', 'admin', hash_password('password123')),
  ('keuangan@studionoir.com', 'Staff Keuangan', 'keuangan', hash_password('password123')),
  ('pelanggan@studionoir.com', 'Pelanggan Demo', 'pelanggan', hash_password('password123'))
ON CONFLICT (email) DO UPDATE SET
  password = EXCLUDED.password,
  name = EXCLUDED.name,
  role = EXCLUDED.role;
