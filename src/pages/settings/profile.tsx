import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Eye, EyeOff } from "lucide-react"
import { supabase } from "@/lib/agents/db"
import { useUser } from "@/lib/hooks/useUser"

export function ProfileSettings() {
    const { toast } = useToast()
    const { data: user, isLoading: userLoading } = useUser()
    const [loading, setLoading] = useState(false)
    const [showNewPassword, setShowNewPassword] = useState(false)
    const [showConfirmPassword, setShowConfirmPassword] = useState(false)
    const [formData, setFormData] = useState({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
    })

    const handlePasswordReset = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)

        if (formData.newPassword !== formData.confirmPassword) {
            toast({
                title: "Error",
                description: "New passwords do not match",
                variant: "destructive"
            })
            setLoading(false)
            return
        }

        if (formData.newPassword.length < 6) {
            toast({
                title: "Error",
                description: "Password must be at least 6 characters long",
                variant: "destructive"
            })
            setLoading(false)
            return
        }

        try {
            const { error } = await supabase.auth.updateUser({
                password: formData.newPassword
            })

            if (error) {
                throw error
            }

            toast({
                title: "Success",
                description: "Password updated successfully"
            })

            setFormData({
                currentPassword: "",
                newPassword: "",
                confirmPassword: ""
            })
        } catch (error) {
            console.error("Error updating password:", error)
            toast({
                title: "Error",
                description: error instanceof Error ? error.message : "Failed to update password",
                variant: "destructive"
            })
        } finally {
            setLoading(false)
        }
    }

    if (userLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin" />
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h3 className="text-lg font-medium">Profile Settings</h3>
                <p className="text-sm text-muted-foreground">
                    Manage your account settings and security
                </p>
            </div>

            <div className="grid gap-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Account Information</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Name</Label>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {user?.first_name} {user?.last_name}
                                </div>
                            </div>
                            <div>
                                <Label>Email</Label>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {user?.email}
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <Label>Role</Label>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {user?.role_name || "No role assigned"}
                                </div>
                            </div>
                            <div>
                                <Label>Team</Label>
                                <div className="text-sm text-muted-foreground mt-1">
                                    {user?.team_name || "No team assigned"}
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Change Password</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <form onSubmit={handlePasswordReset} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="newPassword">New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="newPassword"
                                        type={showNewPassword ? "text" : "password"}
                                        value={formData.newPassword}
                                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                                        placeholder="Enter new password"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowNewPassword(!showNewPassword)}
                                    >
                                        {showNewPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label htmlFor="confirmPassword">Confirm New Password</Label>
                                <div className="relative">
                                    <Input
                                        id="confirmPassword"
                                        type={showConfirmPassword ? "text" : "password"}
                                        value={formData.confirmPassword}
                                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                        placeholder="Confirm new password"
                                        required
                                    />
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                                        onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                    >
                                        {showConfirmPassword ? (
                                            <EyeOff className="h-4 w-4" />
                                        ) : (
                                            <Eye className="h-4 w-4" />
                                        )}
                                    </Button>
                                </div>
                            </div>

                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Updating Password...
                                    </>
                                ) : (
                                    "Update Password"
                                )}
                            </Button>
                        </form>
                    </CardContent>
                </Card>
            </div>
        </div>
    )
} 