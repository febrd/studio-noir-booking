
-- Add missing fields to bookings table
ALTER TABLE public.bookings 
ADD COLUMN IF NOT EXISTS package_category_id uuid REFERENCES public.package_categories(id),
ADD COLUMN IF NOT EXISTS start_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS end_time timestamp with time zone,
ADD COLUMN IF NOT EXISTS additional_time_minutes integer DEFAULT 0;

-- Update booking_status enum to include installment
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'installment';

-- Create installments table for payment tracking
CREATE TABLE IF NOT EXISTS public.installments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount numeric NOT NULL,
  paid_at timestamp with time zone NOT NULL DEFAULT now(),
  note text,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS on installments table
ALTER TABLE public.installments ENABLE ROW LEVEL SECURITY;

-- Create policy for installments (admin and owner access)
CREATE POLICY "Admin and booking owner can manage installments" 
ON public.installments 
FOR ALL 
USING (
  EXISTS (
    SELECT 1 FROM public.bookings b 
    WHERE b.id = installments.booking_id 
    AND (b.user_id = auth.uid() OR get_current_user_role() IN ('admin', 'owner'))
  )
);

-- Update booking_additional_services to include total_price
ALTER TABLE public.booking_additional_services 
ADD COLUMN IF NOT EXISTS total_price numeric;

-- Create function to calculate total installments for a booking
CREATE OR REPLACE FUNCTION public.calculate_total_installments(booking_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  total_paid DECIMAL(10,2);
BEGIN
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.installments
  WHERE booking_id = booking_id_param;
  
  RETURN total_paid;
END;
$function$;

-- Create function to update booking status based on payments
CREATE OR REPLACE FUNCTION public.update_booking_payment_status()
RETURNS trigger
LANGUAGE plpgsql
AS $function$
DECLARE
  total_paid DECIMAL(10,2);
  booking_total DECIMAL(10,2);
BEGIN
  -- Get total paid amount
  SELECT calculate_total_installments(NEW.booking_id) INTO total_paid;
  
  -- Get booking total amount
  SELECT total_amount INTO booking_total
  FROM public.bookings
  WHERE id = NEW.booking_id;
  
  -- Update booking status based on payment
  IF total_paid >= booking_total THEN
    UPDATE public.bookings 
    SET status = 'paid'
    WHERE id = NEW.booking_id;
  ELSIF total_paid > 0 THEN
    UPDATE public.bookings 
    SET status = 'installment'
    WHERE id = NEW.booking_id;
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Create trigger to automatically update booking status when installment is added
CREATE OR REPLACE TRIGGER update_booking_status_on_installment
  AFTER INSERT ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION update_booking_payment_status();

-- Create function to check booking conflicts
CREATE OR REPLACE FUNCTION public.check_booking_conflict(
  studio_id_param uuid,
  start_time_param timestamp with time zone,
  end_time_param timestamp with time zone,
  exclude_booking_id uuid DEFAULT NULL
)
RETURNS boolean
LANGUAGE plpgsql
AS $function$
DECLARE
  conflict_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO conflict_count
  FROM public.bookings
  WHERE studio_id = studio_id_param
    AND status NOT IN ('cancelled', 'failed')
    AND (exclude_booking_id IS NULL OR id != exclude_booking_id)
    AND (
      (start_time <= start_time_param AND end_time > start_time_param) OR
      (start_time < end_time_param AND end_time >= end_time_param) OR
      (start_time >= start_time_param AND end_time <= end_time_param)
    );
  
  RETURN conflict_count > 0;
END;
$function$;

-- Update the calculate_booking_total function to include additional time correctly
CREATE OR REPLACE FUNCTION public.calculate_booking_total(booking_id_param uuid)
RETURNS numeric
LANGUAGE plpgsql
AS $function$
DECLARE
  package_price DECIMAL(10,2);
  services_total DECIMAL(10,2);
  additional_time_cost DECIMAL(10,2) DEFAULT 0;
  studio_type text;
  additional_minutes integer;
  total DECIMAL(10,2);
BEGIN
  -- Get package price and studio type
  SELECT sp.price, s.type, b.additional_time_minutes
  INTO package_price, studio_type, additional_minutes
  FROM public.studio_packages sp
  JOIN public.bookings b ON b.studio_package_id = sp.id
  JOIN public.studios s ON s.id = b.studio_id
  WHERE b.id = booking_id_param;
  
  -- Get additional services total
  SELECT COALESCE(SUM(ads.price * bas.quantity), 0) INTO services_total
  FROM public.booking_additional_services bas
  JOIN public.additional_services ads ON bas.additional_service_id = ads.id
  WHERE bas.booking_id = booking_id_param;
  
  -- Calculate additional time cost based on studio type
  IF additional_minutes IS NOT NULL AND additional_minutes > 0 THEN
    IF studio_type = 'self_photo' THEN
      -- 5000 per 5 minutes for self photo
      additional_time_cost := CEIL(additional_minutes::DECIMAL / 5) * 5000;
    ELSE
      -- 15000 per 5 minutes for regular photo
      additional_time_cost := CEIL(additional_minutes::DECIMAL / 5) * 15000;
    END IF;
  END IF;
  
  total := COALESCE(package_price, 0) + COALESCE(services_total, 0) + COALESCE(additional_time_cost, 0);
  
  RETURN total;
END;
$function$;
