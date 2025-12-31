# 🚀 Vercel Deployment Guide for WhatsApp Integration

## ⚠️ Current Issue
WhatsApp integration works locally but fails on Vercel deployment.

## 🔧 Fix Steps

### 1. Set Environment Variables in Vercel

Go to your Vercel project settings: https://vercel.com/your-username/book-keeping-nine/settings/environment-variables

Add these environment variables (replace with your actual values):

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
NEXT_PUBLIC_APP_URL=https://book-keeping-nine.vercel.app
```

**💡 Get your actual values from:**
- Supabase: https://app.supabase.com/project/your-project/settings/api
- Twilio: https://console.twilio.com/

**Important Notes:**
- ✅ Set all variables for **Production**, **Preview**, and **Development** environments
- ✅ Do NOT include quotes around the values in Vercel UI
- ✅ After adding variables, redeploy your app

### 2. Update Twilio Webhook URL

1. Go to Twilio Console: https://console.twilio.com/
2. Navigate to: **Messaging** → **Settings** → **WhatsApp sandbox settings**
   - Or go to: **Messaging** → **Try it out** → **Send a WhatsApp message**
3. Update the webhook URL to:
   ```
   https://book-keeping-nine.vercel.app/api/whatsapp
   ```
4. Make sure the method is set to **POST**
5. Click **Save**

### 3. Test the Integration

1. Send a test message to your WhatsApp sandbox number
2. Check Vercel logs for any errors:
   - Go to: https://vercel.com/your-username/book-keeping-nine/logs
   - Look for `/api/whatsapp` requests
3. Check Twilio logs:
   - Go to: https://console.twilio.com/monitor/logs/whatsapp
   - Look for webhook errors

### 4. Common Issues & Solutions

#### Issue: "Webhook Error - 500"
**Solution:** Environment variables not set in Vercel
- Verify all env vars are added
- Redeploy after adding vars

#### Issue: "Unauthorized request"
**Solution:** Twilio signature validation failing
- Ensure `NEXT_PUBLIC_APP_URL` matches exactly: `https://book-keeping-nine.vercel.app` (no trailing slash)
- Ensure `TWILIO_AUTH_TOKEN` is correct

#### Issue: "User not found"
**Solution:** WhatsApp phone number not linked
- User must log in to the app
- Go to Settings
- Link their WhatsApp number (must match the format from Twilio)

#### Issue: "Database errors"
**Solution:** RLS policies or missing service role key
- Ensure `SUPABASE_SERVICE_ROLE_KEY` is set
- Check Supabase RLS policies are correct

### 5. Verify Deployment

After completing above steps, verify:

1. ✅ All environment variables are set in Vercel
2. ✅ Twilio webhook points to production URL
3. ✅ App is redeployed
4. ✅ Test message works

### 6. Debug Tips

**Check Vercel Function Logs:**
```bash
vercel logs https://book-keeping-nine.vercel.app
```

**Test webhook directly:**
```bash
curl https://book-keeping-nine.vercel.app/api/whatsapp
```

Expected response:
```json
{
  "status": "ok",
  "message": "WhatsApp webhook endpoint is active",
  "timestamp": "...",
  "env": {
    "hasAuthToken": true,
    "hasAppUrl": true,
    "signatureValidation": true
  }
}
```

### 7. Security Notes

⚠️ **Never commit `.env.local` to git!**

The `.env.local` file should be in `.gitignore`. Environment variables should only be set in:
- Local development: `.env.local` file
- Production: Vercel dashboard

## 📚 Related Documentation

- [Twilio WhatsApp Setup](./WHATSAPP_INTEGRATION.md)
- [Troubleshooting Guide](./WHATSAPP_TROUBLESHOOTING.md)
- [Quick Start](./QUICK_START.md)

## 🆘 Still Not Working?

If you've completed all steps and it's still not working:

1. Check Vercel logs: https://vercel.com/your-username/book-keeping-nine/logs
2. Check Twilio logs: https://console.twilio.com/monitor/logs
3. Verify the webhook GET endpoint returns success:
   - Visit: https://book-keeping-nine.vercel.app/api/whatsapp
   - Should show: `"signatureValidation": true`

## ✅ Checklist

- [ ] Fixed `.env.local` file (removed extra quotes)
- [ ] Added all environment variables in Vercel
- [ ] Redeployed the app after adding env vars
- [ ] Updated Twilio webhook URL to production URL
- [ ] Tested GET endpoint (returns OK with all env flags true)
- [ ] Sent test WhatsApp message
- [ ] Verified in Vercel logs
- [ ] Verified in Twilio logs
