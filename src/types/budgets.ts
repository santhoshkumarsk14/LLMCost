export interface Budget {
  id: string
  type: string
  budgetLimit: number
  currentSpend: number
  alertThreshold: number
  status: 'active' | 'paused' | 'exceeded'
  notificationChannels: string[]
  createdAt: string
  updatedAt: string
}

export interface BudgetFormData {
  type: string
  budgetLimit: number
  alertThreshold: number
  notificationChannels: string[]
}