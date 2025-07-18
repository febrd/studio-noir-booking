
-- Create view for bookings with user info to enable better search
CREATE OR REPLACE VIEW bookings_with_user_info AS
SELECT
  b.*,
  u.name AS customer_name,
  u.email AS customer_email,
  sp.title AS package_title,
  sp.price AS package_price,
  s.name AS studio_name,
  s.type AS studio_type,
  pc.name AS category_name
FROM bookings b
LEFT JOIN users u ON u.id = b.user_id
LEFT JOIN studio_packages sp ON sp.id = b.studio_package_id
LEFT JOIN studios s ON s.id = b.studio_id
LEFT JOIN package_categories pc ON pc.id = b.package_category_id;

-- Enable RLS on the view
ALTER VIEW bookings_with_user_info SET (security_barrier = true);

-- Create policy for the view
CREATE POLICY "Admin and owner can view bookings with user info" 
ON bookings_with_user_info 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'owner'));

-- Create view for booking with installments summary
CREATE OR REPLACE VIEW booking_with_installments AS
SELECT
  b.id,
  b.user_id,
  b.studio_id,
  b.studio_package_id,
  b.package_category_id,
  b.start_time,
  b.end_time,
  b.additional_time_minutes,
  b.total_amount,
  b.status,
  b.payment_method,
  b.type,
  b.created_at,
  b.updated_at,
  COALESCE(SUM(i.amount), 0) AS total_paid,
  (b.total_amount - COALESCE(SUM(i.amount), 0)) AS remaining_amount,
  COUNT(i.id) AS installment_count,
  CASE 
    WHEN COALESCE(SUM(i.amount), 0) >= b.total_amount THEN 'paid'
    WHEN COALESCE(SUM(i.amount), 0) > 0 THEN 'installment'
    ELSE b.status
  END AS payment_status
FROM bookings b
LEFT JOIN installments i ON b.id = i.booking_id
GROUP BY b.id, b.user_id, b.studio_id, b.studio_package_id, b.package_category_id, 
         b.start_time, b.end_time, b.additional_time_minutes, b.total_amount, 
         b.status, b.payment_method, b.type, b.created_at, b.updated_at;

-- Enable RLS on the view
ALTER VIEW booking_with_installments SET (security_barrier = true);

-- Create policy for the installments view
CREATE POLICY "Admin and owner can view booking installments" 
ON booking_with_installments 
FOR SELECT 
USING (get_current_user_role() IN ('admin', 'owner'));

-- Update the booking status update function to be more robust
CREATE OR REPLACE FUNCTION public.update_booking_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  total_paid DECIMAL(10,2);
  booking_total DECIMAL(10,2);
BEGIN
  -- Get total paid amount
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.installments
  WHERE booking_id = NEW.booking_id;
  
  -- Get booking total amount
  SELECT total_amount INTO booking_total
  FROM public.bookings
  WHERE id = NEW.booking_id;
  
  -- Update booking status based on payment
  IF total_paid >= booking_total THEN
    UPDATE public.bookings 
    SET status = 'paid'
    WHERE id = NEW.booking_id AND status != 'paid';
  ELSIF total_paid > 0 THEN
    UPDATE public.bookings 
    SET status = 'installment'
    WHERE id = NEW.booking_id AND status NOT IN ('paid', 'installment');
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_bookings_user_search ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_studio_search ON public.bookings(studio_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status_search ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_bookings_created_at ON public.bookings(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_installments_booking_id ON public.installments(booking_id);
