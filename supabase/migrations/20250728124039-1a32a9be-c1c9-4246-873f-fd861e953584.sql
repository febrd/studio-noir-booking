
-- Add foreign key constraint between custom_orders and customer_profiles
ALTER TABLE custom_orders 
ADD CONSTRAINT custom_orders_customer_id_fkey 
FOREIGN KEY (customer_id) REFERENCES customer_profiles(id);
