
-- Create package_categories table for regular photo studios
CREATE TABLE public.package_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  studio_id UUID NOT NULL REFERENCES public.studios(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Add category_id to studio_packages table (nullable for self_photo studios)
ALTER TABLE public.studio_packages 
ADD COLUMN category_id UUID REFERENCES public.package_categories(id) ON DELETE SET NULL;

-- Create trigger for updated_at on package_categories
CREATE TRIGGER update_package_categories_updated_at
  BEFORE UPDATE ON public.package_categories
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Add constraint to ensure regular studios must have category_id when creating packages
-- We'll handle this validation in the application layer for better flexibility

-- Create index for better performance
CREATE INDEX idx_package_categories_studio_id ON public.package_categories(studio_id);
CREATE INDEX idx_studio_packages_category_id ON public.studio_packages(category_id);

-- Insert sample categories for existing regular studios
INSERT INTO public.package_categories (studio_id, name, description) 
SELECT 
  id, 
  'Family', 
  'Paket foto keluarga dengan berbagai pilihan durasi'
FROM public.studios 
WHERE type = 'regular';

INSERT INTO public.package_categories (studio_id, name, description) 
SELECT 
  id, 
  'Personal', 
  'Paket foto personal untuk individu'
FROM public.studios 
WHERE type = 'regular';

INSERT INTO public.package_categories (studio_id, name, description) 
SELECT 
  id, 
  'Group', 
  'Paket foto group untuk acara khusus'
FROM public.studios 
WHERE type = 'regular';
