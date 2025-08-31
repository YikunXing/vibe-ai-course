import { createClient } from '@/lib/supabase/client'

interface GoogleSignInResponse {
  credential: string
}

export async function handleSignInWithGoogle(response: GoogleSignInResponse) {
  const supabase = createClient()
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: 'google',
    token: response.credential,
  })
  
  return { data, error }
}

// Make it available on the global scope for Google Sign-In
declare global {
  interface Window {
    handleSignInWithGoogle: typeof handleSignInWithGoogle
  }
}

if (typeof window !== 'undefined') {
  window.handleSignInWithGoogle = handleSignInWithGoogle
}
