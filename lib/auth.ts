"use client"

// TODO: Replace with Supabase authentication

import { supabase } from './supabase'
import { User } from './types'

export const getCurrentUser = async (): Promise<User | null> => {
  try {
    const {
      data: { user },
    } = await supabase.auth.getUser()

    if (!user) return null

    // Fetch user profile
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('user_id', user.id)
      .single()

    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error fetching profile:', profileError)
    }

    return {
      id: user.id,
      email: user.email || '',
      displayName: profile?.display_name || user.email?.split('@')[0] || 'User',
      profileImage: profile?.profile_image || undefined,
      createdAt: user.created_at || new Date().toISOString(),
    }
  } catch (error) {
    console.error('Error getting current user:', error)
    return null
  }
}

export const signUp = async (email: string, password: string, displayName: string) => {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })

  if (error) throw error

  // Create user profile
  if (data.user) {
    const { error: profileError } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: data.user.id,
          display_name: displayName,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])

    if (profileError) {
      console.error('Error creating profile:', profileError)
    }
  }

  return data
}

// Backwards-compatible alias for existing imports
export { signUp as signup }

export const login = async (email: string, password: string) => {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) throw error
  return data
}

export const logout = async () => {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export const resetPassword = async (email: string) => {
  const { error } = await supabase.auth.resetPasswordForEmail(email)
  if (error) throw error
}

export const updateUserProfile = async (userId: string, updates: { displayName?: string; profileImage?: string; bio?: string }) => {
  // First check if profile exists
  const { data: existingProfile, error: fetchError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  const updateData: any = {}
  if (updates.displayName !== undefined) updateData.display_name = updates.displayName
  if (updates.profileImage !== undefined) updateData.profile_image = updates.profileImage
  if (updates.bio !== undefined) updateData.bio = updates.bio
  updateData.updated_at = new Date().toISOString()

  // If profile doesn't exist, create it (upsert)
  if (fetchError && fetchError.code === 'PGRST116') {
    // Profile doesn't exist, create it
    const { data, error } = await supabase
      .from('user_profiles')
      .insert([
        {
          user_id: userId,
          display_name: updates.displayName || 'User',
          profile_image: updates.profileImage || null,
          bio: updates.bio || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ])
      .select()
      .single()

    if (error) throw error
    return data
  }

  // Profile exists, update it
  const { data, error } = await supabase
    .from('user_profiles')
    .update(updateData)
    .eq('user_id', userId)
    .select()
    .single()

  if (error) throw error
  return data
}

export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single()

  if (error) throw error
  return data
}
