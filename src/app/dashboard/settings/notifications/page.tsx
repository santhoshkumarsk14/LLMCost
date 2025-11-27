"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Bell, Mail, TestTube } from "lucide-react"
import { supabase } from "@/lib/supabase"

export default function NotificationsPage() {
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [apiKeyAlerts, setApiKeyAlerts] = useState(true)
  const [highCostAlerts, setHighCostAlerts] = useState(true)
  const [emailFrequency, setEmailFrequency] = useState("immediate")
  const [emailEnabled, setEmailEnabled] = useState(true)
  const [testing, setTesting] = useState(false)

  const handleTestNotification = async () => {
    setTesting(true)
    try {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        toast.error('User not authenticated')
        return
      }

      const response = await fetch('/api/notifications/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          user_id: user.id,
          type: 'test_notification',
          message: 'This is a test notification from your LLM Cost Tracker settings.',
        }),
      })

      if (response.ok) {
        toast.success('Test notification sent successfully!')
      } else {
        const error = await response.json()
        toast.error(`Failed to send test notification: ${error.error}`)
      }
    } catch (error) {
      toast.error('Failed to send test notification')
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Notification Settings</h1>
      </div>

      {/* Notification Preferences */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5" />
            Notification Preferences
          </CardTitle>
          <CardDescription>
            Configure which events trigger notifications
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Budget Alerts</Label>
              <p className="text-sm text-muted-foreground">
                Get notified when budgets approach or exceed limits
              </p>
            </div>
            <Switch
              checked={budgetAlerts}
              onCheckedChange={setBudgetAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">API Key Status Changes</Label>
              <p className="text-sm text-muted-foreground">
                Receive alerts when API keys become invalid or inactive
              </p>
            </div>
            <Switch
              checked={apiKeyAlerts}
              onCheckedChange={setApiKeyAlerts}
            />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">High-Cost Request Warnings</Label>
              <p className="text-sm text-muted-foreground">
                Alert for API requests exceeding cost thresholds
              </p>
            </div>
            <Switch
              checked={highCostAlerts}
              onCheckedChange={setHighCostAlerts}
            />
          </div>
        </CardContent>
      </Card>

      {/* Email Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Preferences
          </CardTitle>
          <CardDescription>
            Manage email notification settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label className="text-base">Enable Email Notifications</Label>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <Switch
              checked={emailEnabled}
              onCheckedChange={setEmailEnabled}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-base">Email Frequency</Label>
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="immediate"
                  name="frequency"
                  value="immediate"
                  checked={emailFrequency === "immediate"}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="immediate">Immediate</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="daily"
                  name="frequency"
                  value="daily"
                  checked={emailFrequency === "daily"}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="daily">Daily Digest</Label>
              </div>
              <div className="flex items-center space-x-2">
                <input
                  type="radio"
                  id="weekly"
                  name="frequency"
                  value="weekly"
                  checked={emailFrequency === "weekly"}
                  onChange={(e) => setEmailFrequency(e.target.value)}
                  className="h-4 w-4"
                />
                <Label htmlFor="weekly">Weekly Summary</Label>
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              How often to send email notifications
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Test Notifications */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TestTube className="h-5 w-5" />
            Test Notifications
          </CardTitle>
          <CardDescription>
            Send a test notification to verify your settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            onClick={handleTestNotification}
            disabled={testing || !emailEnabled}
            className="w-full"
          >
            {testing ? 'Sending...' : 'Send Test Notification'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}