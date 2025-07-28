
-- Create custom_orders table
CREATE TABLE custom_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL,
  studio_id UUID NOT NULL,
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  payment_method VARCHAR(20) NOT NULL CHECK (payment_method IN ('online', 'offline')),
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'completed', 'cancelled')),
  order_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  created_by UUID REFERENCES users(id)
);

-- Create custom_order_services table for multiple additional services
CREATE TABLE custom_order_services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  custom_order_id UUID NOT NULL REFERENCES custom_orders(id) ON DELETE CASCADE,
  additional_service_id UUID NOT NULL REFERENCES additional_services(id),
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_custom_orders_customer_id ON custom_orders(customer_id);
CREATE INDEX idx_custom_orders_studio_id ON custom_orders(studio_id);
CREATE INDEX idx_custom_orders_order_date ON custom_orders(order_date);
CREATE INDEX idx_custom_orders_payment_method ON custom_orders(payment_method);
CREATE INDEX idx_custom_order_services_order_id ON custom_order_services(custom_order_id);

-- Add trigger for updated_at
CREATE TRIGGER update_custom_orders_updated_at
  BEFORE UPDATE ON custom_orders
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add foreign key constraints
ALTER TABLE custom_orders 
  ADD CONSTRAINT fk_custom_orders_customer 
  FOREIGN KEY (customer_id) REFERENCES users(id);

ALTER TABLE custom_orders 
  ADD CONSTRAINT fk_custom_orders_studio 
  FOREIGN KEY (studio_id) REFERENCES studios(id);
