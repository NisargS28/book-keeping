# WhatsApp Integration - Quick Start Guide

## Prerequisites

- Twilio account (free trial available)
- WhatsApp Sandbox number: `+14155238886`
- Your Next.js app running

## 5-Minute Setup

### Step 1: Run Database Migration

In your Supabase SQL Editor, run:

```sql
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_phone 
ON public.user_profiles(whatsapp_phone);
```

### Step 2: Configure Twilio Webhook

**Setup Environment Variables First:**

Create a `.env.local` file:
```env
TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Get your Auth Token from: https://www.twilio.com/console

**For Local Development:**
```bash
# Terminal 1: Start your app
npm run dev

# Terminal 2: Start ngrok
ngrok http 3000
```

Then:
1. Go to https://www.twilio.com/console/sms/whatsapp/sandbox
2. Set webhook URL to: `https://YOUR-NGROK-URL.ngrok.io/api/whatsapp`
3. Save configuration

**For Production:**
1. Deploy your app
2. Set webhook URL to: `https://yourdomain.com/api/whatsapp`

### Step 3: Link Your WhatsApp Number

1. Open your app
2. Go to **Settings** → **Profile**
3. Find **WhatsApp Integration** section
4. Click **Link WhatsApp Number**
5. Enter your phone with country code (e.g., `+14155238886`)
6. Click **Link Number**

### Step 4: Test It!

Send this WhatsApp message to `+14155238886`:

```
Personal, income, 500, Test, Cash, Testing WhatsApp integration
```

You should receive a confirmation message with your new balance!

## Message Format

```
BookName, income/expense, amount, category, payment mode, description
```

## Examples

```
Personal, income, 5000, Salary, Bank, Monthly salary
Business, expense, 200, Food, Cash, Lunch
Home, expense, 1500, Rent
```

## Need Help?

See the full documentation in [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md)

## Common Issues

**"Not Registered" error?**
→ Make sure you linked your WhatsApp number in Settings

**Webhook not working?**
→ Check that ngrok is running and webhook URL is correct

**Book not found?**
→ Use the exact book name from your app

---

That's it! You're ready to add entries via WhatsApp! 🎉
