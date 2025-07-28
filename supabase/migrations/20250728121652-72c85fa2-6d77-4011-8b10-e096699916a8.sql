
-- Fix the foreign key constraint in custom_orders table
-- Currently it's referencing users table but we're using customer_profiles
ALTER TABLE custom_orders DROP CONSTRAINT IF EXISTS fk_custom_orders_customer;

-- Add the correct foreign key constraint to reference customer_profiles
ALTER TABLE custom_orders 
ADD CONSTRAINT fk_custom_orders_customer 
FOREIGN KEY (customer_id) REFERENCES customer_profiles(id) ON DELETE CASCADE;

-- Also ensure custom_order_services has the right foreign key
ALTER TABLE custom_order_services DROP CONSTRAINT IF EXISTS fk_custom_order_services_custom_order;
ALTER TABLE custom_order_services 
ADD CONSTRAINT fk_custom_order_services_custom_order 
FOREIGN KEY (custom_order_id) REFERENCES custom_orders(id) ON DELETE CASCADE;

ALTER TABLE custom_order_services DROP CONSTRAINT IF EXISTS fk_custom_order_services_additional_service;
ALTER TABLE custom_order_services 
ADD CONSTRAINT fk_custom_order_services_additional_service 
FOREIGN KEY (additional_service_id) REFERENCES additional_services(id) ON DELETE CASCADE;
