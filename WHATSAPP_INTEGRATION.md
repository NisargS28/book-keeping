# WhatsApp Integration for Book-Keeping App

This document explains how to set up and use the WhatsApp integration feature that allows users to add entries by sending WhatsApp messages.

## Overview

Users can add income and expense entries to their books by sending WhatsApp messages to the Twilio sandbox number without any AI processing - just simple text parsing.

## Setup Instructions

### 1. Database Migration

Run the migration to add WhatsApp phone support to user profiles:

```sql
-- File: migrations/002_add_whatsapp_phone.sql
-- Run this in your Supabase SQL editor
ALTER TABLE public.user_profiles
ADD COLUMN IF NOT EXISTS whatsapp_phone text UNIQUE;

CREATE INDEX IF NOT EXISTS idx_user_profiles_whatsapp_phone 
ON public.user_profiles(whatsapp_phone);
```

### 2. Twilio Configuration

1. **Sign up for Twilio** at https://www.twilio.com/try-twilio
2. **Activate WhatsApp Sandbox**:
   - Go to https://www.twilio.com/console/sms/whatsapp/sandbox
   - Follow the instructions to join the sandbox
   - Sandbox number: `+14155238886`

3. **Configure Webhook**:
   - In the Twilio Console WhatsApp Sandbox settings
   - Set "WHEN A MESSAGE COMES IN" to: `https://yourdomain.com/api/whatsapp`
   - Method: `HTTP POST`

### 3. Local Development

