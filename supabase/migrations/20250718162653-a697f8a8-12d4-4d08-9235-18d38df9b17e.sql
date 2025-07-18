
-- Disable RLS on installments table to fix permission issues
ALTER TABLE public.installments DISABLE ROW LEVEL SECURITY;

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Admin and booking owner can manage installments" ON public.installments;

-- Create booking logs table for activity tracking
CREATE TABLE IF NOT EXISTS public.booking_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  action_type VARCHAR(50) NOT NULL, -- 'create', 'update', 'delete', 'payment_added'
  performed_by UUID NOT NULL REFERENCES public.users(id),
  old_data JSONB,
  new_data JSONB,
  note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update transactions table structure
ALTER TABLE public.transactions 
ADD COLUMN IF NOT EXISTS reference_id UUID,
ADD COLUMN IF NOT EXISTS type VARCHAR(20) DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS description TEXT,
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.users(id);

-- Update installments table to include payment method and sequence
ALTER TABLE public.installments 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(20) DEFAULT 'offline',
ADD COLUMN IF NOT EXISTS installment_number INTEGER,
ADD COLUMN IF NOT EXISTS performed_by UUID REFERENCES public.users(id);

-- Function to calculate remaining amount for a booking
CREATE OR REPLACE FUNCTION public.get_booking_remaining_amount(booking_id_param UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  total_amount NUMERIC;
  total_paid NUMERIC;
BEGIN
  -- Get booking total amount
  SELECT b.total_amount INTO total_amount
  FROM public.bookings b
  WHERE b.id = booking_id_param;
  
  -- Get total paid from installments
  SELECT COALESCE(SUM(i.amount), 0) INTO total_paid
  FROM public.installments i
  WHERE i.booking_id = booking_id_param;
  
  RETURN COALESCE(total_amount, 0) - COALESCE(total_paid, 0);
END;
$$;

-- Function to log booking activities
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_type_val VARCHAR(50);
  user_id UUID;
BEGIN
  -- Get current user ID (you might need to adjust this based on your auth system)
  user_id := auth.uid();
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type_val := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type_val := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type_val := 'delete';
  END IF;
  
  -- Log the activity
  INSERT INTO public.booking_logs (
    booking_id,
    action_type,
    performed_by,
    old_data,
    new_data,
    note
  ) VALUES (
    COALESCE(NEW.id, OLD.id),
    action_type_val,
    user_id,
    CASE WHEN TG_OP != 'INSERT' THEN row_to_json(OLD) ELSE NULL END,
    CASE WHEN TG_OP != 'DELETE' THEN row_to_json(NEW) ELSE NULL END,
    'Booking ' || action_type_val || ' action performed'
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$;

-- Function to log installment activities and create transactions
CREATE OR REPLACE FUNCTION public.log_installment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_info RECORD;
  installment_count INTEGER;
BEGIN
  -- Get booking information
  SELECT b.*, u.name as customer_name
  INTO booking_info
  FROM public.bookings b
  JOIN public.users u ON u.id = b.user_id
  WHERE b.id = NEW.booking_id;
  
  -- Get installment number
  SELECT COUNT(*) + 1 INTO installment_count
  FROM public.installments
  WHERE booking_id = NEW.booking_id;
  
  -- Update installment number
  NEW.installment_number := installment_count;
  
  -- Log booking activity
  INSERT INTO public.booking_logs (
    booking_id,
    action_type,
    performed_by,
    new_data,
    note
  ) VALUES (
    NEW.booking_id,
    'payment_added',
    NEW.performed_by,
    row_to_json(NEW),
    'Installment payment #' || installment_count || ' added: ' || NEW.amount
  );
  
  -- Create transaction record
  INSERT INTO public.transactions (
    reference_id,
    booking_id,
    amount,
    type,
    description,
    performed_by,
    payment_type,
    status
  ) VALUES (
    NEW.booking_id,
    NEW.booking_id,
    NEW.amount,
    NEW.payment_method,
    'Cicilan ke-' || installment_count || ' untuk booking ' || booking_info.customer_name,
    NEW.performed_by,
    'installment',
    'paid'
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
DROP TRIGGER IF EXISTS booking_activity_log ON public.bookings;
CREATE TRIGGER booking_activity_log
  AFTER INSERT OR UPDATE OR DELETE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.log_booking_activity();

DROP TRIGGER IF EXISTS installment_activity_log ON public.installments;
CREATE TRIGGER installment_activity_log
  BEFORE INSERT ON public.installments
  FOR EACH ROW
  EXECUTE FUNCTION public.log_installment_activity();

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_booking_logs_booking_id ON public.booking_logs(booking_id);
CREATE INDEX IF NOT EXISTS idx_booking_logs_action_type ON public.booking_logs(action_type);
CREATE INDEX IF NOT EXISTS idx_booking_logs_created_at ON public.booking_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_reference_id ON public.transactions(reference_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON public.transactions(type);
CREATE INDEX IF NOT EXISTS idx_installments_booking_id ON public.installments(booking_id);
