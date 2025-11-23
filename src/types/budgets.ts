export interface Budget {
  id: string
  type: string
  limit: number
  currentSpend: number
  alertThreshold: number
  status: 'active' | 'paused' | 'exceeded'
  notificationChannels: string[]
  createdAt: string
  updatedAt: string
}

export interface BudgetFormData {
  type: string
  limit: number
  alertThreshold: number
  notificationChannels: string[]
}