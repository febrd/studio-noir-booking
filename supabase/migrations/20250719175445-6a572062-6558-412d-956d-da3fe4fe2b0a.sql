
-- Add is_walking_session column to bookings table
ALTER TABLE public.bookings 
ADD COLUMN is_walking_session BOOLEAN NOT NULL DEFAULT FALSE;

-- Add index for better performance when filtering walking sessions
CREATE INDEX idx_bookings_is_walking_session ON public.bookings(is_walking_session);

-- Update existing walk-in sessions created today to mark them as walking sessions
-- This helps identify current walk-in sessions from regular bookings
UPDATE public.bookings 
SET is_walking_session = TRUE 
WHERE payment_method = 'offline' 
  AND type = 'self_photo' 
  AND created_at >= CURRENT_DATE;
