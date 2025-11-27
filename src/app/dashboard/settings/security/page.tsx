"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import {
  Lock,
  Shield,
  Key,
  Monitor,
  Eye,
  EyeOff,
  RefreshCw,
  Trash2,
  CheckCircle,
  XCircle
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
  confirmPassword: z.string().min(1, "Please confirm your password"),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
})

type PasswordForm = z.infer<typeof passwordSchema>

interface ApiKey {
  id: string
  provider: string
  api_key: string
  nickname?: string
  status: string
  created_at: string
}

interface Session {
  id: string
  device: string
  location: string
  last_active: string
  current: boolean
}

export default function SecurityPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [sessions, setSessions] = useState<Session[]>([])
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)
  const [loading, setLoading] = useState(true)
  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false)
  const [visibleKeys, setVisibleKeys] = useState<Set<string>>(new Set())

  const passwordForm = useForm<PasswordForm>({
    resolver: zodResolver(passwordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  })

  useEffect(() => {
    loadSecurityData()
    ;(async () => {
      await setupRealtimeSubscriptions()
    })()
  }, [])

  const loadSecurityData = async () => {
    try {
      setLoading(true)

      // Load API keys
      const { data: keys, error: keysError } = await supabase
        .from('api_keys')
        .select('*')
        .eq('user_id', (await supabase.auth.getUser()).data.user?.id)

      if (keysError) throw keysError
      setApiKeys(keys || [])

      // Load sessions (mock data for now - would need sessions table)
      setSessions([
        {
          id: '1',
          device: 'Chrome on Windows',
          location: 'New York, US',
          last_active: new Date().toISOString(),
          current: true
        },
        {
          id: '2',
          device: 'Safari on iPhone',
          location: 'London, UK',
          last_active: new Date(Date.now() - 3600000).toISOString(),
          current: false
        }
      ])

      // Check 2FA status
      const { data: { user } } = await supabase.auth.getUser()
      setTwoFactorEnabled(user?.user_metadata?.mfa_enabled || false)

    } catch (error) {
      toast.error('Failed to load security data')
    } finally {
      setLoading(false)
    }
  }

  const setupRealtimeSubscriptions = async () => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    // Subscribe to API key changes
    const apiKeysChannel = supabase
      .channel('security-api-keys')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'api_keys',
          filter: `user_id=eq.${user.id}`
        },
        () => {
          loadSecurityData()
        }
      )
      .subscribe()

    // Subscribe to auth changes for 2FA status
    const authChannel = supabase
      .channel('security-auth')
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'auth',
          table: 'users',
          filter: `id=eq.${user.id}`
        },
        (payload) => {
          const updatedUser = payload.new
          setTwoFactorEnabled(updatedUser?.user_metadata?.mfa_enabled || false)
        }
      )
      .subscribe()

    return () => {
      supabase.removeChannel(apiKeysChannel)
      supabase.removeChannel(authChannel)
    }
  }

  const handlePasswordChange = async (data: PasswordForm) => {
    try {
      const { error } = await supabase.auth.updateUser({
        password: data.newPassword
      })

      if (error) throw error

      toast.success('Password updated successfully')
      passwordForm.reset()
      setPasswordDialogOpen(false)
    } catch (error) {
      toast.error('Failed to update password')
    }
  }

  const toggleKeyVisibility = (keyId: string) => {
    setVisibleKeys(prev => {
      const newSet = new Set(prev)
      if (newSet.has(keyId)) {
        newSet.delete(keyId)
      } else {
        newSet.add(keyId)
      }
      return newSet
    })
  }

  const regenerateApiKey = async (keyId: string) => {
    try {
      // Generate new key (would need backend implementation)
      const newKey = `sk-${Math.random().toString(36).substring(2)}`

      const response = await fetch('/api/api-keys/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: keyId, newKey })
      })

      if (!response.ok) throw new Error('Failed to regenerate key')

      toast.success('API key regenerated successfully')
      loadSecurityData()
    } catch (error) {
      toast.error('Failed to regenerate API key')
    }
  }

  const revokeSession = async (sessionId: string) => {
    try {
      // Mock implementation - would need sessions API
      setSessions(prev => prev.filter(s => s.id !== sessionId))
      toast.success('Session revoked successfully')
    } catch (error) {
      toast.error('Failed to revoke session')
    }
  }

  const toggleTwoFactor = async () => {
    try {
      if (twoFactorEnabled) {
        // Disable 2FA
        const { error } = await supabase.auth.mfa.unenroll({
          factorId: 'totp' // Would need to get actual factor ID
        })
        if (error) throw error
        setTwoFactorEnabled(false)
        toast.success('Two-factor authentication disabled')
      } else {
        // Enable 2FA - would need proper setup flow
        toast.info('2FA setup not implemented yet')
      }
    } catch (error) {
      toast.error('Failed to update 2FA settings')
    }
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Security Settings</h1>
      </div>

      {/* Password Change */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Password
          </CardTitle>
          <CardDescription>
            Update your account password
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog open={passwordDialogOpen} onOpenChange={setPasswordDialogOpen}>
            <DialogTrigger asChild>
              <Button>Change Password</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                  Enter your current password and choose a new one.
                </DialogDescription>
              </DialogHeader>
              <Form {...passwordForm}>
                <form onSubmit={passwordForm.handleSubmit(handlePasswordChange)} className="space-y-4">
                  <FormField
                    control={passwordForm.control}
                    name="currentPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Current Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="newPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormDescription>
                          Must be at least 8 characters long
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={passwordForm.control}
                    name="confirmPassword"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Confirm New Password</FormLabel>
                        <FormControl>
                          <Input type="password" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={() => setPasswordDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit">Update Password</Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>

      {/* Two-Factor Authentication */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Two-Factor Authentication
          </CardTitle>
          <CardDescription>
            Add an extra layer of security to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable 2FA</Label>
              <p className="text-sm text-muted-foreground">
                Secure your account with two-factor authentication
              </p>
            </div>
            <div className="flex items-center gap-2">
              {twoFactorEnabled ? (
                <CheckCircle className="h-5 w-5 text-green-500" />
              ) : (
                <XCircle className="h-5 w-5 text-red-500" />
              )}
              <Switch
                checked={twoFactorEnabled}
                onCheckedChange={toggleTwoFactor}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* API Key Security */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Key className="h-5 w-5" />
            API Key Security
          </CardTitle>
          <CardDescription>
            Manage your API keys and their security settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {apiKeys.length === 0 ? (
            <p className="text-sm text-muted-foreground">No API keys found</p>
          ) : (
            apiKeys.map((key) => (
              <div key={key.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Label className="font-medium">{key.provider}</Label>
                    <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                      {key.status}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    <code className="text-sm bg-muted px-2 py-1 rounded">
                      {visibleKeys.has(key.id) ? key.api_key : '••••••••••••••••'}
                    </code>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleKeyVisibility(key.id)}
                    >
                      {visibleKeys.has(key.id) ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                  {key.nickname && (
                    <p className="text-sm text-muted-foreground">{key.nickname}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => regenerateApiKey(key.id)}
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {/* Active Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Monitor className="h-5 w-5" />
            Active Sessions
          </CardTitle>
          <CardDescription>
            Manage devices that are signed in to your account
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {sessions.map((session) => (
            <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label className="font-medium">{session.device}</Label>
                  {session.current && <Badge>Current</Badge>}
                </div>
                <p className="text-sm text-muted-foreground">{session.location}</p>
                <p className="text-sm text-muted-foreground">
                  Last active: {new Date(session.last_active).toLocaleString()}
                </p>
              </div>
              {!session.current && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => revokeSession(session.id)}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  )
}