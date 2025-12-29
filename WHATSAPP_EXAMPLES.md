
# WhatsApp Message Examples

## Message Format

```
BookName, type, amount, category, payment mode, description
         ↓      ↓      ↓         ↓            ↓             ↓
     Required  Req   Req      Req       Optional     Optional
```

---

## ✅ Valid Examples

### Example 1: Full Format (All Fields)
**Message:**
```
Personal, income, 5000, Salary, Bank, Monthly salary for December
```

**What happens:**
- ✅ Book: Personal
- ✅ Type: Income (+)
- ✅ Amount: ₹5000.00
- ✅ Category: Salary
- ✅ Payment: Bank
- ✅ Description: Monthly salary for December

---

### Example 2: Expense with Cash
**Message:**
```
Business, expense, 250, Food, Cash, Team lunch at restaurant
```

**What happens:**
- ✅ Book: Business
- ✅ Type: Expense (-)
- ✅ Amount: ₹250.00
- ✅ Category: Food
- ✅ Payment: Cash
- ✅ Description: Team lunch at restaurant

---

### Example 3: Minimal Format (No Payment Mode/Description)
**Message:**
```
Home, expense, 1500, Rent
```

**What happens:**
- ✅ Book: Home
- ✅ Type: Expense (-)
- ✅ Amount: ₹1500.00
- ✅ Category: Rent
- ✅ Payment: null
- ✅ Description: Rent (uses category name)

---

### Example 4: New Category (Auto-Created)
**Message:**
```
Personal, expense, 199, Netflix Subscription, Card, Monthly streaming
```

**What happens:**
- ✅ Book: Personal
- ✅ Type: Expense (-)
- ✅ Amount: ₹199.00
- ✅ Category: Netflix Subscription (created with random color)
- ✅ Payment: Card
- ✅ Description: Monthly streaming

---

### Example 5: Decimal Amount
**Message:**
```
Freelance, income, 12750.50, Client Payment, UPI, Project XYZ
```

**What happens:**
- ✅ Book: Freelance
- ✅ Type: Income (+)
- ✅ Amount: ₹12750.50
- ✅ Category: Client Payment
- ✅ Payment: UPI
- ✅ Description: Project XYZ

---

### Example 6: Payment Mode Only (No Custom Description)
**Message:**
```
Personal, expense, 500, Groceries, Cash
```

**What happens:**
- ✅ Book: Personal
- ✅ Type: Expense (-)
- ✅ Amount: ₹500.00
- ✅ Category: Groceries
- ✅ Payment: Cash
- ✅ Description: Groceries (uses category name)

---

## ❌ Invalid Examples

### Error 1: Missing Fields
**Message:**
```
Personal, income, 5000
```

**Response:**
```
❌ Invalid Format

📋 Please use this format:
BookName, income/expense, amount, category, payment mode, description

📝 Examples:
• Personal, income, 5000, Salary, Bank, Monthly salary
```

---

### Error 2: Invalid Type
**Message:**
```
Personal, credit, 5000, Salary, Bank, Monthly salary
```

**Response:**
```
❌ Invalid Type

Type must be either "income" or "expense"

📝 Example:
Personal, income, 5000, Salary
```

---

### Error 3: Invalid Amount
**Message:**
```
Personal, income, -500, Salary, Bank, Monthly salary
```

**Response:**
```
❌ Invalid Amount

Amount must be a positive number

📝 Example:
Personal, income, 500, Salary
```

---

### Error 4: Book Not Found
**Message:**
```
MyWallet, income, 5000, Salary, Bank, Monthly salary
```

**Response:**
```
❌ Book Not Found

"MyWallet" doesn't exist.

📚 Your books:
• Personal
• Business
• Home

💡 Use the exact book name
```

---

### Error 5: User Not Registered
**Message:**
```
Personal, income, 5000, Salary, Bank, Monthly salary
```

**Response:**
```
❌ Not Registered

Your WhatsApp number is not linked to any account.

📝 Please:
1. Log in to the app
2. Go to Settings
3. Link your WhatsApp number
```

---

## 💡 Tips & Tricks

### Tip 1: Spaces Don't Matter
These are all the same:
```
Personal|income|5000|Salary
Personal, income, 5000, Salary
Personal  |  income  |  5000  |  Salary
```

### Tip 2: Case Insensitive Book Names
These both work if your book is named "Personal":
```
Personal, income, 5000, Salary
personal, income, 5000, Salary
PERSONAL, income, 5000, Salary
```

### Tip 3: Category Names Can Be Anything
```
Personal, expense, 50, Coffee ☕
Personal, income, 1000, Side Project #2
Personal, expense, 299, Gym Membership (Annual)
```

### Tip 4: Payment Modes Examples
```
Cash
Bank
UPI
Card
Credit Card
Debit Card
Paytm
Google Pay
PhonePe
Net Banking
```

---

## 📝 Common Use Cases

### Daily Expenses
```
Personal, expense, 80, Transport, Cash, Auto fare
Personal, expense, 120, Food, UPI, Lunch
Personal, expense, 50, Snacks, Cash, Evening tea
```

### Monthly Bills
```
Home, expense, 2000, Electricity, Bank, December bill
Home, expense, 500, Internet, Bank, Fiber connection
Home, expense, 15000, Rent, Bank, January rent
```

### Income Tracking
```
Personal, income, 50000, Salary, Bank, Monthly salary
Freelance, income, 25000, Project A, UPI, Client payment
Freelance, income, 15000, Consulting, Bank, Advisory fee
```

### Business Expenses
```
Business, expense, 500, Office Supplies, Card, Stationery
Business, expense, 1200, Internet, Bank, Office WiFi
Business, expense, 3000, Fuel, Card, Vehicle expenses
```

---

## 🎯 Quick Reference

**Required Fields (4 minimum):**
1. Book Name
2. Type (income/expense)
3. Amount
4. Category

**Optional Fields:**
5. Payment Mode
6. Description

**Separator:** Pipe character `|`

**Format:**
```
Field1, Field2, Field3, Field4, Field5, Field6
```

---

## 📱 How to Send

1. Open WhatsApp
2. Message to: **+14155238886**
3. Type your message in the format above
4. Send
5. Wait for confirmation ✅

---

## ✅ Success Response Example

```
✅ Entry Added!

💰 Income: +₹5000.00
📚 Book: Personal
🏷️ Category: Salary
💳 Payment: Bank
📝 Description: Monthly salary

💼 New Balance: ₹25000.00
```

---

**Need help?** See [WHATSAPP_INTEGRATION.md](./WHATSAPP_INTEGRATION.md) for full documentation.
