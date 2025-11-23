'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Plus, ArrowRight, DollarSign } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface OptimizationRule {
  id: string
  name: string
  sourceModel: string
  targetModel: string
  conditions: {
    promptLength?: number
    responseLength?: number
    keywords?: string[]
    timeOfDay?: string
  }
  enabled: boolean
  savings: number
}

const ruleFormSchema = z.object({
  name: z.string().min(1, "Rule name is required"),
  sourceModel: z.string().min(1, "Source model is required"),
  targetModel: z.string().min(1, "Target model is required"),
  promptLength: z.number().optional(),
  responseLength: z.number().optional(),
  keywords: z.string().optional(),
  timeOfDay: z.string().optional(),
})

type RuleFormValues = z.infer<typeof ruleFormSchema>


export default function OptimizationRulesPage() {
  const [rules, setRules] = useState<OptimizationRule[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)

  const form = useForm<RuleFormValues>({
    resolver: zodResolver(ruleFormSchema),
    defaultValues: {
      name: '',
      sourceModel: '',
      targetModel: '',
      promptLength: undefined,
      responseLength: undefined,
      keywords: '',
      timeOfDay: '',
    }
  })

  useEffect(() => {
    const fetchRules = async () => {
      try {
        setLoading(true)
        const { data, error } = await supabase
          .from('optimization_rules')
          .select('*')
          .order('created_at', { ascending: false })

        if (error) throw error

        const mappedRules: OptimizationRule[] = data.map(rule => ({
          id: rule.id,
          name: rule.name,
          sourceModel: rule.source_model,
          targetModel: rule.target_model,
          conditions: rule.conditions || {},
          enabled: rule.enabled,
          savings: rule.savings
        }))

        setRules(mappedRules)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch rules')
      } finally {
        setLoading(false)
      }
    }

    fetchRules()
  }, [])

  const onSubmit = async (values: RuleFormValues) => {
    try {
      const conditions = {
        promptLength: values.promptLength,
        responseLength: values.responseLength,
        keywords: values.keywords ? values.keywords.split(',').map(k => k.trim()) : undefined,
        timeOfDay: values.timeOfDay,
      }

      const { data, error } = await supabase
        .from('optimization_rules')
        .insert({
          name: values.name,
          source_model: values.sourceModel,
          target_model: values.targetModel,
          conditions,
          enabled: true,
          savings: 0
        })
        .select()
        .single()

      if (error) throw error

      const newRule: OptimizationRule = {
        id: data.id,
        name: data.name,
        sourceModel: data.source_model,
        targetModel: data.target_model,
        conditions: data.conditions,
        enabled: data.enabled,
        savings: data.savings
      }

      setRules(prev => [newRule, ...prev])
      form.reset()
      setIsAddDialogOpen(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create rule')
    }
  }

  const toggleRule = async (ruleId: string) => {
    try {
      const rule = rules.find(r => r.id === ruleId)
      if (!rule) return

      const { error } = await supabase
        .from('optimization_rules')
        .update({ enabled: !rule.enabled })
        .eq('id', ruleId)

      if (error) throw error

      setRules(prev => prev.map(r =>
        r.id === ruleId ? { ...r, enabled: !r.enabled } : r
      ))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update rule')
    }
  }

  const formatConditions = (conditions: OptimizationRule['conditions']) => {
    const parts = []
    if (conditions.promptLength) parts.push(`Prompt < ${conditions.promptLength} chars`)
    if (conditions.responseLength) parts.push(`Response > ${conditions.responseLength} chars`)
    if (conditions.keywords?.length) parts.push(`Keywords: ${conditions.keywords.join(', ')}`)
    if (conditions.timeOfDay) parts.push(`Time: ${conditions.timeOfDay}`)
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
                        <Input placeholder="e.g., off-peak, business-hours" {...field} />
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
                <Switch
                  checked={rule.enabled}
                  onCheckedChange={() => toggleRule(rule.id)}
                />
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
                  <div className="flex items-center gap-1 text-sm font-medium text-green-600">
                    <DollarSign className="h-3 w-3" />
                    ${rule.savings.toFixed(2)} saved
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