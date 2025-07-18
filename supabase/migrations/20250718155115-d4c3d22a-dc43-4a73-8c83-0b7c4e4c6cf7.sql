
-- Fix foreign key constraint for studio_package_id in bookings table
ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS fk_bookings_studio_package
FOREIGN KEY (studio_package_id) REFERENCES public.studio_packages(id);

-- Add foreign key constraint for package_category_id
ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS fk_bookings_package_category
FOREIGN KEY (package_category_id) REFERENCES public.package_categories(id);

-- Add foreign key constraint for studio_id
ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS fk_bookings_studio
FOREIGN KEY (studio_id) REFERENCES public.studios(id);

-- Add foreign key constraint for user_id
ALTER TABLE public.bookings
ADD CONSTRAINT IF NOT EXISTS fk_bookings_user
FOREIGN KEY (user_id) REFERENCES public.users(id);

-- Add foreign key constraints for booking_additional_services
ALTER TABLE public.booking_additional_services
ADD CONSTRAINT IF NOT EXISTS fk_booking_additional_services_booking
FOREIGN KEY (booking_id) REFERENCES public.bookings(id) ON DELETE CASCADE;

ALTER TABLE public.booking_additional_services
ADD CONSTRAINT IF NOT EXISTS fk_booking_additional_services_service
FOREIGN KEY (additional_service_id) REFERENCES public.additional_services(id);

-- Add foreign key constraints for additional_services
ALTER TABLE public.additional_services
ADD CONSTRAINT IF NOT EXISTS fk_additional_services_studio
FOREIGN KEY (studio_id) REFERENCES public.studios(id);

-- Add foreign key constraints for studio_packages
ALTER TABLE public.studio_packages
ADD CONSTRAINT IF NOT EXISTS fk_studio_packages_studio
FOREIGN KEY (studio_id) REFERENCES public.studios(id);

ALTER TABLE public.studio_packages
ADD CONSTRAINT IF NOT EXISTS fk_studio_packages_category
FOREIGN KEY (category_id) REFERENCES public.package_categories(id);

-- Add foreign key constraint for package_categories
ALTER TABLE public.package_categories
ADD CONSTRAINT IF NOT EXISTS fk_package_categories_studio
FOREIGN KEY (studio_id) REFERENCES public.studios(id);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_users_name_search ON public.users USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_users_email_search ON public.users USING gin (email gin_trgm_ops);

-- Enable pg_trgm extension for better text search (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
