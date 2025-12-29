-- Add WhatsApp phone number field to user_profiles
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone text UNIQUE;

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_phone 
ON public.user_profiles(whatsapp_phone);

-- Add comment
COMMENT ON COLUMN public.user_profiles.whatsapp_phone 
IS 'WhatsApp phone number in format: whatsapp:+1234567890';
