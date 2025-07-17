
-- Disable Row Level Security for all CRUD tables
ALTER TABLE public.payment_providers DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_packages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_additional_services DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs DISABLE ROW LEVEL SECURITY;

-- Drop all existing policies for payment_providers
DROP POLICY IF EXISTS "Admins can manage payment providers" ON public.payment_providers;

-- Drop all existing policies for users
DROP POLICY IF EXISTS "Users can view own profile and admins can view all" ON public.users;
DROP POLICY IF EXISTS "Users can update own profile and admins can update any" ON public.users;
DROP POLICY IF EXISTS "Anyone can insert new user profile" ON public.users;
DROP POLICY IF EXISTS "Admins can delete users except owner" ON public.users;

-- Drop all existing policies for studio_packages
DROP POLICY IF EXISTS "Everyone can view studio packages" ON public.studio_packages;
DROP POLICY IF EXISTS "Admins can manage studio packages" ON public.studio_packages;

-- Drop all existing policies for additional_services
DROP POLICY IF EXISTS "Everyone can view additional services" ON public.additional_services;
DROP POLICY IF EXISTS "Admins can manage additional services" ON public.additional_services;

-- Drop all existing policies for bookings
DROP POLICY IF EXISTS "Users can view their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Users can create their own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Admins can update bookings" ON public.bookings;

-- Drop all existing policies for booking_additional_services
DROP POLICY IF EXISTS "Users can manage their booking services" ON public.booking_additional_services;

-- Drop all existing policies for booking_sessions
DROP POLICY IF EXISTS "Users can manage their booking sessions" ON public.booking_sessions;

-- Drop all existing policies for transactions
DROP POLICY IF EXISTS "Users can view their transactions" ON public.transactions;
DROP POLICY IF EXISTS "Admins can manage transactions" ON public.transactions;

-- Drop all existing policies for transaction_logs
DROP POLICY IF EXISTS "Admins can view transaction logs" ON public.transaction_logs;
DROP POLICY IF EXISTS "Admins can create transaction logs" ON public.transaction_logs;
