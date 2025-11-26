'use client'

import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { supabase } from "@/lib/supabase"
import { useRouter } from "next/navigation"
import { useEffect } from "react"

const queryClient = new QueryClient()

interface ProvidersProps {
  children: React.ReactNode
  initialSession?: any
}

function SupabaseProvider({ children, initialSession }: { children: React.ReactNode, initialSession?: any }) {
  const router = useRouter()

  useEffect(() => {
    if (initialSession) {
      supabase.auth.setSession(initialSession)
    }
  }, [initialSession])

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        router.push('/auth/login')
      }
    })
    return () => subscription.unsubscribe()
  }, [router])

  return <>{children}</>
}

export function Providers({ children, initialSession }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <SupabaseProvider initialSession={initialSession}>
        {children}
      </SupabaseProvider>
    </QueryClientProvider>
  )
}