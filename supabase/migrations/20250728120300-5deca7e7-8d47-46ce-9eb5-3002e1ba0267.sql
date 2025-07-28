
-- Add foreign key constraints to establish relationships
ALTER TABLE custom_orders 
ADD CONSTRAINT fk_custom_orders_customer_id 
FOREIGN KEY (customer_id) REFERENCES customer_profiles(id);

ALTER TABLE custom_orders 
ADD CONSTRAINT fk_custom_orders_studio_id 
FOREIGN KEY (studio_id) REFERENCES studios(id);

ALTER TABLE custom_order_services 
ADD CONSTRAINT fk_custom_order_services_custom_order_id 
FOREIGN KEY (custom_order_id) REFERENCES custom_orders(id);

ALTER TABLE custom_order_services 
ADD CONSTRAINT fk_custom_order_services_additional_service_id 
FOREIGN KEY (additional_service_id) REFERENCES additional_services(id);
