'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, Trash2, Key, CheckCircle, XCircle, Loader2 } from "lucide-react"
import { toast } from "sonner"

interface ApiKey {
  id: string
  provider: string
  nickname: string | null
  api_key: string
  status: string
  total_requests: number
  total_cost: number
}

const addApiKeySchema = z.object({
  provider: z.enum(['openai', 'anthropic', 'google']),
  api_key: z.string().min(1, 'API key is required'),
  nickname: z.string().optional()
})

type AddApiKeyForm = z.infer<typeof addApiKeySchema>

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [testingConnection, setTestingConnection] = useState(false)

  const form = useForm<AddApiKeyForm>({
    resolver: zodResolver(addApiKeySchema),
    defaultValues: {
      provider: 'openai',
      api_key: '',
      nickname: ''
    }
  })

  useEffect(() => {
    fetchApiKeys()
  }, [])

  const fetchApiKeys = async () => {
    try {
      const response = await fetch('/api/api-keys')
      if (response.ok) {
        const data = await response.json()
        setApiKeys(data)
      } else {
        toast.error('Failed to fetch API keys')
      }
    } catch {
      toast.error('Error fetching API keys')
    } finally {
      setLoading(false)
    }
  }

  const testConnection = async (provider: string, apiKey: string) => {
    setTestingConnection(true)
    try {
      const response = await fetch('/api/api-keys/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ provider, api_key: apiKey })
      })
      const result = await response.json()
      if (result.success) {
        toast.success('Connection test successful!')
        return true
      } else {
        toast.error(`Connection test failed: ${result.error}`)
        return false
      }
    } catch {
      toast.error('Connection test failed')
      return false
    } finally {
      setTestingConnection(false)
    }
  }

  const onSubmit = async (data: AddApiKeyForm) => {
    // Test connection first
    const testSuccess = await testConnection(data.provider, data.api_key)
    if (!testSuccess) return

    try {
      const response = await fetch('/api/api-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (response.ok) {
        toast.success('API key added successfully!')
        setDialogOpen(false)
        form.reset()
        fetchApiKeys()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to add API key')
      }
    } catch {
      toast.error('Error adding API key')
    }
  }

  const toggleStatus = async (id: string, currentStatus: string) => {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      const response = await fetch('/api/api-keys', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, status: newStatus })
      })
      if (response.ok) {
        toast.success(`API key ${newStatus === 'active' ? 'activated' : 'deactivated'}`)
        fetchApiKeys()
      } else {
        toast.error('Failed to update API key status')
      }
    } catch {
      toast.error('Error updating API key status')
    }
  }

  const deleteApiKey = async (id: string) => {
    if (!confirm('Are you sure you want to delete this API key?')) return
    try {
      const response = await fetch('/api/api-keys', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id })
      })
      if (response.ok) {
        toast.success('API key deleted successfully!')
        fetchApiKeys()
      } else {
        toast.error('Failed to delete API key')
      }
    } catch {
      toast.error('Error deleting API key')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">API Keys</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add API Key
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New API Key</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="provider"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Provider</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="openai">OpenAI</option>
                          <option value="anthropic">Anthropic</option>
                          <option value="google">Google</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="api_key"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>API Key</FormLabel>
                      <FormControl>
                        <Input {...field} type="password" placeholder="Enter your API key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="nickname"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nickname (Optional)</FormLabel>
                      <FormControl>
                        <Input {...field} placeholder="e.g., Production Key" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => testConnection(form.getValues('provider'), form.getValues('api_key'))}
                    disabled={testingConnection}
                  >
                    {testingConnection ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle className="h-4 w-4 mr-2" />}
                    Test Connection
                  </Button>
                  <Button type="submit">Save API Key</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {apiKeys.map((key) => (
          <Card key={key.id} className="backdrop-blur-md bg-card/50 border-border/50">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium flex items-center gap-2">
                <Key className="h-4 w-4" />
                {key.provider.charAt(0).toUpperCase() + key.provider.slice(1)}
              </CardTitle>
              <div className="flex items-center gap-2">
                <Switch
                  checked={key.status === 'active'}
                  onCheckedChange={() => toggleStatus(key.id, key.status)}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => deleteApiKey(key.id)}
                  className="text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <p className="text-sm font-medium">{key.nickname || 'No nickname'}</p>
                <p className="text-xs text-muted-foreground font-mono">{key.api_key}</p>
              </div>
              <div className="flex justify-between text-sm">
                <span>Requests: {key.total_requests}</span>
                <span>Cost: ${key.total_cost.toFixed(4)}</span>
              </div>
              <Badge variant={key.status === 'active' ? 'default' : 'secondary'}>
                {key.status === 'active' ? <CheckCircle className="h-3 w-3 mr-1" /> : <XCircle className="h-3 w-3 mr-1" />}
                {key.status}
              </Badge>
            </CardContent>
          </Card>
        ))}
      </div>

      {apiKeys.length === 0 && (
        <div className="text-center py-12">
          <Key className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium">No API keys yet</h3>
          <p className="text-muted-foreground">Add your first API key to get started.</p>
        </div>
      )}
    </div>
  )
}