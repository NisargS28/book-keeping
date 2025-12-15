-- FIX RLS POLICY FOR SIGNUP
-- Run this in Supabase SQL Editor to fix the INSERT policy
-- This allows profile creation during signup when user is not yet authenticated

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
