import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { ThreeDMarquee } from "@/components/ui/3d-marquee"
import { supabase } from "@/lib/agents/db"
import { HighlightText } from "@/components/ui/shadcn-io/highlight-text"

// Screenshot assets for 3D marquee background - moved outside component to prevent recreation
const screenshotAssets = [
  "/screenshot1.jpg",
  "/screenshot2.jpg",
  "/screenshot3.jpg",
  "/screenshot4.jpg",
  "/screenshot5.jpg",
  "/screenshot6.jpg",
  "/screenshot7.jpg",
  "/screenshot8.jpg",
  "/screenshot9.jpg",
  "/screenshot10.jpg",
  "/screenshot11.jpg",
  "/screenshot12.jpg",
  "/screenshot13.jpg",
  "/screenshot14.jpg",
  "/screenshot15.jpg",
  "/screenshot16.jpg",
  "/screenshot17.jpg",
  "/screenshot18.jpg",
  "/screenshot19.jpg",
]

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
        password,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Invalid email or password",
          variant: "destructive",
        })
      } else {
        navigate("/")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
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
        redirectTo: `${window.location.origin}/reset-password`,
      })

      if (error) {
        toast({
          title: "Error",
          description: "Failed to send reset email",
          variant: "destructive",
        })
      } else {
        toast({
          title: "Success",
          description: "Password reset email sent",
        })
        setForgotPasswordMode(false)
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "An unexpected error occurred",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="relative h-screen w-full overflow-hidden">
      {/* 3D Marquee Background */}
      <div className="absolute inset-0 z-0">
        <ThreeDMarquee 
          images={screenshotAssets} 
          className="h-full w-full rounded-none"
        />
      </div>
      
      {/* White Opaque Overlay Layer */}
      <div className="absolute inset-0 z-5 bg-white/20 pointer-events-none"></div>
      
      {/* Login Form Overlay */}
      <div className="relative z-10 flex h-full items-center justify-center">
        <Card className="w-[350px] bg-white/95 backdrop-blur-md border-2 border-gray-200/50 shadow-2xl shadow-black/40 transform hover:scale-[1.02] transition-all duration-300">
        <CardHeader>
          <div className="flex justify-center mb-4">
            <img 
              src="/signpost ai logo black@4x (1) (5).png" 
              alt="SignpostAI Logo" 
              className="h-12 w-auto"
            />
          </div>
          <CardTitle><HighlightText text="Login" className="text-2xl font-bold" /></CardTitle>
          <CardDescription>
            Enter your credentials to access your account
          </CardDescription>
        </CardHeader>
        <form onSubmit={forgotPasswordMode ? handleForgotPassword : handleSubmit}>
          <CardContent className="space-y-4">
            <div className="space-y-2">
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
              <div className="space-y-2">
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
          </CardContent>
          <CardFooter className="flex flex-col space-y-2">
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Logging in..." : forgotPasswordMode ? "Send Reset Email" : "Login"}
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
    </div>
  )
} 