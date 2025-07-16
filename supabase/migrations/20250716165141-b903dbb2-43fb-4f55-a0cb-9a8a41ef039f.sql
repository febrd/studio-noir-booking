
-- Create function to register a new user
CREATE OR REPLACE FUNCTION public.register_user(
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
  
  RETURN json_build_object(
    'success', true,
    'user', json_build_object(
      'id', new_user_id,
      'name', user_name,
      'email', user_email,
      'role', user_role
    )
  );
END;
$$;

-- Create function to login user
CREATE OR REPLACE FUNCTION public.login_user(
  user_email TEXT,
  user_password TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  user_record RECORD;
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

-- Grant execute permissions to anon users for registration and login
GRANT EXECUTE ON FUNCTION public.register_user(TEXT, TEXT, TEXT, user_role) TO anon;
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT) TO anon;
GRANT EXECUTE ON FUNCTION public.register_user(TEXT, TEXT, TEXT, user_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.login_user(TEXT, TEXT) TO authenticated;
