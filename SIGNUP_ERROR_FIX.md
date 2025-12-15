# Fix Profile Creation Error During Signup

## Problem
When signing up, users see error: `Error creating profile: {}`

This happens because the RLS policy on `user_profiles` table doesn't allow unauthenticated inserts during signup.

## Solution

### Step 1: Fix the RLS Policy in Supabase

1. Open your Supabase Dashboard
2. Go to **SQL Editor**
3. Click **New Query**
4. Copy and paste the SQL below:

```sql
-- FIX RLS POLICY FOR SIGNUP
-- Drop the old INSERT policy
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.user_profiles;

-- Create new INSERT policy that allows both:
-- 1. Unauthenticated inserts during signup (auth.uid() IS NULL)
-- 2. Authenticated users inserting their own profile (auth.uid() = user_id)
CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (
    -- Allow if inserting own profile (after auth) OR allow for new signups (no auth yet)
    (auth.uid() = user_id) OR (auth.uid() IS NULL)
  );
```

5. Click **Run**

### Step 2: Test the Fix

1. Go to **Sign Up** page in your app
2. Fill in:
   - Full Name: `John Doe`
   - Email: `test@example.com`
   - Password: `password123`
3. Click **Sign Up**
4. You should be redirected to Dashboard without errors ✅

### Why This Works

**During Signup:**
- User is NOT authenticated yet
- `auth.uid()` returns `NULL`
- The policy allows: `(auth.uid() = user_id) OR (auth.uid() IS NULL)` → TRUE
- Profile is created successfully ✅

**After Login (Profile Update):**
- User IS authenticated
- `auth.uid()` returns the user's UUID
- The policy allows: `(auth.uid() = user_id) OR (auth.uid() IS NULL)` → TRUE
- User can update their own profile ✅

**Other Users Trying to Insert:**
- `auth.uid()` is different from `user_id`
- The policy rejects: both conditions are FALSE
- Insert is blocked ✅

## Alternative (If You Can't Modify RLS)

If RLS modification doesn't work, the app will gracefully handle it:
1. Signup still completes successfully
2. Profile creation fails silently
3. User sees warning in Settings > Profile
4. User can manually set display name in Settings
5. Profile is created on first profile update

## Console Output

After the fix, you should see in browser console:
```
✅ User profile created successfully
```

Instead of:
```
⚠️ Profile creation failed: {...}
```

---

**File to Run**: [FIX_RLS_POLICY.sql](FIX_RLS_POLICY.sql)
