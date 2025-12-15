# Quick Start - Profile Feature

## 🎯 One-Time Setup (5 minutes)

### Step 1: Create Database Table
1. Go to your Supabase Dashboard
2. Navigate to **SQL Editor**
3. Click **New Query**
4. Copy and run this:

```sql
CREATE TABLE public.user_profiles (
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
  ON public.user_profiles FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile" 
  ON public.user_profiles FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
  ON public.user_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
```

### Step 2: Start Your App
```bash
npm run dev
```

## 🧪 Testing

### Sign Up Flow
1. Go to **Sign Up** page
2. Enter:
   - Full Name: `John Doe`
   - Email: `john@example.com`
   - Password: `password123`
3. Click **Sign Up**
4. Verify top-right shows `John Doe` (not email)

### Edit Profile Flow
1. Click **John Doe** in top-right
2. Click **Edit Profile**
3. Change display name to `Jane Doe`
4. Click **Save Changes**
5. Verify navbar updates immediately

### Settings Profile Tab
1. Click **Settings** in sidebar
2. First tab is **Profile** (selected by default)
3. See profile card with:
   - Avatar (first letter)
   - Display name
   - Email
4. Click **Edit Profile** to modify

## 📱 User-Facing Changes

### Before
```
Top-right navbar: user@example.com
```

### After
```
Top-right navbar: John Doe
  Dropdown:
  • John Doe (disabled)
  • ─────────────
  • Edit Profile
  • ─────────────
  • Sign Out
```

### Settings Page
```
Before: General, Categories tabs
After:  Profile, General, Categories tabs (Profile is default)
```

## 🔧 What Was Changed

### Backend (lib/auth.ts)
- ✅ getCurrentUser() now fetches from user_profiles
- ✅ signUp() creates user_profiles entry with display name
- ✅ New updateUserProfile() function
- ✅ New getUserProfile() function

### Frontend
- ✅ app-header shows displayName instead of email
- ✅ app-header has "Edit Profile" menu option
- ✅ Settings has new Profile tab with edit dialog
- ✅ signup page passes display name to signup()

### Data Model
- ✅ User type updated with displayName, profileImage
- ✅ New UserProfile type

## ✅ Verification

Run the app and check:
- [ ] New users show display name in navbar (not email)
- [ ] Edit Profile button in navbar works
- [ ] Settings > Profile tab exists and is default
- [ ] Can edit display name and image URL
- [ ] Changes persist after logout/login
- [ ] Existing pages (books, ledger, dashboard) work unchanged

## 🆘 Troubleshooting

### "PGRST116" error or 404 on profile fetch
- **Fix**: Table user_profiles doesn't exist yet
- **Solution**: Run the SQL from Step 1 above

### Display name shows email instead
- **Expected**: If user_profiles table missing
- **Fix**: Create table and try signing up again

### "Edit Profile" button does nothing
- **Fix**: Check browser console for errors
- **Common cause**: user_profiles table missing

## 📚 Full Documentation

For detailed information, see:
- `PROFILE_SETUP.md` - Complete setup guide
- `PROFILE_FEATURE_CHANGES.md` - All code changes
- `IMPLEMENTATION_SUMMARY.md` - Feature overview

## 🎉 Done!

Your app now has:
- ✅ User display names
- ✅ Profile management
- ✅ Profile editing in settings
- ✅ Display name in navbar
- ✅ Full Supabase backend integration
