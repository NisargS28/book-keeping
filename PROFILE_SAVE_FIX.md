# Profile Save Issue - FIXED ✅

## Problem
Users were unable to save their display name because the `user_profiles` table either:
1. Doesn't exist in Supabase
2. Exists but the user doesn't have a profile row yet

## Solution Implemented

### 1. Smart Upsert in `updateUserProfile()`
Updated the function to:
- Check if profile exists first
- If it doesn't exist (error code PGRST116), **create** a new profile
- If it exists, **update** the existing profile

This handles both new and existing users gracefully.

### 2. Better Error Handling
- Added `profileError` state to show errors in the UI
- Error messages now appear in the edit profile dialog
- Helpful message guides users to create the table if it doesn't exist

### 3. Visual Warning Banner
- Added a warning banner in Settings when table doesn't exist
- Shows when user's display name matches email prefix (fallback behavior)
- Directs users to `PROFILE_SETUP.md` for SQL migration

### 4. Page Reload After Save
- Added `window.location.reload()` after successful profile update
- Ensures the navbar updates with new display name immediately

## Files Changed

### `/workspaces/book-keeping/lib/auth.ts`
- Updated `updateUserProfile()` to check if profile exists
- If not, creates a new profile (upsert behavior)
- Prevents "no rows found" error on update

### `/workspaces/book-keeping/app/settings/page.tsx`
- Added `profileError` state for error display
- Added `tableWarning` state to detect missing table
- Added error message in edit profile dialog
- Added warning banner at top of settings page
- Added page reload after successful save

## How It Works Now

### Scenario 1: Table Exists, Profile Exists
1. User clicks "Edit Profile"
2. Changes display name
3. Clicks "Save Changes"
4. `updateUserProfile()` updates existing row
5. Page reloads, navbar shows new name ✅

### Scenario 2: Table Exists, No Profile for User
1. User clicks "Edit Profile"
2. Changes display name
3. Clicks "Save Changes"
4. `updateUserProfile()` detects no profile (PGRST116 error)
5. Creates new profile row with display name
6. Page reloads, navbar shows new name ✅

### Scenario 3: Table Doesn't Exist
1. User sees red warning banner in Settings
2. Banner says: "Profile Table Not Found - run SQL from PROFILE_SETUP.md"
3. User clicks "Edit Profile"
4. Tries to save → error shown in dialog
5. Error message: "Failed to update profile. Please make sure the user_profiles table exists in Supabase."
6. User creates table using PROFILE_SETUP.md
7. Tries again → works! ✅

## Testing

To test the fix:

### With Table (Happy Path)
1. Create user_profiles table (see PROFILE_SETUP.md)
2. Go to Settings → Profile
3. Click "Edit Profile"
4. Change display name to "John Doe"
5. Click "Save Changes"
6. Page reloads
7. Navbar shows "John Doe" ✅

### Without Table (Error Handling)
1. Don't create table yet
2. Go to Settings → Profile
3. See red warning banner ✅
4. Click "Edit Profile"
5. Try to save
6. See error message in dialog ✅
7. Create table using SQL from PROFILE_SETUP.md
8. Try again → saves successfully ✅

## Database Setup Reminder

Run this SQL in Supabase to create the table:

```sql
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(255) NOT NULL,
  profile_image text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

## What's Fixed

✅ Profile updates now work even if profile doesn't exist (creates it)  
✅ Clear error messages shown to user  
✅ Warning banner when table doesn't exist  
✅ Page reloads to update navbar after save  
✅ Graceful fallback to email if no profile  
✅ Works for both new signups and existing users  

---

**Status**: Ready to use! Create the table and start editing profiles.
