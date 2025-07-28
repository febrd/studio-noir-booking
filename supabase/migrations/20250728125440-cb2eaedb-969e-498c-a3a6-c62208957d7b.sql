
-- Update the check constraint on custom_orders table to allow all status values
ALTER TABLE custom_orders DROP CONSTRAINT IF EXISTS custom_orders_status_check;

-- Add the correct check constraint for status
ALTER TABLE custom_orders ADD CONSTRAINT custom_orders_status_check 
CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled'));
