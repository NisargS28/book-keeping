# Custom User Authentication Setup Guide

## Overview

The application now uses a **custom user authentication system** with a dedicated `users` table in Supabase instead of Supabase Auth. This gives you full control over user data and authentication.

## Database Changes

### 1. Run the Complete SQL Migration

Open your Supabase Dashboard → SQL Editor and run the **entire** [db.sql](migrations/db.sql) file.

This will:
- ✅ Create `users` table with name, email, password fields
- ✅ Create `books`, `categories`, `entries` tables
- ✅ Set up all foreign key relationships
- ✅ Configure Row Level Security (RLS) policies
- ✅ Create necessary indexes

### 2. Key Schema Details

**users table:**
```sql
CREATE TABLE public.users (
  id uuid PRIMARY KEY (auto-generated),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  password text NOT NULL (SHA-256 hashed),
  display_name text,
  profile_image text,
  created_at timestamp,
  updated_at timestamp
);
```

**Foreign Keys:**
- `books.user_id` → `users.id`
- All other tables reference books (cascade delete)

## How It Works

### Authentication Flow

1. **Sign Up**
   - User enters name, email, password
   - Password is hashed using SHA-256
   - New user inserted into `users` table
   - Session stored in localStorage (7 days)
   - User redirected to dashboard

2. **Login**
   - User enters email, password
   - Password hashed and matched against database
   - Session created if credentials valid
   - User redirected to dashboard

3. **Session Management**
   - Stored in `localStorage` as JSON
   - Contains: userId, email, expiresAt
   - Expires after 7 days
   - Cleared on logout

4. **Profile Updates**
   - Directly updates `users` table
   - No separate profile table needed

### Security Features

✅ **Password Hashing**: SHA-256 hashing for all passwords  
✅ **Row Level Security**: Users can only access their own data  
✅ **Session Expiry**: 7-day auto-expiration  
✅ **Email Uniqueness**: Enforced at database level  
✅ **Cascade Delete**: All user data deleted when user deleted  

## RLS Policies

The RLS policies use `current_setting('app.current_user_id')` to identify the current user:

- **Users**: Can view/update own profile, anyone can signup
- **Books**: Users can only CRUD their own books
- **Categories**: Users can only CRUD categories in their books
- **Entries**: Users can only CRUD entries in their books

## Testing

### Test Signup
1. Go to Sign Up page
2. Enter:
   - Name: `John Doe`
   - Email: `test@example.com`
   - Password: `password123`
3. Click Sign Up
4. Should redirect to Dashboard ✅

### Test Login
1. Go to Login page
2. Enter email and password
3. Should redirect to Dashboard ✅

### Test Session
1. Login successfully
2. Refresh the page
3. Should remain logged in ✅
4. Check localStorage → `cashbook_user_session`

### Test Logout
1. Click user dropdown → Sign Out
2. Session cleared
3. Redirected to login ✅

## Code Changes Summary

### Files Modified

1. **migrations/db.sql**
   - Added `users` table
   - Changed foreign keys from `auth.users(id)` to `public.users(id)`
   - Updated all RLS policies to use custom user ID

2. **lib/auth.ts** (Complete Rewrite)
   - Removed Supabase Auth calls
   - Added localStorage session management
   - Added SHA-256 password hashing
   - Custom signup/login logic

3. **app/settings/page.tsx**
   - Removed user_profiles table warning
   - Simplified profile management

## Migration from Supabase Auth

If you were using Supabase Auth before:

1. **Data Migration**: Users need to re-signup
2. **Session Reset**: All existing sessions will be invalid
3. **Password Reset**: Not yet implemented (TODO)

## Important Notes

### ⚠️ Security Considerations

1. **Client-Side Hashing**: Password hashing is done client-side. For production, consider server-side hashing with bcrypt.
2. **HTTPS Required**: Always use HTTPS in production to protect password transmission.
3. **Password Reset**: Currently not implemented - add this before production.

### Features

✅ **Implemented:**
- User signup with name, email, password
- User login with email/password
- Session management (7 days)
- Profile updates (display name, image)
- Logout functionality
- RLS for data isolation

❌ **Not Implemented (TODO):**
- Password reset via email
- Email verification
- Two-factor authentication
- Remember me functionality
- Password strength validation

## Troubleshooting

### "Email already exists" error
- The email is already in the database
- Try a different email or login instead

### "Invalid email or password"
- Check credentials are correct
- Password is case-sensitive

### User gets logged out automatically
- Session expired (7 days)
- localStorage was cleared
- User logged out manually

### RLS policy errors
- Make sure you ran the complete db.sql
- Check Supabase logs for details
- Verify user_id exists in users table

## Next Steps

1. ✅ Run [db.sql](migrations/db.sql) in Supabase
2. ✅ Test signup flow
3. ✅ Test login flow
4. ✅ Test creating books, categories, entries
5. ✅ Verify RLS is working (users can't see other's data)
6. 🔧 Implement password reset (future)
7. 🔧 Add email verification (future)

---

**Status**: Ready to use! Run the SQL migration and start testing.
