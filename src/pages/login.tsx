import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { supabase } from "@/lib/agents/db"

export function Login() {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [forgotPasswordMode, setForgotPasswordMode] = useState(false)
  const navigate = useNavigate()
  const { toast } = useToast()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      if (error) {
        throw error
      }

      if (data) {
        navigate("/")
      }
    } catch (error) {
      console.error('Error logging in:', error)
      toast({
        title: "Error",
        description: "Invalid email or password",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      })

      if (error) {
        throw error
      }

      toast({
        title: "Success",
        description: "Password reset email sent. Please check your inbox."
      })
      setForgotPasswordMode(false)
    } catch (error) {
      console.error('Error sending reset email:', error)
      toast({
        title: "Error",
        description: "Failed to send reset email. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex h-screen items-center justify-center">
      <Card className="w-[350px]">
        <CardHeader>
          <CardTitle>{forgotPasswordMode ? "Reset Password" : "Login"}</CardTitle>
          <CardDescription>
            {forgotPasswordMode 
              ? "Enter your email to receive a password reset link"
              : "Enter your credentials to access your account"
            }
          </CardDescription>
        </CardHeader>
        <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit}>
          <CardContent>
            <div className="grid w-full items-center gap-4">
              <div className="flex flex-col space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
              {!forgotPasswordMode && (
                <div className="flex flex-col space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              )}
            </div>
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button 
              type="submit" 
              className="w-full" 
              disabled={loading}
            >
              {forgotPasswordMode 
                ? (loading ? "Sending..." : "Send Reset Link")
                : (loading ? "Logging in..." : "Login")
              }
            </Button>
            <Button
              type="button"
              variant="link"
              className="w-full"
              onClick={() => setForgotPasswordMode(!forgotPasswordMode)}
            >
              {forgotPasswordMode ? "Back to Login" : "Forgot Password?"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
} 