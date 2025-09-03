"use client"
import { useState, useEffect, useCallback, useMemo } from 'react'
import { User } from '@supabase/supabase-js'
import { createClient } from '@/lib/supabase/client'
import { showErrorToast } from '@/lib/utils'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  const handleAuthStateChange = useCallback(async (event: string, session: any) => {
    try {
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error in auth state change:', error)
      const errorMessage = showErrorToast(error, 'Authentication state change error')
      console.error('Auth state change error:', errorMessage)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  const getInitialSession = useCallback(async () => {
    try {
      const supabase = createClient()
      const { data: { session } } = await supabase.auth.getSession()
      setUser(session?.user ?? null)
    } catch (error) {
      console.error('Error getting initial session:', error)
      const errorMessage = showErrorToast(error, 'Failed to get authentication session')
      console.error('Session error:', errorMessage)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    getInitialSession()

    // Listen for auth changes
    const supabase = createClient()
    const { data: { subscription } } = supabase.auth.onAuthStateChange(handleAuthStateChange)

    return () => subscription.unsubscribe()
  }, [getInitialSession, handleAuthStateChange])

  // Memoize the return value to prevent unnecessary re-renders
  const authValue = useMemo(() => ({ user, loading }), [user, loading])

  return authValue
}

