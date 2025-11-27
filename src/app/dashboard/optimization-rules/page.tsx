'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { toast } from "sonner"
import { Separator } from "@/components/ui/separator"
import { Progress } from "@/components/ui/progress"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import {
  Plus,
  ArrowRight,
  DollarSign,
  Edit,
  Trash2,
  Play,
  BarChart3,
  Clock,
  Target,
  Zap,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  XCircle,
  Settings
} from "lucide-react"
import { OptimizationRule, RuleTestRequest, RuleTestResult, CreateRuleRequest, UpdateRuleRequest } from "@/types/optimization-rules"

const ruleFormSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  sourceModel: z.string().min(1, "Source model is required"),
  targetModel: z.string().min(1, "Target model is required"),
  enabled: z.boolean().optional(),
  priority: z.number().optional(),

  // Basic conditions
  promptLength: z.number().optional(),
  responseLength: z.number().optional(),
  keywords: z.string().optional(),
  timeOfDay: z.string().optional(),

  // Advanced conditions
  maxCostPerRequest: z.number().optional(),
  maxCostPerToken: z.number().optional(),
  requestType: z.string().optional(),
  fallbackChain: z.string().optional(),
})

type RuleFormValues = z.infer<typeof ruleFormSchema>

const testRequestSchema = z.object({
  model: z.string().min(1, "Model is required"),
  messages: z.string().min(1, "Messages are required"),
  requestType: z.string().min(1, "Request type is required"),
})

type TestRequestValues = z.infer<typeof testRequestSchema>

