import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LinkDashboard } from "@/components/link-dashboard"

// Force dynamic rendering since we use cookies and server-side auth
export const dynamic = 'force-dynamic'

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth')
  }

  return <LinkDashboard />
}
