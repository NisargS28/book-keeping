# WhatsApp Integration Troubleshooting Guide

## No Reply from Twilio? Follow This Checklist

### Quick Diagnostics

Run through these checks in order:

---

## 1. ✅ Check if Webhook is Reachable

### Test the Endpoint

**Option A: Browser Test**
Open in browser: `https://your-url.com/api/whatsapp`

**Expected Response:**
```json
{
  "status": "ok",
  "message": "WhatsApp webhook endpoint is active",
  "timestamp": "2025-12-25T10:30:00.000Z",
  "env": {
    "hasAuthToken": true,
    "hasAppUrl": true,
    "signatureValidation": true
  }
}
```

**Option B: cURL Test**
```bash
curl https://your-url.com/api/whatsapp
```

❌ **If you get an error:**
- Webhook URL is wrong
- App is not running
- ngrok is not forwarding (local dev)

---

## 2. ✅ Verify Twilio Webhook Configuration

### Check Twilio Console

1. Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
2. Find "WHEN A MESSAGE COMES IN"
3. Verify the URL matches exactly:
   - Local: `https://abc123.ngrok.io/api/whatsapp`
   - Production: `https://yourdomain.com/api/whatsapp`

### Common Mistakes:
❌ `http://` instead of `https://`
❌ Missing `/api/whatsapp` path
❌ Old ngrok URL (expired)
❌ Typo in domain name

### Test Webhook in Twilio:
1. In Twilio Console, click "Test"
2. Check if it shows "Success" or error message

---

## 3. ✅ Check Twilio Debugger

**Most Important: Check for errors in Twilio's logs**

1. Go to: https://www.twilio.com/console/debugger
2. Look for recent WhatsApp messages
3. Check for errors:
   - Connection timeout
   - 404 Not Found
   - 500 Server Error
   - SSL/Certificate errors

**Common Error Messages:**

### "Unable to create record: The requested resource was not found"
→ Webhook URL is incorrect

### "Connection timeout"
→ Your server is not responding (app not running or ngrok down)

### "502 Bad Gateway"
→ Your app crashed or has errors

### "Invalid signature"
→ Environment variables mismatch

---

## 4. ✅ Verify WhatsApp Number is Linked

### In Your App:
1. Log in to the app
2. Go to **Settings** → **Profile** tab
3. Check **WhatsApp Integration** section
4. Should show: "✓ Connected" with your number

### Expected Format:
```
whatsapp:+14155238886
```

### Check Database:
```sql
SELECT id, whatsapp_phone 
FROM user_profiles 
WHERE whatsapp_phone IS NOT NULL;
```

❌ **If NULL:** Number is not linked
❌ **If wrong format:** Should start with `whatsapp:`

---

## 5. ✅ Check Server Logs

### View Logs in Real-Time:

**For Next.js:**
```bash
npm run dev
```

**Expected Logs When Message Arrives:**
```
🔔 Webhook called at: 2025-12-25T10:30:00.000Z
📱 WhatsApp message received: {
  from: 'whatsapp:+14155238886',
  body: 'Personal, income, 5000, Salary',
  allParams: { ... }
}
⚠️ Twilio signature validation skipped (missing env vars)
✅ Entry created: abc-123-def
✅ Success response sent in 234ms
📤 Sending TwiML response: <Response><Message>...</Message></Response>
⏱️ Total webhook processing time: 250ms
```

❌ **If you see NO logs:**
- Webhook is not being called
- Check Twilio webhook URL
- Check if app is running

❌ **If you see "❌ Invalid Twilio signature":**
- Check environment variables
- Verify NEXT_PUBLIC_APP_URL matches webhook URL exactly

---

## 6. ✅ Test with Signature Validation Disabled

**Temporarily disable for testing:**

Create/edit `.env.local`:
```env
# Comment these out temporarily
# TWILIO_AUTH_TOKEN=your_token
# NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

Restart server:
```bash
npm run dev
```

You should see:
```
⚠️ Twilio signature validation skipped (missing env vars)
```

**Try sending a WhatsApp message again.**

✅ **If it works now:** Issue is with signature validation (see #7)
❌ **If still no reply:** Issue is elsewhere (continue checklist)

---

## 7. ✅ Fix Signature Validation Issues

### Common Problems:

**Problem 1: URL Mismatch**
```env
# Wrong - using http in env but https in Twilio
NEXT_PUBLIC_APP_URL=http://yourdomain.com

# Correct
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Problem 2: Missing trailing slash or extra path**
```env
# Wrong
NEXT_PUBLIC_APP_URL=https://yourdomain.com/api/whatsapp

# Correct (no path, no trailing slash)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**Problem 3: ngrok URL changed**
```bash
# Check current ngrok URL
curl http://127.0.0.1:4040/api/tunnels

