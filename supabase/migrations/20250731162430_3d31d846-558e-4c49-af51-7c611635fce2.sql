
-- Add payment_link column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN payment_link text;

-- Add comment to document the column purpose
COMMENT ON COLUMN public.bookings.payment_link IS 'Stores the Xendit checkout URL for online payments';
