import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { Login } from "@/pages/login"
import { AppLayout } from "@/components/app-layout"
import { Toaster } from "@/components/ui/toaster"

export default function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/*" element={<AppLayout />} />
      </Routes>
      <Toaster />
    </Router>
  )
}