# Update .env.local with new URL
NEXT_PUBLIC_APP_URL=https://NEW-NGROK-URL.ngrok.io
```

**Problem 4: Wrong Auth Token**
1. Go to: https://www.twilio.com/console
2. Copy the correct "Auth Token"
3. Update `.env.local`
4. Restart server

---

## 8. ✅ Verify Message Format

### Send Test Message:

**Minimal Format (4 fields):**
```
Personal, income, 5000, Salary
```

**Full Format:**
```
Personal, income, 5000, Salary, Bank, Monthly salary
```

### Common Format Errors:

❌ Wrong separator:
```
Personal - income - 5000 - Salary
```

✅ Correct:
```
Personal, income, 5000, Salary
```

❌ Missing fields:
```
Personal, income, 5000
```

✅ Correct (minimum 4):
```
Personal, income, 5000, Salary
```

---

## 9. ✅ Check if Books Exist

### In Your App:
1. Go to **Books** page
2. Verify you have at least one book
3. Note the exact book name

### Test with Exact Book Name:
```
YourExactBookName, income, 5000, Salary
```

❌ **Case matters in first attempt:**
- If book is "Personal", use "Personal" not "personal"
- Actually, it's case-insensitive, but check spelling!

---

## 10. ✅ Check Network/Firewall

### For Local Development:

**Is ngrok running?**
```bash
# Check if ngrok is running
ps aux, grep ngrok

# Start ngrok if not running
ngrok http 3000
```

**Check ngrok dashboard:**
```
http://127.0.0.1:4040
```
- Should show requests coming in
- Check for errors

### For Production:

**Test if server is accessible:**
```bash
curl -I https://yourdomain.com/api/whatsapp
```

**Expected:**
```
HTTP/2 200
content-type: application/json
```

---

## Quick Test Script

Save this as `test-webhook.sh`:

```bash
#!/bin/bash

echo "🧪 Testing WhatsApp Webhook..."
echo ""

# Test 1: Check if endpoint responds
echo "1️⃣ Testing endpoint..."
curl -s https://your-url.com/api/whatsapp, jq '.'

echo ""
echo "2️⃣ Checking environment..."
if [ -z "$TWILIO_AUTH_TOKEN" ]; then
  echo "⚠️ TWILIO_AUTH_TOKEN not set"
else
  echo "✅ TWILIO_AUTH_TOKEN is set"
fi

if [ -z "$NEXT_PUBLIC_APP_URL" ]; then
  echo "⚠️ NEXT_PUBLIC_APP_URL not set"
else
  echo "✅ NEXT_PUBLIC_APP_URL is set"
fi

echo ""
echo "3️⃣ Check Twilio Debugger:"
echo "   https://www.twilio.com/console/debugger"
```

---

## Common Solutions Summary

| Problem, Solution |
|---------|----------|
| No logs in server, Webhook URL wrong or app not running |
| "404 Not Found", Check webhook URL path |
| "Connection timeout", Start your server / ngrok |
| "Invalid signature", Fix environment variables |
| "Not Registered", Link WhatsApp number in Settings |
| "Book Not Found", Check book name spelling |
| "Invalid Format", Use pipes `\|` not dashes or commas |
| ngrok expired, Restart ngrok, update Twilio webhook URL |

---

## Step-by-Step: Full Reset

If nothing works, try this complete reset:

### 1. Stop Everything
```bash
# Stop your server (Ctrl+C)
# Stop ngrok (Ctrl+C)
```

### 2. Clear Environment
```bash
# Remove .env.local
rm .env.local
```

### 3. Start Fresh
```bash
# Start ngrok
ngrok http 3000

# Note the URL (e.g., https://abc123.ngrok.io)

# Create .env.local
cat > .env.local << EOF
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
EOF

# Start server
npm run dev
```

### 4. Update Twilio
1. Go to: https://www.twilio.com/console/sms/whatsapp/sandbox
2. Set webhook: `https://abc123.ngrok.io/api/whatsapp`
3. Save

### 5. Link Number
1. Open app in browser
2. Settings → Profile
3. Link your WhatsApp number

### 6. Test
Send: `Personal, income, 500, Test`

---

## Still Not Working?

### Check These Files:

**1. Verify route file exists:**
```bash
ls -la app/api/whatsapp/route.ts
```

**2. Verify no TypeScript errors:**
```bash
npm run build
```

**3. Check server is actually running:**
```bash
curl http://localhost:3000/api/whatsapp
```

---

## Get More Help

### Enable Debug Logging

Add this to the top of `/app/api/whatsapp/route.ts`:

```typescript
const DEBUG = true;

if (DEBUG) {
  console.log('=== DEBUG MODE ===');
  console.log('Environment:', {
    hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
    hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
    appUrl: process.env.NEXT_PUBLIC_APP_URL
  });
}
```

### Share This Info:

When asking for help, provide:
1. Twilio Debugger screenshot
2. Your server logs
3. Your `.env.local` (without actual tokens!)
4. The exact message you sent
5. Whether GET endpoint works

---

## Success! 🎉

When it's working, you'll see:

**In Server Logs:**
```
🔔 Webhook called at: 2025-12-25T10:30:00.000Z
📱 WhatsApp message received...
✅ Entry created: abc-123
✅ Success response sent in 234ms
```

**In WhatsApp:**
```
✅ Entry Added!

💰 Income: +₹5000.00
📚 Book: Personal
🏷️ Category: Salary
💳 Payment: Bank
📝 Description: Monthly salary

💼 New Balance: ₹25000.00
```

**In Twilio Debugger:**
- Green checkmark ✅
- Status: "Delivered"
- No errors
