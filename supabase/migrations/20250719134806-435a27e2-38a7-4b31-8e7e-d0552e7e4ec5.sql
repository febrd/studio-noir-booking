
-- Create table for monthly revenue targets
CREATE TABLE public.monthly_targets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  month INTEGER NOT NULL CHECK (month >= 1 AND month <= 12),
  year INTEGER NOT NULL CHECK (year >= 2020),
  target_amount NUMERIC NOT NULL DEFAULT 20000000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES public.users(id),
  UNIQUE(month, year)
);

-- Add RLS policies for monthly targets
ALTER TABLE public.monthly_targets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow authenticated users to read monthly targets" 
  ON public.monthly_targets 
  FOR SELECT 
  USING (true);

CREATE POLICY "Allow owner/admin to manage monthly targets" 
  ON public.monthly_targets 
  FOR ALL 
  USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Add trigger for updated_at
CREATE TRIGGER update_monthly_targets_updated_at
  BEFORE UPDATE ON public.monthly_targets
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
