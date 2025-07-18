
-- Create studios table first
CREATE TABLE public.studios (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  type booking_type NOT NULL,
  location TEXT,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop existing studio_packages table and recreate with studio_id
DROP TABLE IF EXISTS public.studio_packages CASCADE;
CREATE TABLE public.studio_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  base_time_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Drop existing additional_services table and recreate with studio_id
DROP TABLE IF EXISTS public.additional_services CASCADE;
CREATE TABLE public.additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Update bookings table to reference studio instead of just package
ALTER TABLE public.bookings 
ADD COLUMN studio_id UUID REFERENCES public.studios(id) ON DELETE RESTRICT;

-- Update booking status enum to include more statuses
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'paid';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'expired';
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'failed';

-- Create triggers for updated_at timestamps on new tables
CREATE TRIGGER update_studios_updated_at
  BEFORE UPDATE ON public.studios
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Recreate triggers for studio_packages and additional_services
CREATE TRIGGER update_studio_packages_updated_at
  BEFORE UPDATE ON public.studio_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_additional_services_updated_at
  BEFORE UPDATE ON public.additional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Update the calculate_booking_total function to work with new structure
CREATE OR REPLACE FUNCTION public.calculate_booking_total(booking_id_param UUID)
RETURNS DECIMAL(10,2) AS $$
DECLARE
  package_price DECIMAL(10,2);
  services_total DECIMAL(10,2);
  additional_time_cost DECIMAL(10,2) DEFAULT 0;
  total DECIMAL(10,2);
BEGIN
  -- Get package price
  SELECT sp.price INTO package_price
  FROM public.studio_packages sp
  JOIN public.bookings b ON b.studio_package_id = sp.id
  WHERE b.id = booking_id_param;
  
  -- Get additional services total
  SELECT COALESCE(SUM(ads.price * bas.quantity), 0) INTO services_total
  FROM public.booking_additional_services bas
  JOIN public.additional_services ads ON bas.additional_service_id = ads.id
  WHERE bas.booking_id = booking_id_param;
  
  -- Calculate additional time cost (assuming 50000 per additional 30 minutes)
  SELECT COALESCE(SUM(bs.additional_time_minutes * 50000 / 30), 0) INTO additional_time_cost
  FROM public.booking_sessions bs
  WHERE bs.booking_id = booking_id_param
  AND bs.additional_time_minutes IS NOT NULL;
  
  total := COALESCE(package_price, 0) + COALESCE(services_total, 0) + COALESCE(additional_time_cost, 0);
  
  RETURN total;
END;
$$ LANGUAGE plpgsql;

-- Insert sample data
INSERT INTO public.studios (name, type, location, description, is_active) VALUES 
('Studio Noir Self Photo', 'self_photo', 'Lantai 2, Gedung Creative Hub', 'Studio khusus untuk self photo dengan lighting profesional', true),
('Studio Noir Regular', 'regular', 'Lantai 1, Gedung Creative Hub', 'Studio untuk photo session dengan fotografer profesional', true);
