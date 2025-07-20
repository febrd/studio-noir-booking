
-- Add package_quantity column to bookings table for walk-in sessions
ALTER TABLE public.bookings 
ADD COLUMN package_quantity integer DEFAULT NULL;

-- Add comment for clarity
COMMENT ON COLUMN public.bookings.package_quantity IS 'Quantity of packages for self photo walk-in sessions';
