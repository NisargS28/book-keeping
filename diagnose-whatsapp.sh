#!/bin/bash

# WhatsApp Integration Diagnostic Script
# Run this to quickly diagnose issues

echo "🔍 WhatsApp Integration Diagnostics"
echo "===================================="
echo ""

# Check if running in the correct directory
if [ ! -f "package.json" ]; then
    echo "❌ Error: Run this script from the project root directory"
    exit 1
fi

# 1. Check if Next.js app is running
echo "1️⃣ Checking if Next.js app is running..."
if curl -s http://localhost:3000 > /dev/null 2>&1; then
    echo "   ✅ App is running on localhost:3000"
else
    echo "   ❌ App is NOT running"
    echo "   👉 Run: npm run dev"
fi
echo ""

# 2. Check if webhook endpoint responds
echo "2️⃣ Testing webhook endpoint..."
RESPONSE=$(curl -s http://localhost:3000/api/whatsapp 2>&1)
if echo "$RESPONSE" | grep -q "status"; then
    echo "   ✅ Webhook endpoint is responding"
    echo "$RESPONSE" | python3 -m json.tool 2>/dev/null || echo "$RESPONSE"
else
    echo "   ❌ Webhook endpoint is NOT responding"
    echo "   Response: $RESPONSE"
fi
echo ""

# 3. Check environment variables
echo "3️⃣ Checking environment variables..."
if [ -f ".env.local" ]; then
    echo "   ✅ .env.local file exists"
    
    if grep -q "TWILIO_AUTH_TOKEN" .env.local 2>/dev/null; then
        if grep "TWILIO_AUTH_TOKEN" .env.local | grep -q "your_"; then
            echo "   ⚠️  TWILIO_AUTH_TOKEN is set but looks like placeholder"
        else
            echo "   ✅ TWILIO_AUTH_TOKEN is configured"
        fi
    else
        echo "   ⚠️  TWILIO_AUTH_TOKEN not found"
    fi
    
    if grep -q "NEXT_PUBLIC_APP_URL" .env.local 2>/dev/null; then
        APP_URL=$(grep "NEXT_PUBLIC_APP_URL" .env.local | cut -d'=' -f2)
        echo "   ✅ NEXT_PUBLIC_APP_URL is set to: $APP_URL"
        
        if echo "$APP_URL" | grep -q "yourdomain"; then
            echo "   ⚠️  APP_URL looks like a placeholder"
        fi
    else
        echo "   ⚠️  NEXT_PUBLIC_APP_URL not found"
    fi
else
    echo "   ❌ .env.local file not found"
    echo "   👉 Create .env.local with required variables"
fi
echo ""

# 4. Check if ngrok is running (for local dev)
echo "4️⃣ Checking ngrok (local development)..."
if pgrep -x "ngrok" > /dev/null; then
    echo "   ✅ ngrok is running"
    
    # Try to get ngrok URL
    NGROK_URL=$(curl -s http://127.0.0.1:4040/api/tunnels 2>/dev/null | grep -o 'https://[^"]*ngrok[^"]*' | head -1)
    if [ ! -z "$NGROK_URL" ]; then
        echo "   📍 ngrok URL: $NGROK_URL"
        echo "   👉 Use this in Twilio webhook: $NGROK_URL/api/whatsapp"
    fi
else
    echo "   ⚠️  ngrok is not running"
    echo "   👉 For local development, run: ngrok http 3000"
fi
echo ""

# 5. Check database migration
echo "5️⃣ Checking database migration..."
if [ -f "migrations/002_add_whatsapp_phone.sql" ]; then
    echo "   ✅ Migration file exists"
    echo "   👉 Make sure you ran it in Supabase SQL Editor"
else
    echo "   ❌ Migration file not found"
fi
echo ""

# 6. Check route file
echo "6️⃣ Checking route file..."
if [ -f "app/api/whatsapp/route.ts" ]; then
    echo "   ✅ Route file exists"
    
    # Check if signature validation code is present
    if grep -q "validateRequest" app/api/whatsapp/route.ts; then
        echo "   ✅ Signature validation code is present"
    else
        echo "   ⚠️  Signature validation code might be missing"
    fi
else
    echo "   ❌ Route file not found at app/api/whatsapp/route.ts"
fi
echo ""

# Summary
echo "📋 Summary & Next Steps"
echo "======================="
echo ""
echo "✅ = Working fine"
echo "⚠️  = Needs attention"
echo "❌ = Critical issue"
echo ""
echo "Common fixes:"
echo "  • App not running? → npm run dev"
echo "  • Missing .env.local? → Copy from .env.example"
echo "  • ngrok not running? → ngrok http 3000"
echo "  • No Twilio response? → Check webhook URL in Twilio Console"
echo "  • Check Twilio Debugger: https://www.twilio.com/console/debugger"
echo ""
echo "📖 Full troubleshooting guide: WHATSAPP_TROUBLESHOOTING.md"
