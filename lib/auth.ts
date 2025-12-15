'use client'

import { supabase } from '@/lib/supabase'

export interface User {
  id: string
  email: string
  displayName?: string
  profileImage?: string
  createdAt: string
}

/**
 * Sign up a new user with Supabase Auth
 */
export async function signUp(
  email: string,
  password: string,
  displayName: string
): Promise<{ user: User | null; error?: any }> {
  try {
    // Sign up with Supabase Auth and pass display name in metadata
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name: displayName,
          display_name: displayName,
        },
      },
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user returned from signup')
    }

    // Wait a bit for the trigger to create the profile
    await new Promise(resolve => setTimeout(resolve, 500))

    // Get the created profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        displayName: profile?.display_name || displayName,
        profileImage: profile?.profile_image,
        createdAt: authData.user.created_at,
      },
    }
  } catch (error: any) {
    console.error('❌ Signup failed:', error)
    return { user: null, error }
  }
}

/**
 * Log in an existing user with Supabase Auth
 */
export async function login(
  email: string,
  password: string
): Promise<{ user: User | null; error?: any }> {
  try {
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    })

    if (authError) {
      throw authError
    }

    if (!authData.user) {
      throw new Error('No user returned from login')
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single()

    return {
      user: {
        id: authData.user.id,
        email: authData.user.email!,
        displayName: profile?.display_name,
        profileImage: profile?.profile_image,
        createdAt: authData.user.created_at,
      },
    }
  } catch (error: any) {
    console.error('❌ Login failed:', error)
    return { user: null, error }
  }
}

/**
 * Log out the current user
 */
export async function logout(): Promise<void> {
  await supabase.auth.signOut()
}

/**
 * Get the current logged-in user
 */
export async function getCurrentUser(): Promise<User | null> {
  try {
    const { data: { user: authUser }, error: authError } = await supabase.auth.getUser()

    if (authError || !authUser) {
      return null
    }

    // Get user profile
    const { data: profile } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', authUser.id)
      .single()

    return {
      id: authUser.id,
      email: authUser.email!,
      displayName: profile?.display_name,
      profileImage: profile?.profile_image,
      createdAt: authUser.created_at,
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

/**
 * Update user profile
 */
export async function updateUserProfile(
  userId: string,
  updates: {
    displayName?: string
    profileImage?: string
  }
): Promise<{ error?: any }> {
  try {
    const { error } = await supabase
      .from('user_profiles')
      .update({
        display_name: updates.displayName,
        profile_image: updates.profileImage,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)

    if (error) {
      throw error
    }

    return {}
  } catch (error: any) {
    console.error('Error updating profile:', error)
    return { error }
  }
}

/**
 * Get user profile
 */
export async function getUserProfile(userId: string) {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', userId)
    .single()

  if (error) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data
}

// Backwards-compatible alias for existing imports
export { signUp as signup }
