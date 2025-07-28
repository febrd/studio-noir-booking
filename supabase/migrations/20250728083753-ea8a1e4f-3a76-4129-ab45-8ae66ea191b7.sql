
-- Create expenses table
CREATE TABLE public.expenses (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  amount NUMERIC(15,2) NOT NULL,
  description TEXT,
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  performed_by UUID NOT NULL REFERENCES public.users(id),
  note_file_path TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add RLS to expenses table
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Create policy for admin, owner, and keuangan roles to access expenses
CREATE POLICY "Allow admin, owner, and keuangan to manage expenses"
ON public.expenses
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
);

-- Create storage bucket for expense files
INSERT INTO storage.buckets (id, name, public) 
VALUES ('expenses', 'expenses', false);

-- Create storage policy for expense files
CREATE POLICY "Allow authenticated users to upload expense files"
ON storage.objects
FOR INSERT 
TO authenticated
WITH CHECK (
  bucket_id = 'expenses' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
);

CREATE POLICY "Allow authenticated users to view expense files"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'expenses' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
);

CREATE POLICY "Allow authenticated users to update expense files"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'expenses' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
);

CREATE POLICY "Allow authenticated users to delete expense files"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'expenses' AND
  EXISTS (
    SELECT 1 FROM public.users 
    WHERE id = auth.uid() 
    AND role IN ('admin', 'owner', 'keuangan')
  )
);

-- Add trigger for updated_at
CREATE TRIGGER update_expenses_updated_at
  BEFORE UPDATE ON public.expenses
  FOR EACH ROW
  EXECUTE PROCEDURE public.update_updated_at_column();
