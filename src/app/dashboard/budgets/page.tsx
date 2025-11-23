"use client"

import { Budget } from "@/types/budgets"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Plus } from "lucide-react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { useState } from "react"

const budgetFormSchema = z.object({
  type: z.string().min(1, "Budget type is required"),
  limit: z.number().min(0, "Limit must be positive"),
  alertThreshold: z.number().min(0).max(100, "Threshold must be between 0 and 100"),
  notificationChannels: z.array(z.string()).min(1, "At least one notification channel is required")
})

type BudgetFormData = z.infer<typeof budgetFormSchema>

function getBudgetsData(): {
  totalSpend: number
  budgets: Budget[]
} {
  // Mock data for now
  const budgets: Budget[] = [
    {
      id: "1",
      type: "Monthly API Budget",
      limit: 1000,
      currentSpend: 650,
      alertThreshold: 80,
      status: "active",
      notificationChannels: ["email", "slack"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-15T00:00:00Z"
    },
    {
      id: "2",
      type: "GPT-4 Budget",
      limit: 500,
      currentSpend: 320,
      alertThreshold: 75,
      status: "active",
      notificationChannels: ["email"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-10T00:00:00Z"
    },
    {
      id: "3",
      type: "Development Budget",
      limit: 200,
      currentSpend: 180,
      alertThreshold: 90,
      status: "active",
      notificationChannels: ["email", "slack"],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-12T00:00:00Z"
    }
  ]

  const totalSpend = budgets.reduce((sum, budget) => sum + budget.currentSpend, 0)

  return {
    totalSpend,
    budgets
  }
}

export default function BudgetsPage() {
  const { totalSpend, budgets } = getBudgetsData()
  const [isModalOpen, setIsModalOpen] = useState(false)
  const form = useForm<BudgetFormData>({
    resolver: zodResolver(budgetFormSchema),
    defaultValues: {
      type: "",
      limit: 0,
      alertThreshold: 80,
      notificationChannels: []
    }
  })

  const onSubmit = (data: BudgetFormData) => {
    console.log("New budget:", data)
    // TODO: Add budget to list
    setIsModalOpen(false)
    form.reset()
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Budgets</h1>
        <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Budget
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Add New Budget</DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Budget Type</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Monthly API Budget" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="limit"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Limit Amount ($)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="1000"
                          {...field}
                          onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="alertThreshold"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alert Threshold (%)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="0"
                          max="100"
                          placeholder="80"
                          {...field}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="notificationChannels"
                  render={() => (
                    <FormItem>
                      <FormLabel>Notification Channels</FormLabel>
                      <div className="space-y-2">
                        {["email", "slack", "sms"].map((channel) => (
                          <FormField
                            key={channel}
                            control={form.control}
                            name="notificationChannels"
                            render={({ field }) => (
                              <FormItem className="flex items-center space-x-2">
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(channel)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, channel])
                                        : field.onChange(field.value?.filter((value) => value !== channel))
                                    }}
                                  />
                                </FormControl>
                                <FormLabel className="capitalize">{channel}</FormLabel>
                              </FormItem>
                            )}
                          />
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full">Create Budget</Button>
              </form>
            </Form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Current Spend Display */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="backdrop-blur-md bg-card/50 border-border/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Current Spend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalSpend.toFixed(2)}</div>
            <p className="text-xs text-muted-foreground">
              Across all budgets
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Budgets List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {budgets.map((budget) => (
          <Card key={budget.id} className="backdrop-blur-md bg-card/50 border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">{budget.type}</CardTitle>
                <Badge variant={budget.status === 'active' ? 'default' : budget.status === 'paused' ? 'secondary' : 'destructive'}>
                  {budget.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Current Spend</span>
                  <span>${budget.currentSpend.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Limit</span>
                  <span>${budget.limit.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Alert Threshold</span>
                  <span>{budget.alertThreshold}%</span>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>{((budget.currentSpend / budget.limit) * 100).toFixed(1)}%</span>
                </div>
                <Progress value={(budget.currentSpend / budget.limit) * 100} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}