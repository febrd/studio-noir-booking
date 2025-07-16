-- Create enums for various status fields
CREATE TYPE user_role AS ENUM ('owner', 'admin', 'keuangan', 'pelanggan');
CREATE TYPE payment_environment AS ENUM ('sandbox', 'production');
CREATE TYPE provider_status AS ENUM ('active', 'inactive');
CREATE TYPE booking_type AS ENUM ('self_photo', 'regular');
CREATE TYPE payment_method AS ENUM ('online', 'offline');
CREATE TYPE booking_status AS ENUM ('pending', 'confirmed', 'completed', 'cancelled');
CREATE TYPE payment_type AS ENUM ('online', 'offline');
CREATE TYPE transaction_status AS ENUM ('paid', 'unpaid', 'expired', 'pending', 'settlement', 'failed');

-- Create users table with authentication
CREATE TABLE public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role user_role NOT NULL DEFAULT 'pelanggan',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create payment_providers table
CREATE TABLE public.payment_providers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  client_id TEXT,
  client_secret TEXT,
  server_key TEXT,
  environment payment_environment NOT NULL DEFAULT 'sandbox',
  status provider_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create studio_packages table
CREATE TABLE public.studio_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  base_time_minutes INTEGER NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create additional_services table
CREATE TABLE public.additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create bookings table
CREATE TABLE public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  studio_package_id UUID NOT NULL REFERENCES public.studio_packages(id) ON DELETE RESTRICT,
  type booking_type NOT NULL DEFAULT 'self_photo',
  payment_method payment_method NOT NULL,
  status booking_status NOT NULL DEFAULT 'pending',
  total_amount DECIMAL(10,2),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create booking_additional_services junction table
CREATE TABLE public.booking_additional_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  additional_service_id UUID NOT NULL REFERENCES public.additional_services(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL DEFAULT 1,
  UNIQUE(booking_id, additional_service_id)
);

-- Create booking_sessions table
CREATE TABLE public.booking_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  additional_time_minutes INTEGER,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transactions table
CREATE TABLE public.transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  payment_provider_id UUID REFERENCES public.payment_providers(id),
  payment_type payment_type NOT NULL,
  status transaction_status NOT NULL DEFAULT 'unpaid',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Create transaction_logs table
CREATE TABLE public.transaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  transaction_id UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  changed_by_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  from_status transaction_status,
  to_status transaction_status NOT NULL,
  note TEXT,
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_providers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.studio_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_additional_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.booking_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_logs ENABLE ROW LEVEL SECURITY;

-- Create policies for users table
CREATE POLICY "Users can view their own data" ON public.users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all users" ON public.users
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

CREATE POLICY "Admins can update users" ON public.users
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can insert users" ON public.users
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

CREATE POLICY "Admins can delete users (except owner)" ON public.users
  FOR DELETE USING (
    role != 'owner' AND
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create policies for payment_providers (admin only)
CREATE POLICY "Admins can manage payment providers" ON public.payment_providers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

-- Create policies for studio_packages
CREATE POLICY "Everyone can view studio packages" ON public.studio_packages
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage studio packages" ON public.studio_packages
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create policies for additional_services
CREATE POLICY "Everyone can view additional services" ON public.additional_services
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage additional services" ON public.additional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Create policies for bookings
CREATE POLICY "Users can view their own bookings" ON public.bookings
  FOR SELECT USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

CREATE POLICY "Users can create their own bookings" ON public.bookings
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can update bookings" ON public.bookings
  FOR UPDATE USING (
    auth.uid() = user_id OR
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

-- Create policies for booking_additional_services
CREATE POLICY "Users can manage their booking services" ON public.booking_additional_services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND role IN ('owner', 'admin', 'keuangan')
           ))
    )
  );

-- Create policies for booking_sessions
CREATE POLICY "Users can manage their booking sessions" ON public.booking_sessions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND role IN ('owner', 'admin', 'keuangan')
           ))
    )
  );

-- Create policies for transactions
CREATE POLICY "Users can view their transactions" ON public.transactions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.bookings 
      WHERE id = booking_id 
      AND (user_id = auth.uid() OR 
           EXISTS (
             SELECT 1 FROM public.users 
             WHERE id = auth.uid() 
             AND role IN ('owner', 'admin', 'keuangan')
           ))
    )
  );

CREATE POLICY "Admins can manage transactions" ON public.transactions
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

-- Create policies for transaction_logs
CREATE POLICY "Admins can view transaction logs" ON public.transaction_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

CREATE POLICY "Admins can create transaction logs" ON public.transaction_logs
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users 
      WHERE id = auth.uid() 
      AND role IN ('owner', 'admin', 'keuangan')
    )
  );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at timestamps
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_payment_providers_updated_at
  BEFORE UPDATE ON public.payment_providers
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_studio_packages_updated_at
  BEFORE UPDATE ON public.studio_packages
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_additional_services_updated_at
  BEFORE UPDATE ON public.additional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_bookings_updated_at
  BEFORE UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_booking_sessions_updated_at
  BEFORE UPDATE ON public.booking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Function to calculate booking total amount
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

-- Function to automatically update booking total when services change
CREATE OR REPLACE FUNCTION public.update_booking_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.bookings 
  SET total_amount = public.calculate_booking_total(
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.booking_id
      ELSE NEW.booking_id
    END
  )
  WHERE id = (
    CASE 
      WHEN TG_OP = 'DELETE' THEN OLD.booking_id
      ELSE NEW.booking_id
    END
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create triggers to auto-update booking totals
CREATE TRIGGER update_booking_total_on_services
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_additional_services
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_total();

CREATE TRIGGER update_booking_total_on_sessions
  AFTER INSERT OR UPDATE OR DELETE ON public.booking_sessions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_booking_total();

-- Function to create transaction log entry
CREATE OR REPLACE FUNCTION public.log_transaction_status_change()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.transaction_logs (
      transaction_id,
      changed_by_user_id,
      from_status,
      to_status,
      note
    ) VALUES (
      NEW.id,
      auth.uid(),
      OLD.status,
      NEW.status,
      'Status updated automatically'
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for transaction status logging
CREATE TRIGGER log_transaction_status_changes
  AFTER UPDATE ON public.transactions
  FOR EACH ROW
  EXECUTE FUNCTION public.log_transaction_status_change();

-- Insert default owner user (you should change the password)
INSERT INTO public.users (name, email, password, role) VALUES 
('System Owner', 'owner@masukstudio.com', '$2b$10$example_hashed_password', 'owner');