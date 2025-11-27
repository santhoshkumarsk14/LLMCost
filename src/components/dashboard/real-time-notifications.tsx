"use client"

import { useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { toast } from "sonner"
import type { RealtimeChannel } from "@supabase/supabase-js"

interface BudgetRecord {
  id: string
  user_id: string
  type: string
  limit: number
  current_spend: number
  alert_threshold: number
  status: string
  notification_channels: string[]
  created_at: string
  updated_at: string
}

interface ApiKeyRecord {
  id: string
  user_id: string
  provider: string
  api_key: string
  nickname?: string
  status: string
  created_at: string
  updated_at: string
}

interface ApiRequestRecord {
  id: string
  user_id: string
  model: string
  cost: number
  created_at: string
}

export function RealTimeNotifications() {
  useEffect(() => {
    let budgetsChannel: RealtimeChannel
    let apiKeysChannel: RealtimeChannel
    let requestsChannel: RealtimeChannel

    const setupSubscriptions = async () => {
      const { data: { user } } = await supabase.auth.getUser()
      const userId = user?.id

      if (!userId) return

      // Subscribe to budgets table for threshold alerts
      budgetsChannel = supabase
        .channel('budget-alerts')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'budgets',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const budget = payload.new as BudgetRecord
            const oldBudget = payload.old as BudgetRecord

            // Check if current_spend exceeded alert threshold
            const alertThreshold = budget.alert_threshold * budget.limit
            const oldSpend = parseFloat(oldBudget.current_spend?.toString() || '0')
            const newSpend = parseFloat(budget.current_spend?.toString() || '0')

            if (newSpend > alertThreshold && oldSpend <= alertThreshold) {
              toast.warning(`Budget Alert: ${budget.type || 'Budget'} has exceeded alert threshold`, {
                description: `Current spend: $${newSpend.toFixed(4)}, Threshold: $${alertThreshold.toFixed(4)}`
              })
            }

            // Check if budget exceeded limit
            if (newSpend > budget.limit && oldSpend <= budget.limit) {
              toast.error(`Budget Exceeded: ${budget.type || 'Budget'} has exceeded its limit`, {
                description: `Current spend: $${newSpend.toFixed(4)}, Limit: $${budget.limit.toFixed(4)}`
              })
            }
          }
        )
        .subscribe()

      // Subscribe to api_keys table for status changes
      apiKeysChannel = supabase
        .channel('api-key-alerts')
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'api_keys',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const apiKey = payload.new as ApiKeyRecord
            const oldApiKey = payload.old as ApiKeyRecord

            // Check if status changed to invalid
            if (apiKey.status === 'invalid' && oldApiKey.status !== 'invalid') {
              toast.error(`API Key Issue: ${apiKey.provider} API key is invalid`, {
                description: `Please update your ${apiKey.provider} API key in settings.`
              })
            }

            // Check if status changed to inactive
            if (apiKey.status === 'inactive' && oldApiKey.status !== 'inactive') {
              toast.warning(`API Key Deactivated: ${apiKey.provider} API key has been deactivated`, {
                description: `API key is no longer active.`
              })
            }
          }
        )
        .subscribe()

      // Subscribe to api_requests table for high-cost requests
      requestsChannel = supabase
        .channel('high-cost-alerts')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'api_requests',
            filter: `user_id=eq.${userId}`
          },
          (payload) => {
            const request = payload.new as ApiRequestRecord
            const cost = parseFloat(request.cost?.toString() || '0')

            // Alert for requests costing more than $0.10
            if (cost > 0.10) {
              toast.info(`High Cost Request: $${cost.toFixed(4)} for ${request.model}`, {
                description: `Request ID: ${request.id}`
              })
            }
          }
        )
        .subscribe()
    }

    setupSubscriptions()

    return () => {
      if (budgetsChannel) supabase.removeChannel(budgetsChannel)
      if (apiKeysChannel) supabase.removeChannel(apiKeysChannel)
      if (requestsChannel) supabase.removeChannel(requestsChannel)
    }
  }, [])

  return null
}