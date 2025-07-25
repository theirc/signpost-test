import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom"
import { Login } from "@/pages/login"
import { ResetPassword } from "@/pages/reset-password"
import { AppLayout } from "@/components/app-layout"
import { Toaster } from "@/components/ui/toaster"
import { useEffect } from "react"
import { supabase } from "./lib/agents/db"
import { useQueryClient } from "@tanstack/react-query"

function AuthProvider({ children }: { children: React.ReactNode }) {
  const queryClient = useQueryClient()
  const location = useLocation()

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED') {
        queryClient.invalidateQueries({ queryKey: ['user'] })
      }
    })

    return () => {
      subscription.unsubscribe()
    }
  }, [queryClient, location.key])

  return <>{children}</>
}

export default function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route path="/*" element={<AppLayout />} />
        </Routes>
        <Toaster />
      </AuthProvider>
    </Router>
  )
}

