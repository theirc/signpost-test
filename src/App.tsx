import { BrowserRouter, Routes, Route } from "react-router-dom"
import LoginPage from "@/pages/login"
import { ProtectedRoute } from "@/components/protected-route"
import { AppLayout } from "@/components/app-layout"

export function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/*"
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  )
}

