-- Diagnostic: Check WhatsApp numbers in database
-- Run this in Supabase SQL Editor

-- See ALL WhatsApp numbers registered
SELECT 
  up.id,
  up.whatsapp_phone,
  au.email,
  up.name,
  up.created_at
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.whatsapp_phone IS NOT NULL
ORDER BY up.created_at DESC;

-- Check specifically for your number
SELECT 
  up.id,
  up.whatsapp_phone,
  au.email,
  LENGTH(up.whatsapp_phone) as phone_length,
  up.whatsapp_phone = '+917778051665' as exact_match
FROM user_profiles up
JOIN auth.users au ON au.id = up.id
WHERE up.whatsapp_phone LIKE '%7778051665%';

-- Check for hidden characters or spaces
SELECT 
  up.id,
  up.whatsapp_phone,
  REPLACE(up.whatsapp_phone, ' ', '_') as with_spaces_shown,
  ascii(substring(up.whatsapp_phone, 1, 1)) as first_char_ascii
FROM user_profiles up
WHERE up.whatsapp_phone LIKE '%778051665%';