export default function OptimizationRulesPage() {
  const [rules, setRules] = useState<OptimizationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [editingRule, setEditingRule] = useState<OptimizationRule | null>(null)
  const [testingRule, setTestingRule] = useState<OptimizationRule | null>(null)
  const [testResult, setTestResult] = useState<RuleTestResult | null>(null)
  const [isTesting, setIsTesting] = useState(false)

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: '',
      sourceModel: '',
      targetModel: '',
      enabled: true,
      priority: 50,
      promptLength: undefined,
      responseLength: undefined,
      keywords: '',
      timeOfDay: undefined,
      maxCostPerRequest: undefined,
      maxCostPerToken: undefined,
      requestType: undefined,
      fallbackChain: '',
    }
  })

  const testForm = useForm<TestRequestValues>({
    resolver: zodResolver(testRequestSchema),
    defaultValues: {
      model: '',
      messages: '[{"role": "user", "content": "Test message for rule evaluation"}]',
      requestType: 'chat',
    }
  })

  useEffect(() => {
    fetchRules()
  }, [])

  const fetchRules = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/optimization-rules')
      if (!response.ok) {
        throw new Error('Failed to fetch rules')
      }
      const data = await response.json()
      setRules(data)
      setError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch rules')
    } finally {
      setLoading(false)
    }
  }

  const onSubmit = async (values: RuleFormValues) => {
    try {
      const conditions = {
        promptLength: values.promptLength,
        responseLength: values.responseLength,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()) : undefined,
        timeOfDay: values.timeOfDay,
        maxCostPerRequest: values.maxCostPerRequest,
        maxCostPerToken: values.maxCostPerToken,
        requestType: values.requestType,
        fallbackChain: values.fallbackChain ? values.fallbackChain.split(',').map(m => m.trim()) : undefined,
        priority: values.priority,
      }

      const ruleData: CreateRuleRequest = {
        name: values.name,
        sourceModel: values.sourceModel,
        targetModel: values.targetModel,
        conditions,
        enabled: values.enabled,
      }

      const response = await fetch('/api/optimization-rules', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to create rule')
      }

      const newRule = await response.json()
      setRules(prev => [newRule, ...prev])
      form.reset()
      setIsAddDialogOpen(false)
      setEditingRule(null)
      toast.success('Rule created successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create rule'
      setError(message)
      toast.error(message)
    }
  }

  const onEdit = async (values: RuleFormValues) => {
    if (!editingRule) return

    try {
      const conditions = {
        promptLength: values.promptLength,
        responseLength: values.responseLength,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()) : undefined,
        timeOfDay: values.timeOfDay,
        maxCostPerRequest: values.maxCostPerRequest,
        maxCostPerToken: values.maxCostPerToken,
        requestType: values.requestType,
        fallbackChain: values.fallbackChain ? values.fallbackChain.split(',').map(m => m.trim()) : undefined,
        priority: values.priority,
      }

      const updateData: UpdateRuleRequest = {
        id: editingRule.id,
        name: values.name,
        sourceModel: values.sourceModel,
        targetModel: values.targetModel,
        conditions,
        enabled: values.enabled,
      }

      const response = await fetch('/api/optimization-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData)
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update rule')
      }

      const updatedRule = await response.json()
      setRules(prev => prev.map(r => r.id === editingRule.id ? updatedRule : r))
      setEditingRule(null)
      toast.success('Rule updated successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rule'
      setError(message)
      toast.error(message)
    }
  }

  const toggleRule = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId)
      if (!rule) return

      const response = await fetch('/api/optimization-rules', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId, enabled: !rule.enabled })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to update rule')
      }

      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ))
      toast.success(`Rule ${!rule.enabled ? 'enabled' : 'disabled'}`)
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update rule'
      setError(message)
      toast.error(message)
    }
  }

  const deleteRule = async (ruleId: string) => {
    if (!confirm('Are you sure you want to delete this rule? This action cannot be undone.')) return

    try {
      const response = await fetch('/api/optimization-rules', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: ruleId })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to delete rule')
      }

      setRules(prev => prev.filter(r => r.id !== ruleId))
      toast.success('Rule deleted successfully!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete rule'
      setError(message)
      toast.error(message)
    }
  }

  const testRule = async (values: TestRequestValues) => {
    if (!testingRule) return

    setIsTesting(true)
    try {
      const messages = JSON.parse(values.messages)
      const testRequest: RuleTestRequest = {
        model: values.model,
        messages: messages,
        requestType: values.requestType as 'chat' | 'completion' | 'embedding',
      }

      const response = await fetch('/api/optimization-rules/test', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ruleId: testingRule.id, testRequest })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to test rule')
      }

      const result: RuleTestResult = await response.json()
      setTestResult(result)
      toast.success('Rule test completed!')
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to test rule'
      setError(message)
      toast.error(message)
    } finally {
      setIsTesting(false)
    }
  }

  const openEditDialog = (rule: OptimizationRule) => {
    setEditingRule(rule)
    form.reset({
      name: rule.name,
      sourceModel: rule.sourceModel,
      targetModel: rule.targetModel,
      enabled: rule.enabled,
      priority: rule.conditions.priority || 50,
      promptLength: rule.conditions.promptLength,
      responseLength: rule.conditions.responseLength,
      keywords: rule.conditions.keywords?.join(', '),
      timeOfDay: rule.conditions.timeOfDay,
      maxCostPerRequest: rule.conditions.maxCostPerRequest,
      maxCostPerToken: rule.conditions.maxCostPerToken,
      requestType: rule.conditions.requestType,
      fallbackChain: rule.conditions.fallbackChain?.join(', '),
    })
  }

  const openTestDialog = (rule: OptimizationRule) => {
    setTestingRule(rule)
    setTestResult(null)
    testForm.reset({
      model: rule.sourceModel,
      messages: '[{"role": "user", "content": "Test message for rule evaluation"}]',
      requestType: rule.conditions.requestType || 'chat',
    })
  }

  const formatConditions = (conditions: OptimizationRule['conditions']) => {
    const parts = []
    if (conditions.promptLength) parts.push(`Prompt < ${conditions.promptLength} chars`)
    if (conditions.responseLength) parts.push(`Response > ${conditions.responseLength} chars`)
    if (conditions.keywords?.length) parts.push(`Keywords: ${conditions.keywords.join(', ')}`)
    if (conditions.timeOfDay) parts.push(`Time: ${conditions.timeOfDay}`)
    if (conditions.requestType) parts.push(`Type: ${conditions.requestType}`)
    if (conditions.maxCostPerRequest) parts.push(`Max cost: $${conditions.maxCostPerRequest}`)
    if (conditions.fallbackChain?.length) parts.push(`Fallback: ${conditions.fallbackChain.join(' → ')}`)
    return parts.length > 0 ? parts.join(', ') : 'No conditions'
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Optimization Rules</h1>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Rule
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Add Optimization Rule</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Short prompts to cheaper model" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gpt-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gpt-3.5-turbo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="promptLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Length (chars)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responseLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Length (chars)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="simple, basic, quick" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeOfDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Day</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Any time</option>
                          <option value="off-peak">Off-peak (10 PM - 5 AM)</option>
                          <option value="business-hours">Business hours (9 AM - 5 PM)</option>
                          <option value="peak">Peak hours (5 PM - 10 PM)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Any type</option>
                          <option value="chat">Chat</option>
                          <option value="completion">Completion</option>
                          <option value="embedding">Embedding</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxCostPerRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Cost per Request ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.50"
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fallbackChain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fallback Models (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="gpt-3.5-turbo, claude-3-haiku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Rule</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Edit Dialog */}
        <Dialog open={!!editingRule} onOpenChange={(open) => !open && setEditingRule(null)}>
          <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
              <DialogTitle>Edit Optimization Rule</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onEdit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Rule Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Short prompts to cheaper model" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="sourceModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Source Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gpt-4" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="targetModel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Target Model</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., gpt-3.5-turbo" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="promptLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Prompt Length (chars)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="100"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="responseLength"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Response Length (chars)</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="500"
                            {...field}
                            onChange={e => field.onChange(e.target.value ? parseInt(e.target.value) : undefined)}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={form.control}
                  name="keywords"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Keywords (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="simple, basic, quick" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="timeOfDay"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time of Day</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Any time</option>
                          <option value="off-peak">Off-peak (10 PM - 5 AM)</option>
                          <option value="business-hours">Business hours (9 AM - 5 PM)</option>
                          <option value="peak">Peak hours (5 PM - 10 PM)</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="requestType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Request Type</FormLabel>
                      <FormControl>
                        <select
                          {...field}
                          className="w-full p-2 border rounded-md"
                        >
                          <option value="">Any type</option>
                          <option value="chat">Chat</option>
                          <option value="completion">Completion</option>
                          <option value="embedding">Embedding</option>
                        </select>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="maxCostPerRequest"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Max Cost per Request ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.01"
                          placeholder="0.50"
                          {...field}
                          onChange={e => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="fallbackChain"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Fallback Models (comma-separated)</FormLabel>
                      <FormControl>
                        <Input placeholder="gpt-3.5-turbo, claude-3-haiku" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <div className="flex justify-end gap-2">
                  <Button type="button" variant="outline" onClick={() => setEditingRule(null)}>
                    Cancel
                  </Button>
                  <Button type="submit">Update Rule</Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Test Dialog */}
        <Dialog open={!!testingRule} onOpenChange={(open) => !open && setTestingRule(null)}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>Test Rule: {testingRule?.name}</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <Form {...testForm}>
                <form onSubmit={testForm.handleSubmit(testRule)} className="space-y-4">
                  <FormField
                    control={testForm.control}
                    name="model"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Model</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., gpt-4" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testForm.control}
                    name="requestType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Request Type</FormLabel>
                        <FormControl>
                          <select
                            {...field}
                            className="w-full p-2 border rounded-md"
                          >
                            <option value="chat">Chat</option>
                            <option value="completion">Completion</option>
                            <option value="embedding">Embedding</option>
                          </select>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={testForm.control}
                    name="messages"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Messages</FormLabel>
                        <FormControl>
                          <textarea
                            {...field}
                            className="w-full p-2 border rounded-md min-h-[100px]"
                            placeholder='[{"role": "user", "content": "Hello world"}]'
                            onChange={(e) => {
                              try {
                                const parsed = JSON.parse(e.target.value)
                                field.onChange(parsed)
                              } catch {
                                // Invalid JSON, keep as string for now
                              }
                            }}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" disabled={isTesting}>
                    {isTesting ? 'Testing...' : 'Test Rule'}
                  </Button>
                </form>
              </Form>

              {testResult && (
                <div className="border rounded-lg p-4 space-y-2">
                  <h4 className="font-medium">Test Result</h4>
                  <div className="flex items-center gap-2">
                    {testResult.ruleMatched ? (
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-red-500" />
                    )}
                    <span className={testResult.ruleMatched ? 'text-green-600' : 'text-red-600'}>
                      {testResult.ruleMatched ? 'Rule matched' : 'Rule did not match'}
                    </span>
                  </div>
                  <p className="text-sm">
                    <strong>Model:</strong> {testResult.originalModel} → {testResult.targetModel}
                  </p>
                  <p className="text-sm">
                    <strong>Estimated savings:</strong> ${testResult.estimatedSavings.toFixed(4)}
                  </p>
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Matched conditions:</p>
                    <ul className="text-sm text-green-600 list-disc list-inside">
                      {testResult.matchedConditions.map((cond, i) => (
                        <li key={i}>{cond}</li>
                      ))}
                    </ul>
                  </div>
                  {testResult.failedConditions.length > 0 && (
                    <div className="space-y-1">
                      <p className="text-sm font-medium">Failed conditions:</p>
                      <ul className="text-sm text-red-600 list-disc list-inside">
                        {testResult.failedConditions.map((cond, i) => (
                          <li key={i}>{cond}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Loading optimization rules...</p>
        </div>
      )}

      {error && (
        <div className="text-center py-12">
          <p className="text-red-600">Error: {error}</p>
        </div>
      )}

      {!loading && !error && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {rules.map((rule) => (
            <Card key={rule.id}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{rule.name}</CardTitle>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openTestDialog(rule)}
                    className="h-8 w-8"
                  >
                    <Play className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => openEditDialog(rule)}
                    className="h-8 w-8"
                  >
                    <Edit className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRule(rule.id)}
                    className="h-8 w-8 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={() => toggleRule(rule.id)}
                  />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Badge variant="outline">{rule.sourceModel}</Badge>
                    <ArrowRight className="h-3 w-3" />
                    <Badge variant="outline">{rule.targetModel}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {formatConditions(rule.conditions)}
                  </p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                      <DollarSign className="h-3 w-3" />
                      ${rule.savings_usd.toFixed(2)} saved
                    </div>
                    {rule.metrics && (
                      <div className="text-xs text-muted-foreground space-y-1">
                        <div>Applications: {rule.metrics.total_applications}</div>
                        <div>Success rate: {(rule.metrics.success_rate * 100).toFixed(1)}%</div>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {!loading && !error && rules.length === 0 && (
        <div className="text-center py-12">
          <p className="text-muted-foreground">No optimization rules yet. Create your first rule to start saving on costs.</p>
        </div>
      )}
    </div>
  )
}