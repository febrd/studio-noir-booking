
-- Update the log_booking_activity function to handle NULL performed_by
CREATE OR REPLACE FUNCTION public.log_booking_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  action_type_val VARCHAR(50);
  user_id UUID;
BEGIN
  -- Get current user ID, fallback to a system user or skip logging if NULL
  user_id := auth.uid();
  
  -- If no authenticated user, skip logging to avoid constraint violation
  IF user_id IS NULL THEN
    RETURN COALESCE(NEW, OLD);
  END IF;
  
  -- Determine action type
  IF TG_OP = 'INSERT' THEN
    action_type_val := 'create';
  ELSIF TG_OP = 'UPDATE' THEN
    action_type_val := 'update';
  ELSIF TG_OP = 'DELETE' THEN
    action_type_val := 'delete';
  END IF;
  
  -- Log the activity only if we have a valid user_id
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

-- Also update the installment activity function to handle NULL performed_by
CREATE OR REPLACE FUNCTION public.log_installment_activity()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  booking_info RECORD;
  installment_count INTEGER;
  user_id UUID;
BEGIN
  -- Get current user ID
  user_id := COALESCE(NEW.performed_by, auth.uid());
  
  -- If no user ID available, skip logging
  IF user_id IS NULL THEN
    RETURN NEW;
  END IF;

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
  NEW.performed_by := user_id;
  
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
    user_id,
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
    user_id,
    'installment',
    'paid'
  );
  
  RETURN NEW;
END;
$$;