For local development, use [ngrok](https://ngrok.com/) to expose your local server:

```bash
# Start your Next.js app
npm run dev

# In another terminal, start ngrok
ngrok http 3000

# Use the ngrok URL in Twilio webhook configuration
# Example: https://abc123.ngrok.io/api/whatsapp
```

### 4. Environment Variables

**Required for production (Twilio signature validation):**

Add these to your `.env.local` file:

```env
# Twilio Configuration
TWILIO_AUTH_TOKEN=your_auth_token_here

# Application URL (must match webhook URL domain)
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**How to get your Twilio Auth Token:**
1. Go to https://www.twilio.com/console
2. Find "Auth Token" in the dashboard
3. Copy and add to your `.env.local`

**Important Notes:**
- For local development with ngrok: `NEXT_PUBLIC_APP_URL=https://your-ngrok-url.ngrok.io`
- For production: `NEXT_PUBLIC_APP_URL=https://yourdomain.com`
- The URL must match your Twilio webhook configuration
- If these variables are not set, signature validation will be skipped (less secure)

## User Setup

### Linking WhatsApp Number

1. Log in to the app
2. Go to **Settings** → **Profile** tab
3. Scroll to **WhatsApp Integration** section
4. Click **Link WhatsApp Number**
5. Enter your WhatsApp phone number with country code (e.g., `+14155238886`)
6. Click **Link Number**

## Usage

### Message Format

Send messages to `+14155238886` in this format:

```
BookName, income/expense, amount, category, payment mode, description
```

**Fields:**
- **BookName** (required): Name of your book (e.g., "Personal", "Business")
- **Type** (required): Either "income" or "expense"
- **Amount** (required): Positive number (e.g., 500, 1500.50)
- **Category** (required): Category name (will be created if doesn't exist)
- **Payment Mode** (optional): Payment method (e.g., "Cash", "Bank", "UPI")
- **Description** (optional): Additional details

### Examples

**Income Entry:**
```
Personal, income, 5000, Salary, Bank, Monthly salary
```

**Expense Entry:**
```
Business, expense, 200, Food, Cash, Team lunch
```

**Minimal Format (no payment mode or custom description):**
```
Home, expense, 1500, Rent
```

**Entry with decimal amount:**
```
Personal, income, 1250.75, Freelance, UPI, Client payment
```

## Response Messages

### Success Response
```
✅ Entry Added!

💰 Income: +₹5000.00
📚 Book: Personal
🏷️ Category: Salary
💳 Payment: Bank
📝 Description: Monthly salary

💼 New Balance: ₹15000.00
```

### Error Responses

**Not Registered:**
```
❌ Not Registered

Your WhatsApp number is not linked to any account.

📝 Please:
1. Log in to the app
2. Go to Settings
3. Link your WhatsApp number
```

**Invalid Format:**
```
❌ Invalid Format

📋 Please use this format:
BookName, income/expense, amount, category, payment mode, description

📝 Examples:
• Personal, income, 5000, Salary, Bank, Monthly salary
• Business, expense, 200, Food, Cash, Lunch
```

**Book Not Found:**
```
❌ Book Not Found

"MyBook" doesn't exist.

📚 Your books:
• Personal
• Business

💡 Use the exact book name
```

## Features

### Automatic Category Creation
If you mention a category that doesn't exist, it will be automatically created with a random color.

### Real-time Balance Update
After each entry, you receive the updated book balance.

### Case-Insensitive Matching
Book names and categories are matched case-insensitively for convenience.

### Date Assignment
Entries are automatically assigned today's date.

## API Endpoint

### POST /api/whatsapp

Handles incoming WhatsApp messages from Twilio.

**Expected Form Data:**
- `Body`: Message text
- `From`: Sender's WhatsApp number (format: `whatsapp:+1234567890`)

**Response:**
- TwiML XML response with success/error message

### GET /api/whatsapp

Health check endpoint to verify the webhook is active.

**Response:**
```json
{
  "status": "ok",
  "message": "WhatsApp webhook endpoint is active",
  "timestamp": "2025-12-25T10:30:00.000Z"
}
```

## Security Considerations

### Current Implementation
- ✅ Phone number validation against database
- ✅ Twilio signature validation (when environment variables are set)
- ✅ Input validation for all fields
- ✅ Protection against unauthorized webhook calls

### Signature Validation
The webhook now validates that requests are genuinely from Twilio by checking the `X-Twilio-Signature` header.

**How it works:**
1. Twilio signs each webhook request with your Auth Token
2. Our endpoint validates the signature before processing
3. Invalid or missing signatures are rejected

**To enable:**
```env
TWILIO_AUTH_TOKEN=your_auth_token_here
NEXT_PUBLIC_APP_URL=https://yourdomain.com
```

**If not configured:**
- A warning is logged: `⚠️ Twilio signature validation skipped`
- Requests are still processed (suitable for development/sandbox)
- **Not recommended for production**

### Additional Security Recommendations
1. **Rate Limiting**: Implement rate limiting to prevent abuse
2. **HTTPS Only**: Twilio requires HTTPS for webhooks (already enforced)
3. **Monitor Logs**: Watch for unusual patterns or repeated failed validations
4. **Rotate Tokens**: Periodically rotate your Twilio Auth Token

## Troubleshooting

### User not found
- Ensure WhatsApp number is linked in Settings
- Check that number format matches Twilio format: `whatsapp:+[country code][number]`
- Run database migration if `whatsapp_phone` column doesn't exist

### Webhook not receiving messages
- Verify ngrok is running (local development)
- Check Twilio webhook URL is correct
- Ensure your Next.js app is running
- Check Twilio debugger for errors: https://www.twilio.com/console/debugger

### Book not found
- Use exact book name (case-insensitive but spelling must match)
- Check available books in the app

### Invalid format errors
- Follow the exact format with pipe separators: `|`
- Ensure at least 4 fields: book, type, amount, category
- Check for typos in "income" or "expense"

## Code Structure

```
app/
  api/
    whatsapp/
      route.ts          # Main webhook handler

lib/
  auth.ts              # getUserByPhone, linkWhatsAppPhone functions
  store.ts             # createEntry, getBooks, getCategories functions

migrations/
  002_add_whatsapp_phone.sql  # Database schema update

app/settings/
  page.tsx             # WhatsApp linking UI
```

## Future Enhancements

Potential improvements for the WhatsApp integration:

1. **Multiple Number Support**: Allow multiple WhatsApp numbers per account
2. **Custom Shortcuts**: User-defined shortcuts for common entries
3. **Entry History**: Query past entries via WhatsApp
4. **Balance Inquiry**: Check book balance via WhatsApp
5. **Date Support**: Specify custom dates for entries
6. **Bulk Entries**: Support for multiple entries in one message
7. **Attachments**: Support for receipt images (using Twilio MMS)
8. **Confirmation Mode**: Optional confirmation before saving entries

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Twilio debugger logs
3. Check browser console for errors
4. Verify database migrations are applied

---

**Note**: This is a sandbox implementation. For production use with your own WhatsApp Business number, you'll need to:
1. Apply for WhatsApp Business API access
2. Get your number approved by WhatsApp
3. Update the documentation with your production number
