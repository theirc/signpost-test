import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Login } from "@/pages/login"
import { ResetPassword } from "@/pages/reset-password"
import { AppLayout } from "@/components/app-layout"
import { Toaster } from "@/components/ui/toaster"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

