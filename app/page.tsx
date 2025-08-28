import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { LinkDashboard } from "@/components/link-dashboard"

export default async function Page() {
  const supabase = await createClient()

  const { data, error } = await supabase.auth.getUser()
  if (error || !data?.user) {
    redirect('/auth')
  }

  return <LinkDashboard />
}
