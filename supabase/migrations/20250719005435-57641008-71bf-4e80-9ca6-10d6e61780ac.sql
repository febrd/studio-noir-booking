
-- Create customer_profiles table
CREATE TABLE public.customer_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  gender TEXT CHECK (gender IN ('male', 'female')),
  notes TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create trigger for updated_at
CREATE TRIGGER update_customer_profiles_updated_at
  BEFORE UPDATE ON public.customer_profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add RLS policies if needed (adjust based on your security requirements)
ALTER TABLE public.customer_profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to read all customer profiles
CREATE POLICY "Allow authenticated users to read customer profiles"
  ON public.customer_profiles
  FOR SELECT
  TO authenticated
  USING (true);

-- Allow authenticated users to insert customer profiles
CREATE POLICY "Allow authenticated users to insert customer profiles"
  ON public.customer_profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Allow authenticated users to update customer profiles
CREATE POLICY "Allow authenticated users to update customer profiles"
  ON public.customer_profiles
  FOR UPDATE
  TO authenticated
  USING (true);

-- Allow authenticated users to delete customer profiles
CREATE POLICY "Allow authenticated users to delete customer profiles"
  ON public.customer_profiles
  FOR DELETE
  TO authenticated
  USING (true);
