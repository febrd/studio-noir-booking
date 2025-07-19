
-- Add is_active column to users table
ALTER TABLE public.users ADD COLUMN is_active BOOLEAN NOT NULL DEFAULT true;

-- Update existing users to be active
UPDATE public.users SET is_active = true WHERE is_active IS NULL;
