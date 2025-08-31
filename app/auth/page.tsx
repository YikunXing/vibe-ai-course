"use client"

import type React from "react"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { toast } from "sonner"
import { createClient } from "@/lib/supabase/client"
import { useRouter } from "next/navigation"
import Script from "next/script"
import { showErrorToast } from "@/lib/utils"

export default function MagicLinkAuth() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)

  // Email validation regex
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  
  const signInWithEmail = async (email: string) => {
    const supabase = createClient()
    
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: email,
        options: {
          shouldCreateUser: true,
          emailRedirectTo: `${window.location.origin}/auth`,
          data: name ? { display_name: name} : {}
        },
      })

      return { error }
    } catch (err) {
      console.error('Supabase auth error:', err)
      const errorMessage = showErrorToast(err, 'Authentication error occurred')
      return { error: { message: errorMessage } }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    // Validate email using regex
    if (!emailRegex.test(email)) {
      toast.error("Invalid email format", {
        description: "Please enter a valid email address.",
      })
      return
    }

    setIsLoading(true)

    try {
      const { error } = await signInWithEmail(email)

      if (error) {
        toast.error("Failed to send magic link", {
          description: error.message || "Please try again later.",
        })
      } else {
        toast.success("Magic link sent!", {
          description: "Check your email for the login link.",
        })
        setIsSubmitted(true)
      }
    } catch {
      toast.error("An unexpected error occurred", {
        description: "Please try again later.",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const supabase = createClient()
  const router = useRouter()

  // This function needs to be available globally for Google's script to call
  const handleSignInWithGoogle = useCallback(async (response: { credential: string }) => {
    try {
      const { error } = await supabase.auth.signInWithIdToken({
        provider: 'google',
        token: response.credential,
      })
      if(error) {
        console.error('Google sign in error:', error)
        const errorMessage = showErrorToast(error, 'Failed to sign in with Google')
        toast.error("Google Sign In Failed", {
          description: errorMessage,
        })
      } else {
        router.push('/')
      }
    } catch (err) {
      console.error('Unexpected Google sign in error:', err)
      const errorMessage = showErrorToast(err, 'An unexpected error occurred during Google sign in')
      toast.error("Google Sign In Failed", {
        description: errorMessage,
      })
    }
  }, [supabase, router])

  useEffect(() => {
    // Make the function available globally for Google's script
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (window as any).handleSignInWithGoogle = handleSignInWithGoogle
  }, [handleSignInWithGoogle])

  if (isSubmitted) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#090909" }}>
        <Card className="w-full max-w-md" style={{ backgroundColor: "#090909", borderColor: "#2E2E2E" }}>
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <div
                className="w-16 h-16 mx-auto rounded-full flex items-center justify-center"
                style={{ backgroundColor: "#1F1F1F" }}
              >
                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 8l7.89 4.26a2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-white">Check your email</h2>
              <p className="text-sm" style={{ color: "#BCBCBC" }}>
                We&apos;ve sent a magic link to <span className="text-white">{email}</span>. Click the link in your email to
                sign in.
              </p>
              <Button
                variant="outline"
                onClick={() => setIsSubmitted(false)}
                className="w-full text-white border-[#2E2E2E] hover:bg-[#1F1F1F]"
                style={{ backgroundColor: "transparent" }}
              >
                Back to form
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ backgroundColor: "#090909" }}>
      <Card className="w-full max-w-md" style={{ backgroundColor: "#090909", borderColor: "#2E2E2E" }}>
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold text-white text-center">Welcome</CardTitle>
          <CardDescription className="text-center" style={{ color: "#BCBCBC" }}>
            Enter your details to get started
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-white">
                Name
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="text-white placeholder:text-[#BCBCBC] border-[#2E2E2E] focus:border-white bg-transparent"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="text-white placeholder:text-[#BCBCBC] border-[#2E2E2E] focus:border-white bg-transparent"
              />
            </div>
            <Button
              type="submit"
              className="w-full text-white hover:opacity-90 transition-opacity"
              style={{ backgroundColor: "#1F1F1F" }}
              disabled={isLoading}
            >
              {isLoading ? (
                <div className="flex items-center space-x-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  <span>Sending magic link...</span>
                </div>
              ) : (
                "Send magic link"
              )}
            </Button>

          </form>
          <div id="g_id_onload"
            data-client_id="687773297569-l13nnsmpec0cbdg426ce3b8h3hd8g1cp.apps.googleusercontent.com"
            data-context="signin"
            data-ux_mode="popup"
            data-callback="handleSignInWithGoogle"
            data-auto_prompt="false">
          </div>

          <div className="g_id_signin"
            data-type="standard"
            data-shape="rectangular"
            data-theme="outline"
            data-text="signin_with"
            data-size="large"
            data-logo_alignment="left">
          </div>
          <div className="mt-6 text-center">
            <p className="text-xs" style={{ color: "#BCBCBC" }}>
              By continuing, you agree to our terms of service and privacy policy.
            </p>
          </div>
        </CardContent>
      </Card>
      <Script
          src="https://accounts.google.com/gsi/client"
          strategy="lazyOnload"
        />
    </div>
  )
}
