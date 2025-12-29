import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import twilio from 'twilio'

const MessagingResponse = twilio.twiml.MessagingResponse

// Create a server-side Supabase client that bypasses RLS
// Use service role key if available, otherwise use anon key with auth bypass
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    }
  }
)

/**
 * WhatsApp Webhook Handler
 * Expected message format: BookName | income/expense | amount | category | payment mode | description
 * Example: "Personal | income | 5000 | Salary | Bank | Monthly salary"
 * Example: "Business | expense | 200 | Food | Cash | Lunch"
 */
export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('🔔 Webhook called at:', new Date().toISOString())
  
  try {
    // Set timeout for webhook processing (Twilio recommends < 10 seconds)
    const TIMEOUT_MS = 8000
    
    const formData = await request.formData()
    const body = formData.get('Body') as string
    const from = formData.get('From') as string // Format: whatsapp:+1234567890

    console.log('📱 WhatsApp message received:', { 
      from, 
      body,
      timestamp: new Date().toISOString()
    })

    // Validate Twilio signature for security
    if (process.env.TWILIO_AUTH_TOKEN && process.env.NEXT_PUBLIC_APP_URL) {
      const twilioSignature = request.headers.get('x-twilio-signature')
      
      if (!twilioSignature) {
        console.error('❌ Missing Twilio signature')
        return createTwiMLResponse('Unauthorized request: Missing signature')
      }

      const url = process.env.NEXT_PUBLIC_APP_URL + '/api/whatsapp'
      const params: Record<string, string> = {}
      
      // Convert FormData to plain object for validation
      formData.forEach((value, key) => {
        params[key] = value.toString()
      })

      const isValid = twilio.validateRequest(
        process.env.TWILIO_AUTH_TOKEN,
        twilioSignature,
        url,
        params
      )

      if (!isValid) {
        console.error('❌ Invalid Twilio signature')
        return createTwiMLResponse('Unauthorized request: Invalid signature')
      }

      console.log('✅ Twilio signature validated')
    } else {
      console.warn('⚠️ Twilio signature validation skipped (missing env vars)')
    }

    // Find user by WhatsApp phone number
    // Twilio sends: whatsapp:+1234567890
    // We store: +1234567890 (without prefix)
    const phoneNumber = from.replace('whatsapp:', '')
    console.log('🔍 Looking up user with phone:', phoneNumber, '(original:', from, ')')
    
    const { data: profile, error: profileError } = await supabaseAdmin
      .from('user_profiles')
      .select('id')
      .eq('whatsapp_phone', phoneNumber)
      .single()

    console.log('🔎 Query result:', { profile, profileError })

    if (profileError || !profile) {
      console.log('❌ User not found for phone:', phoneNumber)
      return createTwiMLResponse(
        '❌ *Not Registered*\n\n' +
        'Your WhatsApp number is not linked to any account.\n\n' +
        '📝 Please:\n' +
        '1. Log in to the app\n' +
        '2. Go to Settings\n' +
        '3. Link your WhatsApp number'
      )
    }

    // Parse the message
    // Expected format: BookName, income/expense, amount, category, payment mode, description
    const parts = body.split(',').map(p => p.trim())
    
    if (parts.length < 4) {
      return createTwiMLResponse(
        '❌ *Invalid Format*\n\n' +
        '📋 Please use this format:\n' +
        '*BookName, income/expense, amount, category, payment mode, description*\n\n' +
        '📝 Examples:\n' +
        '• Personal, income, 5000, Salary, Bank, Monthly salary\n' +
        '• Business, expense, 200, Food, Cash, Lunch\n' +
        '• Home, expense, 1500, Rent, UPI, January rent\n\n' +
        '💡 Payment Modes:\n' +
        '• Cash, UPI, Card, Bank (transfer), Other\n\n' +
        '💡 Tips:\n' +
        '• Payment mode is optional\n' +
        '• Description is optional\n' +
        '• Minimum: BookName, type, amount, category'
      )
    }

    const bookName = parts[0]
    const type = parts[1].toLowerCase()
    const amount = parseFloat(parts[2])
    const categoryName = parts[3]
    
    // Normalize payment mode to match database constraint
    // Allowed values: cash, upi, card, bank_transfer, other
    let paymentMode = parts[4] ? parts[4].trim().toLowerCase() : null
    if (paymentMode) {
      // Map common variations
      const paymentModeMap: Record<string, string> = {
        'bank': 'bank_transfer',
        'banktransfer': 'bank_transfer',
        'bank transfer': 'bank_transfer',
        'neft': 'bank_transfer',
        'imps': 'bank_transfer',
        'rtgs': 'bank_transfer',
        'credit card': 'card',
        'debit card': 'card',
        'creditcard': 'card',
        'debitcard': 'card',
      }
      paymentMode = paymentModeMap[paymentMode] || paymentMode
      
      // Validate against allowed values
      const allowedModes = ['cash', 'upi', 'card', 'bank_transfer', 'other']
      if (!allowedModes.includes(paymentMode)) {
        paymentMode = 'other' // Default to 'other' if not recognized
      }
    }
    
    const description = parts[5] || categoryName

    // Validate type
    if (type !== 'income' && type !== 'expense') {
      return createTwiMLResponse(
        '❌ *Invalid Type*\n\n' +
        'Type must be either "income" or "expense"\n\n' +
        '📝 Example:\n' +
        `${bookName}, *income*, ${amount}, ${categoryName}`
      )
    }

    // Validate amount
    if (isNaN(amount) || amount <= 0) {
      return createTwiMLResponse(
        '❌ *Invalid Amount*\n\n' +
        'Amount must be a positive number\n\n' +
        '📝 Example:\n' +
        `${bookName}, ${type}, *500*, ${categoryName}`
      )
    }

    // Get user's books
    const { data: books, error: booksError } = await supabaseAdmin
      .from('books')
      .select('*')
      .eq('user_id', profile.id)
      .order('created_at', { ascending: false })
    
    if (booksError || !books || books.length === 0) {
      return createTwiMLResponse(
        '❌ *No Books Found*\n\n' +
        'You don\'t have any books yet.\n\n' +
        '📝 Please create a book in the app first.'
      )
    }

    // Find the book (case-insensitive)
    const book = books.find(b => b.name.toLowerCase() === bookName.toLowerCase())
    
    if (!book) {
      const bookList = books.map(b => `• ${b.name}`).join('\n')
      return createTwiMLResponse(
        `❌ *Book Not Found*\n\n` +
        `"${bookName}" doesn't exist.\n\n` +
        `📚 Your books:\n${bookList}\n\n` +
        `💡 Use the exact book name`
      )
    }

    // Get or create category
    const { data: categories } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('book_id', book.id)
      .order('name', { ascending: true })
    
    let category = categories?.find(c => c.name.toLowerCase() === categoryName.toLowerCase())

    if (!category) {
      // Create new category with a random color
      const colors = ['#ef4444', '#f97316', '#f59e0b', '#10b981', '#3b82f6', '#6366f1', '#8b5cf6', '#ec4899']
      const randomColor = colors[Math.floor(Math.random() * colors.length)]
      
      const { data: newCategory } = await supabaseAdmin
        .from('categories')
        .insert([{ 
          book_id: book.id, 
          name: categoryName, 
          color: randomColor 
        }])
        .select()
        .single()
      
      category = newCategory
      console.log('✨ Created new category:', categoryName)
    }

    // Create the entry
    const { data: entry, error: entryError } = await supabaseAdmin
      .from('entries')
      .insert([{
        book_id: book.id,
        category_id: category!.id,
        description: description,
        amount: amount,
        type: type,
        payment_mode: paymentMode || null, // Use null if no payment mode provided
        date: new Date().toISOString().split('T')[0], // Today's date in YYYY-MM-DD format
      }])
      .select()
      .single()

    if (entryError || !entry) {
      console.error('Error creating entry:', entryError)
      
      // Log more details for debugging
      console.error('Entry data attempted:', {
        book_id: book.id,
        category_id: category!.id,
        type,
        amount,
        payment_mode: paymentMode || null,
      })
      
      return createTwiMLResponse(
        '❌ *Error Creating Entry*\n\n' +
        'Failed to save the entry. Please try again.\n\n' +
        (entryError?.message ? `Error: ${entryError.message}` : '')
      )
    }

    console.log('✅ Entry created:', entry.id)

    // Calculate new balance
    const { data: allEntries } = await supabaseAdmin
      .from('entries')
      .select('type, amount')
      .eq('book_id', book.id)
    
    const balance = (allEntries || []).reduce((sum, e) => {
      return sum + (e.type === 'income' ? e.amount : -e.amount)
    }, 0)

    // Send success confirmation
    const icon = type === 'income' ? '💰' : '💸'
    const sign = type === 'income' ? '+' : '-'
    
    const responseMessage = `✅ *Entry Added!*\n\n` +
      `${icon} *${type.charAt(0).toUpperCase() + type.slice(1)}*: ${sign}₹${amount.toFixed(2)}\n` +
      `📚 Book: ${book.name}\n` +
      `🏷️ Category: ${category.name}\n` +
      (paymentMode ? `💳 Payment: ${paymentMode}\n` : '') +
      `📝 Description: ${description}\n\n` +
      `💼 New Balance: ₹${balance.toFixed(2)}`
    
    const elapsedTime = Date.now() - startTime
    console.log(`✅ Success response sent in ${elapsedTime}ms`)
    
    return createTwiMLResponse(responseMessage)

  } catch (error: any) {
    const elapsedTime = Date.now() - startTime
    console.error(`❌ Error processing WhatsApp message (${elapsedTime}ms):`, error)
    console.error('Error stack:', error.stack)
    
    // Always return 200 with error message in TwiML
    // Never return 4xx or 5xx to Twilio
    return createTwiMLResponse(
      '❌ *Error*\n\n' +
      'Something went wrong. Please try again.\n\n' +
      'If this persists, contact support.'
    )
  } finally {
    const totalTime = Date.now() - startTime
    console.log(`⏱️ Total webhook processing time: ${totalTime}ms`)
    
    if (totalTime > 5000) {
      console.warn(`⚠️ WARNING: Webhook took ${totalTime}ms - should be < 5000ms`)
    }
  }
}

/**
 * Helper function to create TwiML response
 * Always returns 200 status to prevent Twilio errors
 */
function createTwiMLResponse(message: string): NextResponse {
  const twiml = new MessagingResponse()
  twiml.message(message)
  
  const twimlString = twiml.toString()
  console.log('📤 Sending TwiML response (length:', twimlString.length, 'bytes)')
  
  return new NextResponse(twimlString, {
    status: 200,
    headers: {
      'Content-Type': 'text/xml; charset=utf-8',
      'Cache-Control': 'no-cache, no-store, must-revalidate',
    },
  })
}

/**
 * GET handler to verify webhook is working
 */
export async function GET() {
  console.log('🔍 GET request to webhook endpoint')
  return NextResponse.json({
    status: 'ok',
    message: 'WhatsApp webhook endpoint is active',
    timestamp: new Date().toISOString(),
    env: {
      hasAuthToken: !!process.env.TWILIO_AUTH_TOKEN,
      hasAppUrl: !!process.env.NEXT_PUBLIC_APP_URL,
      signatureValidation: !!(process.env.TWILIO_AUTH_TOKEN && process.env.NEXT_PUBLIC_APP_URL)
    }
  })
}
