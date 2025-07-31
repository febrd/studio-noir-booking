
-- Update payment_providers table to support Xendit-specific fields
ALTER TABLE payment_providers 
ADD COLUMN IF NOT EXISTS api_key TEXT,
ADD COLUMN IF NOT EXISTS secret_key TEXT,
ADD COLUMN IF NOT EXISTS public_key TEXT,
ADD COLUMN IF NOT EXISTS api_url TEXT;

-- Update existing columns to be more Xendit-specific
-- We'll keep existing columns for backward compatibility but add new ones
COMMENT ON COLUMN payment_providers.api_key IS 'Xendit API Key';
COMMENT ON COLUMN payment_providers.secret_key IS 'Xendit Secret Key'; 
COMMENT ON COLUMN payment_providers.public_key IS 'Xendit Public Key';
COMMENT ON COLUMN payment_providers.api_url IS 'Xendit API URL';
COMMENT ON COLUMN payment_providers.client_id IS 'Legacy field - can be used for additional Xendit config';
COMMENT ON COLUMN payment_providers.client_secret IS 'Legacy field - can be used for additional Xendit config';
COMMENT ON COLUMN payment_providers.server_key IS 'Legacy field - can be used for additional Xendit config';
