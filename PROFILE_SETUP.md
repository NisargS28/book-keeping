# Database Setup Instructions for User Profiles

## Creating the user_profiles Table in Supabase

To enable the new profile editing functionality, you need to create the `user_profiles` table in your Supabase database. Follow these steps:

### Option 1: Using Supabase SQL Editor

1. Go to your Supabase project dashboard
2. Navigate to **SQL Editor** in the left sidebar
3. Click **New Query**
4. Copy and paste the SQL code below:

```sql
-- Create user_profiles table
CREATE TABLE IF NOT EXISTS public.user_profiles (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name varchar(255) NOT NULL,
  profile_image text,
  bio text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - users can only view and update their own profile
CREATE POLICY "Users can view their own profile" 
  ON public.user_profiles 
  FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles 
  FOR UPDATE 
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);
```

5. Click **Run** to execute the query

### Option 2: Using Supabase Dashboard Table Editor

1. Go to **Tables** in the left sidebar
2. Click **Create a new table**
3. Name it `user_profiles`
4. Add the following columns:
   - `id`: uuid, Primary Key, Default: gen_random_uuid()
   - `user_id`: uuid, NOT NULL, UNIQUE, Foreign Key to auth.users(id)
   - `display_name`: varchar(255), NOT NULL
   - `profile_image`: text, nullable
   - `bio`: text, nullable
   - `created_at`: timestamptz, Default: now()
   - `updated_at`: timestamptz, Default: now()

5. Enable Row Level Security (RLS):
   - Click on the table
   - Go to **RLS** tab
   - Toggle on Row Level Security
   - Add the three policies shown in the SQL code above

## What's New

### Features Added:
- **Profile Editing**: Users can edit their display name and upload a profile image URL
- **Display Name in Header**: The app header now shows the user's display name instead of email
- **Profile Tab in Settings**: A dedicated profile tab in settings for managing user information
- **Display Name Capture**: Display name is captured during signup and saved to the database

### Updated Files:
- `lib/types.ts`: Updated User interface with displayName and profileImage
- `lib/auth.ts`: Added profile-related functions and updated getCurrentUser
- `app/signup/page.tsx`: Updated to pass display name during signup
- `app/settings/page.tsx`: Added profile editing section
- `components/app-header.tsx`: Updated to show display name instead of email

### New Functions in lib/auth.ts:
- `updateUserProfile(userId, updates)`: Update user profile information
- `getUserProfile(userId)`: Fetch user profile data

## Testing the Feature

1. Sign up with a new account - provide a display name
2. Go to Settings and click on the **Profile** tab
3. Click **Edit Profile** to modify your display name or add a profile image URL
4. The display name will appear in the top-right navbar
5. Logout and login to verify persistence

## Migration for Existing Users

If you have existing users without profiles, they will still work. The app will:
- Use their email as the default display name
- Allow them to set their display name in the Settings > Profile tab
- Create a profile entry when they update their profile
